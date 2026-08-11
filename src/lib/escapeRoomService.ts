import { supabase } from './supabase';
import type { AnswerMode, EscapeRoom, EscapeRoomHotspot, Visibility } from '../types';

function rowToEscapeRoom(row: any): EscapeRoom {
  return {
    id: row.id,
    title: row.title,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    imageUrl: row.image_url,
    storyText: row.story_text,
    theme: row.theme,
    visibility: row.visibility,
    playCount: row.play_count ?? 0,
    reportCount: row.report_count ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToHotspot(row: any): EscapeRoomHotspot {
  return {
    id: row.id,
    orderIndex: row.order_index,
    xPercent: Number(row.x_percent),
    yPercent: Number(row.y_percent),
    radiusPercent: Number(row.radius_percent),
    locateHint: row.locate_hint ?? '',
    locateHintExtra: row.locate_hint_extra ?? '',
    clueText: row.clue_text,
    answerMode: row.answer_mode,
    correctAnswer: row.correct_answer,
    choices: row.choices ?? undefined,
    questionHintExtra: row.question_hint_extra ?? '',
  };
}

export interface HotspotInput {
  xPercent: number;
  yPercent: number;
  radiusPercent?: number;
  locateHint: string;
  locateHintExtra?: string;
  clueText: string;
  answerMode: AnswerMode;
  correctAnswer: string;
  choices?: string[];
  questionHintExtra?: string;
}

export async function checkDuplicateEscapeRoomTitle(title: string): Promise<EscapeRoom | null> {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('escape_rooms')
    .select('*')
    .eq('title_lower', normalized)
    .eq('visibility', 'public')
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToEscapeRoom(data);
}

export async function createEscapeRoom(input: {
  title: string;
  teacherId: string;
  teacherName: string;
  imageUrl: string;
  storyText?: string;
  theme?: string;
  visibility: Visibility;
  hotspots: HotspotInput[];
}): Promise<string> {
  const { data: room, error: roomError } = await supabase
    .from('escape_rooms')
    .insert({
      title: input.title,
      title_lower: input.title.trim().toLowerCase(),
      teacher_id: input.teacherId,
      teacher_name: input.teacherName,
      image_url: input.imageUrl,
      story_text: input.storyText ?? null,
      theme: input.theme ?? null,
      visibility: input.visibility,
    })
    .select('id')
    .single();
  if (roomError) throw roomError;

  const hotspotRows = input.hotspots.map((h, i) => ({
    escape_room_id: room.id,
    order_index: i,
    x_percent: h.xPercent,
    y_percent: h.yPercent,
    radius_percent: h.radiusPercent ?? 8,
    locate_hint: h.locateHint,
    locate_hint_extra: h.locateHintExtra ?? '',
    clue_text: h.clueText,
    answer_mode: h.answerMode,
    correct_answer: h.correctAnswer,
    choices: h.choices ?? null,
    question_hint_extra: h.questionHintExtra ?? '',
  }));
  const { error: hotspotError } = await supabase.from('escape_room_hotspots').insert(hotspotRows);
  if (hotspotError) throw hotspotError;

  return room.id;
}

export async function updateEscapeRoom(id: string, input: {
  title: string;
  visibility: Visibility;
  imageUrl?: string;
  storyText?: string;
  theme?: string;
  hotspots?: HotspotInput[];
}): Promise<void> {
  const updates: Record<string, unknown> = {
    title: input.title,
    title_lower: input.title.trim().toLowerCase(),
    visibility: input.visibility,
    story_text: input.storyText ?? null,
    theme: input.theme ?? null,
    updated_at: new Date().toISOString(),
  };
  if (input.imageUrl) updates.image_url = input.imageUrl;
  const { error: updateError } = await supabase.from('escape_rooms').update(updates).eq('id', id);
  if (updateError) throw updateError;

  if (input.hotspots) {
    const { error: deleteError } = await supabase.from('escape_room_hotspots').delete().eq('escape_room_id', id);
    if (deleteError) throw deleteError;
    const hotspotRows = input.hotspots.map((h, i) => ({
      escape_room_id: id,
      order_index: i,
      x_percent: h.xPercent,
      y_percent: h.yPercent,
      radius_percent: h.radiusPercent ?? 8,
      locate_hint: h.locateHint,
      locate_hint_extra: h.locateHintExtra ?? '',
      clue_text: h.clueText,
      answer_mode: h.answerMode,
      correct_answer: h.correctAnswer,
      choices: h.choices ?? null,
      question_hint_extra: h.questionHintExtra ?? '',
    }));
    const { error: insertError } = await supabase.from('escape_room_hotspots').insert(hotspotRows);
    if (insertError) throw insertError;
  }
}

export async function getEscapeRoom(id: string): Promise<EscapeRoom | null> {
  const { data, error } = await supabase.from('escape_rooms').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return rowToEscapeRoom(data);
}

export async function getEscapeRoomHotspots(id: string): Promise<EscapeRoomHotspot[]> {
  const { data, error } = await supabase
    .from('escape_room_hotspots')
    .select('*')
    .eq('escape_room_id', id)
    .order('order_index', { ascending: true });
  if (error || !data) return [];
  return data.map(rowToHotspot);
}

export async function listPublicEscapeRooms(): Promise<EscapeRoom[]> {
  const { data, error } = await supabase
    .from('escape_rooms')
    .select('*')
    .eq('visibility', 'public')
    .order('play_count', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map(rowToEscapeRoom);
}

export async function listMyEscapeRooms(teacherId: string): Promise<EscapeRoom[]> {
  const { data, error } = await supabase
    .from('escape_rooms')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToEscapeRoom);
}

export async function incrementEscapeRoomPlayCount(id: string): Promise<void> {
  await supabase.rpc('increment_escape_room_play_count', { room_id: id });
}

export async function deleteEscapeRoom(id: string): Promise<void> {
  await supabase.from('escape_rooms').delete().eq('id', id);
}

export async function reportEscapeRoom(id: string, reason: string): Promise<void> {
  await supabase.rpc('report_escape_room', { room_id: id, reason });
}

export async function listReportedEscapeRooms(): Promise<EscapeRoom[]> {
  const { data, error } = await supabase
    .from('escape_rooms')
    .select('*')
    .gt('report_count', 0)
    .order('report_count', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map(rowToEscapeRoom);
}

export async function unpublishEscapeRoom(id: string): Promise<void> {
  await supabase.rpc('unpublish_escape_room', { room_id: id });
}

export async function republishEscapeRoom(id: string): Promise<void> {
  await supabase.rpc('republish_escape_room', { room_id: id });
}

export async function dismissEscapeRoomReports(id: string): Promise<void> {
  await supabase.rpc('dismiss_escape_room_reports', { room_id: id });
}

export async function recordEscapeRoomResult(input: {
  roomId: string;
  roomTitle: string;
  wrongClicks: number;
  durationSeconds: number;
  xpEarned: number;
}): Promise<void> {
  await supabase.rpc('record_escape_room_result', {
    p_room_id: input.roomId,
    p_room_title: input.roomTitle,
    p_wrong_clicks: input.wrongClicks,
    p_duration_seconds: input.durationSeconds,
    p_xp_earned: input.xpEarned,
  });
}
