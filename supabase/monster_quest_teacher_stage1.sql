-- =====================================================================
-- MONSTER QUEST  -  Teacher update, stage 1: target questions at classes
-- Run once in the Supabase SQL editor (safe to re-run).
-- Needs: monster_quest_patch.sql, monster_quest_phase2_patch.sql (and the
--        roster / explorers patches you already ran).
--
-- What it does
--  1. mq_questions gets class_ids (uuid[]). Empty = shown to every student
--     (exactly how all existing questions behave today, nothing changes
--     until a teacher picks classes).
--  2. mq_eligible(question, user) decides who may receive a question:
--       - no classes chosen            -> everyone
--       - classes chosen               -> students enrolled in one of them,
--                                         and the teacher who owns that class
--  3. The three places that pick a question (wild encounters and training
--     via mq_next_question, and the special attack in mq_battle_act) now only
--     pick eligible questions.
--  4. A trigger stops a teacher targeting a class that is not theirs.
--  5. mq_set_question_audience(): bulk change of the audience.
-- =====================================================================
begin;

alter table public.mq_questions add column if not exists class_ids uuid[] not null default '{}';
create index if not exists mq_questions_class_ids_idx on public.mq_questions using gin (class_ids);

-- ---------------------------------------------------------- eligibility
create or replace function public.mq_eligible(q public.mq_questions, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select cardinality(q.class_ids) = 0
      or exists (select 1 from public.class_students cs where cs.student_id = p_user and cs.class_id = any(q.class_ids))
      or exists (select 1 from public.classes c where c.teacher_id = p_user and c.id = any(q.class_ids));
$$;

-- --------------------------------------------- only target your own classes
create or replace function public.mq_questions_check_classes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- no signed-in user = the SQL editor / service role: trusted, nothing to check
  if cardinality(new.class_ids) = 0 or auth.uid() is null or public.is_admin() then return new; end if;
  if exists (select 1 from unnest(new.class_ids) cid
             where not exists (select 1 from public.classes c where c.id = cid and c.teacher_id = auth.uid())) then
    raise exception 'You can only target your own classes';
  end if;
  return new;
end;
$$;
drop trigger if exists mq_questions_check_classes on public.mq_questions;
create trigger mq_questions_check_classes before insert or update of class_ids on public.mq_questions
  for each row execute function public.mq_questions_check_classes();

-- ------------------------------------------------- bulk audience change
-- p_class_ids = '{}' means everyone. Only the owner (or an admin) can change a question.
create or replace function public.mq_set_question_audience(p_ids uuid[], p_class_ids uuid[])
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not (public.is_teacher() or public.is_admin()) then raise exception 'teachers only'; end if;
  if not public.is_admin() and exists (select 1 from unnest(coalesce(p_class_ids, '{}'::uuid[])) cid
        where not exists (select 1 from public.classes c where c.id = cid and c.teacher_id = auth.uid())) then
    raise exception 'You can only target your own classes';
  end if;
  update public.mq_questions set class_ids = coalesce(p_class_ids, '{}')
   where id = any(p_ids) and (public.is_admin() or created_by = auth.uid());
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------- question pickers (patched copies of phase 2)
create or replace function public.mq_next_question(p_encounter uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  e public.mq_encounters; s public.mq_species; z public.mq_zones; q public.mq_questions; d int; lo int; hi int;
begin
  select * into e from public.mq_encounters where id = p_encounter and user_id = uid;
  if e.id is null or e.status <> 'active' then raise exception 'this encounter is over'; end if;
  select * into s from public.mq_species where id = e.species_id;
  if e.kind = 'train' then
    d := least(5, 1 + e.level / 8);
  else
    select * into z from public.mq_zones where id = e.zone_id;
    d := least(5, greatest(1, round((s.capture_difficulty + coalesce(z.difficulty, 1)) / 2.0)::int));
  end if;
  lo := greatest(1, d - 1); hi := least(5, d + 1);
  select * into q from public.mq_questions where active and public.mq_eligible(mq_questions, uid) and difficulty between lo and hi and not (id = any(e.asked)) order by random() limit 1;
  if q.id is null then select * into q from public.mq_questions where active and public.mq_eligible(mq_questions, uid) and difficulty between lo and hi order by random() limit 1; end if;
  if q.id is null then select * into q from public.mq_questions where active and public.mq_eligible(mq_questions, uid) order by random() limit 1; end if;
  if q.id is null then raise exception 'the question bank is empty'; end if;
  update public.mq_encounters set current_question_id = q.id, current_started_at = now(),
         asked = (array_append(asked, q.id))[greatest(1, cardinality(asked) - 18):] where id = e.id;
  return mq_public_question(q);
end;
$$;

create or replace function public.mq_battle_act(p_battle uuid, p_action text, p_arg text default null, p_answer jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  b public.mq_battles; P jsonb; O jsonb; pa int; oa int; ev jsonb := '[]'::jsonb;
  q public.mq_questions; ms int; late boolean; special_ok boolean := false; d int; sxp int := 0;
  act text := p_action; psf boolean := true; phase int; pdef boolean := false; player_lost_turn boolean := false;
  ended text := null; power int; crit boolean; mult numeric; dmg int; newhp int; pm jsonb; om jsonb; idx int; i int; nxt int;
  it public.mq_items; have int; heal int;
  avgl numeric; dm numeric; coin_reward int; tx int; mx int; usedb int; lvls jsonb := '[]'::jsonb; mres jsonb; res jsonb;
begin
  select * into b from public.mq_battles where id = p_battle and user_id = uid for update;
  if b.id is null or b.status <> 'active' then raise exception 'this battle is over'; end if;
  P := b.player; O := b.opp; pa := b.p_active; oa := b.o_active;

  if b.pending_question is not null then
    if act = 'cancel' then
      update public.mq_battles set pending_question = null, pending_started_at = null where id = b.id returning * into b;
      return public.mq_battle_view(b, '[]'::jsonb);
    elsif act <> 'answer' then
      raise exception 'answer the question or cancel the special attack';
    end if;
  elsif act = 'answer' then raise exception 'no question is waiting';
  elsif act = 'cancel' then return public.mq_battle_view(b, '[]'::jsonb);
  end if;

  if act = 'special' then
    d := least(5, 1 + ((P -> pa ->> 'level')::int) / 7);
    select * into q from public.mq_questions where active and public.mq_eligible(mq_questions, uid) and difficulty between greatest(1, d - 1) and least(5, d + 1) order by random() limit 1;
    if q.id is null then select * into q from public.mq_questions where active and public.mq_eligible(mq_questions, uid) order by random() limit 1; end if;
    if q.id is null then raise exception 'the question bank is empty'; end if;
    update public.mq_battles set pending_question = q.id, pending_started_at = now() where id = b.id returning * into b;
    return public.mq_battle_view(b, '[]'::jsonb);
  end if;

  if act not in ('attack','defend','switch','item','answer') then raise exception 'unknown action'; end if;

  if act = 'switch' then
    idx := p_arg::int;
    if idx is null or idx < 0 or idx >= jsonb_array_length(P) or idx = pa or (P -> idx ->> 'fainted')::boolean then raise exception 'you cannot switch to that monster'; end if;
  elsif act = 'item' then
    select * into it from public.mq_items where key = p_arg and kind = 'potion' and active;
    if it.key is null then raise exception 'that item cannot be used in battle'; end if;
    select qty into have from public.mq_inventory where user_id = uid and item_key = it.key for update;
    if coalesce(have, 0) < 1 then raise exception 'you do not have any %', it.name; end if;
    if (P -> pa ->> 'hp')::int >= (P -> pa ->> 'max')::int then raise exception 'its HP is already full'; end if;
  elsif act = 'answer' then
    select * into q from public.mq_questions where id = b.pending_question;
    ms := (extract(epoch from (now() - b.pending_started_at)) * 1000)::int;
    late := q.time_limit_s is not null and ms > (q.time_limit_s + 6) * 1000;
    special_ok := (not late) and public.mq_check(q, p_answer);
    if special_ok then
      sxp := greatest(0, least(mq_cfg('special_xp', 3)::int, mq_cfg('daily_xp_cap', 400)::int - mq_xp_today(uid)));
    end if;
    insert into public.mq_answers (user_id, encounter_id, question_id, correct, xp_awarded, response_ms) values (uid, null, q.id, special_ok, sxp, ms);
    if special_ok then
      update public.mq_players set correct_total = correct_total + 1 where user_id = uid;
      if sxp > 0 then update public.profiles set total_xp = total_xp + sxp where id = uid; end if;
      perform public.mq_bump(uid, 'answer', 1);
    else
      update public.mq_players set wrong_total = wrong_total + 1 where user_id = uid;
    end if;
    ev := ev || jsonb_build_object('kind', 'quiz', 'side', 'player', 'correct', special_ok, 'late', late, 'explanation', q.explanation, 'answer', q.answer,
      'text', case when special_ok then 'Correct! The attack is supercharged!' when late then 'Too slow! The attack fizzles.' else 'Wrong answer! The attack is weak.' end);
  end if;

  if act in ('attack','answer') and (O -> oa ->> 'spd')::int > (P -> pa ->> 'spd')::int then psf := false; end if;

  for phase in 1 .. 2 loop
    exit when ended is not null;
    if (phase = 1) = psf then
      -- ------------------------------------------------ the player acts
      if player_lost_turn then continue; end if;
      pm := P -> pa; om := O -> oa;
      if act in ('attack','answer') then
        power := case when act = 'attack' then 45 when special_ok then 90 else 25 end;
        crit := (act = 'answer' and special_ok and random() < 0.5) or random() < 0.0625;
        mult := public.mq_type_mult(pm ->> 'type', om ->> 'type');
        dmg := public.mq_damage((pm ->> 'level')::int, power, (pm ->> 'atk')::int, (om ->> 'def')::int, mult, crit, false);
        newhp := greatest(0, (om ->> 'hp')::int - dmg);
        O := jsonb_set(O, array[oa::text, 'hp'], to_jsonb(newhp));
        ev := ev || jsonb_build_object('side', 'player', 'kind', case when act = 'answer' then 'special' else 'attack' end,
          'text', (pm ->> 'name') || case when act = 'answer' then ' unleashes a special attack!' else ' attacks!' end,
          'target', 'opp', 'idx', oa, 'dmg', dmg, 'hp_after', newhp, 'eff', case when mult > 1 then 'super' when mult < 1 then 'weak' end, 'crit', crit);
        if newhp = 0 then
          O := jsonb_set(O, array[oa::text, 'fainted'], 'true'::jsonb);
          ev := ev || jsonb_build_object('side', 'opp', 'kind', 'faint', 'text', (om ->> 'name') || ' fainted!', 'target', 'opp', 'idx', oa);
          nxt := null;
          for i in 0 .. jsonb_array_length(O) - 1 loop if not (O -> i ->> 'fainted')::boolean then nxt := i; exit; end if; end loop;
          if nxt is null then ended := 'won'; else
            oa := nxt;
            ev := ev || jsonb_build_object('side', 'opp', 'kind', 'info', 'text', b.opp_name || ' sends out ' || (O -> oa ->> 'name') || '!', 'target', 'opp', 'idx', oa);
          end if;
        end if;
      elsif act = 'defend' then
        pdef := true;
        ev := ev || jsonb_build_object('side', 'player', 'kind', 'defend', 'text', (pm ->> 'name') || ' braces for impact!');
      elsif act = 'switch' then
        pa := idx; P := jsonb_set(P, array[pa::text, 'used'], 'true'::jsonb);
        ev := ev || jsonb_build_object('side', 'player', 'kind', 'switch', 'text', 'Go, ' || (P -> pa ->> 'name') || '!', 'target', 'player', 'idx', pa);
      elsif act = 'item' then
        heal := it.effect;
        newhp := least((pm ->> 'max')::int, (pm ->> 'hp')::int + heal);
        P := jsonb_set(P, array[pa::text, 'hp'], to_jsonb(newhp));
        update public.mq_inventory set qty = qty - 1 where user_id = uid and item_key = it.key;
        ev := ev || jsonb_build_object('side', 'player', 'kind', 'item', 'text', (pm ->> 'name') || ' recovers ' || (newhp - (pm ->> 'hp')::int) || ' HP!',
          'target', 'player', 'idx', pa, 'hp_after', newhp, 'heal', newhp - (pm ->> 'hp')::int);
      end if;
    else
      -- --------------------------------------------- the opponent acts
      pm := P -> pa; om := O -> oa;
      power := case when random() < 0.25 then 80 else 45 end;
      crit := random() < 0.0625;
      mult := public.mq_type_mult(om ->> 'type', pm ->> 'type');
      dmg := public.mq_damage((om ->> 'level')::int, power, (om ->> 'atk')::int, (pm ->> 'def')::int, mult, crit, pdef);
      newhp := greatest(0, (pm ->> 'hp')::int - dmg);
      P := jsonb_set(P, array[pa::text, 'hp'], to_jsonb(newhp));
      ev := ev || jsonb_build_object('side', 'opp', 'kind', case when power = 80 then 'special' else 'attack' end,
        'text', (om ->> 'name') || case when power = 80 then ' uses a strong attack!' else ' attacks!' end,
        'target', 'player', 'idx', pa, 'dmg', dmg, 'hp_after', newhp, 'eff', case when mult > 1 then 'super' when mult < 1 then 'weak' end, 'crit', crit, 'blocked', pdef);
      if newhp = 0 then
        P := jsonb_set(P, array[pa::text, 'fainted'], 'true'::jsonb);
        ev := ev || jsonb_build_object('side', 'player', 'kind', 'faint', 'text', (pm ->> 'name') || ' fainted!', 'target', 'player', 'idx', pa);
        nxt := null;
        for i in 0 .. jsonb_array_length(P) - 1 loop if not (P -> i ->> 'fainted')::boolean then nxt := i; exit; end if; end loop;
        if nxt is null then ended := 'lost'; else
          pa := nxt; player_lost_turn := true; P := jsonb_set(P, array[pa::text, 'used'], 'true'::jsonb);
          ev := ev || jsonb_build_object('side', 'player', 'kind', 'info', 'text', 'Go, ' || (P -> pa ->> 'name') || '!', 'target', 'player', 'idx', pa);
        end if;
      end if;
    end if;
  end loop;

  if ended is null then
    update public.mq_battles set player = P, opp = O, p_active = pa, o_active = oa, turn = turn + 1, pending_question = null, pending_started_at = null
      where id = b.id returning * into b;
    return public.mq_battle_view(b, ev);
  end if;

  -- ------------------------------------------------------- battle over
  select avg((e ->> 'level')::int) into avgl from jsonb_array_elements(O) e;
  dm := case b.difficulty when 'easy' then 1 when 'normal' then 1.5 else 2.2 end;
  if ended = 'won' then
    coin_reward := round((20 + avgl * 2) * dm)::int; tx := round((10 + avgl) * dm)::int; mx := round((15 + avgl) * dm)::int;
  else coin_reward := 5; tx := 0; mx := 5; end if;
  select coalesce(sum((result ->> 'xp')::int), 0) into usedb from public.mq_battles where user_id = uid and created_at >= date_trunc('day', now()) and id <> b.id;
  tx := greatest(0, least(tx, mq_cfg('battle_daily_xp_cap', 250)::int - usedb));
  for i in 0 .. jsonb_array_length(P) - 1 loop
    if (P -> i ->> 'used')::boolean then
      mres := public.mq_add_monster_xp((P -> i ->> 'id')::uuid, mx);
      if mres is not null then lvls := lvls || jsonb_build_object('id', P -> i ->> 'id', 'name', P -> i ->> 'name', 'level', mres -> 'level', 'levels_gained', mres -> 'levels_gained'); end if;
    end if;
  end loop;
  update public.mq_players set coins = mq_players.coins + coin_reward, battles_won = battles_won + (case when ended = 'won' then 1 else 0 end),
    battles_lost = battles_lost + (case when ended = 'lost' then 1 else 0 end) where user_id = uid;
  if tx > 0 then update public.profiles set total_xp = total_xp + tx where id = uid; end if;
  res := jsonb_build_object('won', ended = 'won', 'xp', tx, 'coins', coin_reward, 'monster_xp', mx, 'levels', lvls);
  insert into public.game_results (game_key, student_id, student_name, xp_earned, accuracy, duration_seconds, content_set_title)
  select 'monster-quest', uid, display_name, tx, case when ended = 'won' then 100 else 0 end, (extract(epoch from (now() - b.created_at)))::int, 'Monster Quest: battle' from public.profiles where id = uid;
  if ended = 'won' then perform public.mq_bump(uid, 'battle', 1); end if;
  update public.mq_battles set player = P, opp = O, p_active = pa, o_active = oa, turn = turn + 1, pending_question = null, pending_started_at = null,
    status = ended, result = res, ended_at = now() where id = b.id returning * into b;
  return public.mq_battle_view(b, ev);
end;
$$;

grant execute on all functions in schema public to authenticated;
commit;
