import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  ITEMS,
  STARTER,
  STYLE_OPTIONS,
  getItem,
  priceOf,
  registerCustomItems,
  type Gender,
  type Item,
  type ItemGender,
  type Look,
  type Rarity,
} from '../features/avatar/catalog';
import { loadRemoteStoreItems, rowToItem, type StoreItemRow } from '../features/avatar/remoteCatalog';
import { AvatarStageView } from '../features/avatar/AvatarImage';
import { ItemThumb, RARITY } from '../features/avatar/ui';

type Kind = 'outfit' | 'hat' | 'hair' | 'accessory' | 'shoes' | 'backpack' | 'pet' | 'character' | 'set';

const KINDS: { id: Kind; label: string; icon: string }[] = [
  { id: 'outfit', label: 'Outfit', icon: '👕' },
  { id: 'hat', label: 'Hat', icon: '🎩' },
  { id: 'hair', label: 'Hairstyle', icon: '💇' },
  { id: 'accessory', label: 'Accessory', icon: '🕶️' },
  { id: 'shoes', label: 'Shoes', icon: '👟' },
  { id: 'backpack', label: 'Backpack', icon: '🎒' },
  { id: 'pet', label: 'Pet', icon: '🐾' },
  { id: 'character', label: 'Character', icon: '🦊' },
  { id: 'set', label: 'Set / Collection', icon: '⭐' },
];

const CATEGORY: Record<Kind, string> = { outfit: 'outfits', hat: 'hats', hair: 'hair', accessory: 'accessories', shoes: 'shoes', backpack: 'backpacks', pet: 'pets', character: 'sets', set: 'sets' };
const BOTTOMS = ['pants', 'shorts', 'skirt', 'none'];
const ATTACH = [
  { id: 'head', label: 'On top of the head' },
  { id: 'face', label: 'On the face' },
  { id: 'back', label: 'On the back' },
  { id: 'chest', label: 'On the chest' },
];
const MODEL_KINDS: Kind[] = ['hat', 'accessory', 'backpack', 'pet', 'character'];

interface Draft {
  id: string | null;
  name: string;
  blurb: string;
  kind: Kind;
  gender: ItemGender;
  price: number;
  rarity: Rarity;
  style: string;
  color: string;
  accent: string;
  sole: string;
  top: string;
  bottom: string;
  bottomKind: string;
  collar: string;
  useModel: boolean;
  modelUrl: string;
  modelScale: number;
  modelX: number;
  modelY: number;
  modelZ: number;
  modelRotY: number;
  attach: string;
  pieces: string[];
  active: boolean;
}

const emptyDraft = (): Draft => ({
  id: null, name: '', blurb: '', kind: 'hat', gender: 'unisex', price: 60, rarity: 'common', style: 'cap',
  color: '#E8453C', accent: '#FFFFFF', sole: '#FFFFFF', top: '#3D7BFF', bottom: '#2B3A67', bottomKind: 'pants', collar: '#FFFFFF',
  useModel: false, modelUrl: '', modelScale: 1, modelX: 0, modelY: 0, modelZ: 0, modelRotY: 0, attach: 'head', pieces: [], active: true,
});

const str = (v: unknown, d: string) => (typeof v === 'string' && v ? v : d);
const numv = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const label = (s: string) => s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

function draftToSpec(d: Draft): Record<string, string | number | boolean> {
  let spec: Record<string, string | number | boolean> = {};
  switch (d.kind) {
    case 'outfit': spec = { kind: d.style, top: d.top, bottom: d.bottom, bottomKind: d.bottomKind, accent: d.accent, collar: d.collar }; break;
    case 'hat': case 'accessory': case 'backpack': case 'pet': spec = { style: d.style, color: d.color, accent: d.accent }; break;
    case 'shoes': spec = { style: d.style, color: d.color, sole: d.sole, accent: d.accent }; break;
    case 'hair': spec = { style: d.style }; break;
    case 'character': spec = { model: d.style }; break;
    case 'set': spec = {}; break;
  }
  if (d.useModel && d.modelUrl.trim() && MODEL_KINDS.includes(d.kind)) {
    spec = { ...spec, modelUrl: d.modelUrl.trim(), modelScale: d.modelScale, modelX: d.modelX, modelY: d.modelY, modelZ: d.modelZ, modelRotY: d.modelRotY };
    if (d.kind === 'accessory') spec.attach = d.attach;
  }
  return spec;
}

function draftFromItem(it: Item, keepId: boolean): Draft {
  const sp = it.spec;
  const d = emptyDraft();
  d.id = keepId ? it.id : null;
  d.name = keepId ? it.name : `${it.name} (copy)`;
  d.blurb = it.blurb;
  d.kind = it.slot as Kind;
  d.gender = it.gender;
  d.price = it.price;
  d.rarity = it.rarity;
  d.style = str(sp.kind ?? sp.style ?? sp.model, STYLE_OPTIONS[it.slot]?.[0] ?? '');
  d.color = str(sp.color, d.color);
  d.accent = str(sp.accent, d.accent);
  d.sole = str(sp.sole, d.sole);
  d.top = str(sp.top, d.top);
  d.bottom = str(sp.bottom, d.bottom);
  d.bottomKind = str(sp.bottomKind, d.bottomKind);
  d.collar = str(sp.collar, d.collar);
  if (sp.modelUrl) {
    d.useModel = true;
    d.modelUrl = String(sp.modelUrl);
    d.modelScale = numv(sp.modelScale, 1);
    d.modelX = numv(sp.modelX, 0);
    d.modelY = numv(sp.modelY, 0);
    d.modelZ = numv(sp.modelZ, 0);
    d.modelRotY = numv(sp.modelRotY, 0);
    d.attach = str(sp.attach, 'head');
  }
  d.pieces = it.pieces ?? [];
  return d;
}

function draftToRow(d: Draft, createdBy: string | undefined): StoreItemRow & { created_by?: string; updated_at: string } {
  const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'item';
  return {
    id: d.id ?? `x-${slug}-${Date.now().toString(36)}`,
    name: d.name.trim(),
    slot: d.kind,
    category: CATEGORY[d.kind],
    gender: d.gender,
    price: Math.max(0, Math.round(d.price)),
    rarity: d.rarity,
    blurb: d.blurb.trim(),
    spec: draftToSpec(d),
    hidden: false,
    pieces: d.kind === 'set' ? d.pieces : null,
    active: d.active,
    ...(d.id ? {} : { created_by: createdBy }),
    updated_at: new Date().toISOString(),
  };
}

const Field = ({ label: l, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-bold text-primary">{l}</span>
    {children}
    {hint && <span className="mt-0.5 block text-[11px] text-muted-foreground">{hint}</span>}
  </label>
);
const inputCls = 'w-full rounded-lg border-2 border-border bg-card px-3 py-2 text-sm outline-none focus:border-secondary';

function ColorField({ label: l, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={l}>
      <div className="flex items-center gap-2">
        <input type="color" value={value.toLowerCase()} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-14 cursor-pointer rounded-lg border-2 border-border bg-card p-0.5" />
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
    </Field>
  );
}

export function StoreAdminPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<StoreItemRow[]>([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [previewGender, setPreviewGender] = useState<Gender>('girl');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [search, setSearch] = useState('');

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('store_items').select('*').order('created_at', { ascending: false });
    if (error) {
      setTableMissing(error.code === '42P01' || error.code === 'PGRST205' || /store_items|schema cache|does not exist/i.test(error.message));
      if (!/store_items|schema cache|does not exist/i.test(error.message)) setMessage({ tone: 'bad', text: error.message });
    } else {
      setTableMissing(false);
      setRows((data ?? []) as StoreItemRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // pick a sensible look when the kind changes
  const changeKind = (k: Kind) => {
    setDraft((d) => ({ ...d, kind: k, style: STYLE_OPTIONS[k]?.[0] ?? '', gender: k === 'set' && d.gender === 'unisex' ? 'girl' : d.gender, useModel: false, pieces: [] }));
  };

  // ---- live preview: register a temporary item so the 3D character can wear it
  const savedItems = useMemo(() => rows.filter((r) => r.active !== false).map(rowToItem).filter((i): i is Item => !!i), [rows]);
  const previewItem = useMemo(() => {
    if (!draft.name.trim() && !draft.useModel && draft.kind === 'set') return null;
    return rowToItem({ ...draftToRow(draft, undefined), id: 'x-preview', active: true });
  }, [draft]);

  useLayoutEffect(() => {
    registerCustomItems(previewItem ? [...savedItems.filter((i) => i.id !== draft.id), previewItem] : savedItems);
  }, [savedItems, previewItem, draft.id]);
  useEffect(() => () => registerCustomItems(savedItems), [savedItems]);

  const previewLook: Look = useMemo(() => {
    const base = { ...STARTER[previewGender] } as unknown as Record<string, string | null>;
    if (previewItem) {
      if (previewItem.slot === 'set') for (const pid of previewItem.pieces ?? []) {
        const p = getItem(pid);
        if (p && p.slot !== 'set') base[p.slot] = pid;
      } else base[previewItem.slot] = 'x-preview';
    }
    return base as unknown as Look;
    // `previewItem` changes whenever the draft changes
  }, [previewItem, previewGender]);

  const valid = draft.name.trim().length >= 2 && (draft.kind !== 'set' || (draft.pieces.length >= 2 && draft.gender !== 'unisex')) && (!draft.useModel || /^(https:\/\/|\/)/.test(draft.modelUrl.trim()));

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setMessage(null);
    const row = draftToRow(draft, profile?.uid);
    const { error } = await supabase.from('store_items').upsert(row);
    setSaving(false);
    if (error) {
      setMessage({ tone: 'bad', text: `Could not save: ${error.message}` });
      return;
    }
    setMessage({ tone: 'ok', text: 'Saved! Students will see it in the Style Store.' });
    setDraft((d) => ({ ...d, id: row.id }));
    await refresh();
    void loadRemoteStoreItems(true);
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this item for everyone? Students who already bought it will keep nothing to wear.')) return;
    const { error } = await supabase.from('store_items').delete().eq('id', id);
    if (error) setMessage({ tone: 'bad', text: error.message });
    else {
      if (draft.id === id) setDraft(emptyDraft());
      await refresh();
      void loadRemoteStoreItems(true);
    }
  };

  const toggle = async (r: StoreItemRow) => {
    await supabase.from('store_items').update({ active: r.active === false, updated_at: new Date().toISOString() }).eq('id', r.id);
    await refresh();
    void loadRemoteStoreItems(true);
  };

  const styles = STYLE_OPTIONS[draft.kind] ?? [];
  const showModel = MODEL_KINDS.includes(draft.kind);
  const builtIns = ITEMS.filter((i) => !i.custom && !i.hidden && i.slot !== 'set');
  const suggested = draft.kind === 'set' ? Math.round((draft.pieces.reduce((s, p) => s + (getItem(p) ? priceOf(getItem(p) as Item, []) : 0), 0) * 0.65) / 5) * 5 : null;
  const piecePool = ITEMS.filter((i) => i.slot !== 'set' && (draft.gender === 'unisex' ? true : i.gender === draft.gender || i.gender === 'unisex') && i.id !== 'x-preview');
  const shown = rows.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4">
      <h1 className="font-display text-3xl font-bold text-primary">🛍️ Style Store Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">Add new objects for the Style Store: pick what it is, choose its look and colors (or upload your own 3D model), set a price, and save. Students see it right away.</p>

      {tableMissing && (
        <div className="mt-4 rounded-2xl border-2 border-secondary bg-secondary/10 p-4 text-sm text-primary">
          <p className="font-bold">One-time setup needed</p>
          <p className="mt-1">Open Supabase → SQL Editor, paste the contents of <code className="rounded bg-card px-1">supabase/store_items_patch.sql</code> and press Run. Then refresh this page.</p>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {/* what is it */}
          <section className="card-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-primary">1. What is it?</h2>
              <select
                aria-label="Start from an existing item"
                value=""
                onChange={(e) => {
                  const it = getItem(e.target.value);
                  if (it) setDraft(draftFromItem(it, false));
                }}
                className="rounded-lg border-2 border-border bg-card px-2 py-1.5 text-sm"
              >
                <option value="">Start from an existing item…</option>
                {builtIns.map((i) => (
                  <option key={i.id} value={i.id}>{label(i.slot)}: {i.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {KINDS.map((k) => (
                <button key={k.id} type="button" onClick={() => changeKind(k.id)} aria-pressed={draft.kind === k.id} className={`rounded-xl border-2 px-2 py-2 text-center text-xs font-bold ${draft.kind === k.id ? 'border-[#FF9A1F] bg-[#FF9A1F]/15 text-primary' : 'border-border text-primary'}`}>
                  <span className="block text-xl" aria-hidden="true">{k.icon}</span>
                  {k.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Name"><input value={draft.name} onChange={(e) => set('name', e.target.value)} maxLength={40} placeholder="e.g. Pirate Hat" className={inputCls} /></Field>
              <Field label="Short description"><input value={draft.blurb} onChange={(e) => set('blurb', e.target.value)} maxLength={140} placeholder="Arrr! A hat for brave sailors." className={inputCls} /></Field>
              <Field label="Who is it for?" hint={draft.kind === 'set' ? 'Sets must be for the boy or the girl character.' : undefined}>
                <select value={draft.gender} onChange={(e) => set('gender', e.target.value as ItemGender)} className={inputCls}>
                  <option value="unisex" disabled={draft.kind === 'set'}>Boys and girls</option>
                  <option value="boy">Boy character only</option>
                  <option value="girl">Girl character only</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (coins)"><input type="number" min={0} max={99999} value={draft.price} onChange={(e) => set('price', Number(e.target.value))} className={inputCls} /></Field>
                <Field label="Rarity">
                  <select value={draft.rarity} onChange={(e) => set('rarity', e.target.value as Rarity)} className={inputCls}>
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                  </select>
                </Field>
              </div>
            </div>
            {suggested !== null && draft.pieces.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Suggested set price: 🪙 {suggested} (students pay only for the pieces they don't own yet, at a discount).</p>}
          </section>

          {/* look */}
          {draft.kind !== 'set' && (
            <section className="card-surface p-4">
              <h2 className="font-display text-lg font-semibold text-primary">2. What does it look like?</h2>
              {showModel && (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => set('useModel', false)} className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-bold ${!draft.useModel ? 'border-secondary bg-secondary/15' : 'border-border'}`}>Built-in shape + colors</button>
                  <button type="button" onClick={() => set('useModel', true)} className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-bold ${draft.useModel ? 'border-secondary bg-secondary/15' : 'border-border'}`}>My own 3D model (.glb)</button>
                </div>
              )}
              {!draft.useModel ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label="Shape">
                    <select value={draft.style} onChange={(e) => set('style', e.target.value)} className={inputCls}>
                      {styles.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </select>
                  </Field>
                  {draft.kind === 'outfit' ? (
                    <>
                      <ColorField label="Top color" value={draft.top} onChange={(v) => set('top', v)} />
                      <ColorField label="Bottom color" value={draft.bottom} onChange={(v) => set('bottom', v)} />
                      <Field label="Bottoms">
                        <select value={draft.bottomKind} onChange={(e) => set('bottomKind', e.target.value)} className={inputCls}>
                          {BOTTOMS.map((b) => <option key={b} value={b}>{label(b)}</option>)}
                        </select>
                      </Field>
                      <ColorField label="Detail color" value={draft.accent} onChange={(v) => set('accent', v)} />
                      <ColorField label="Collar color (jackets)" value={draft.collar} onChange={(v) => set('collar', v)} />
                    </>
                  ) : draft.kind === 'hair' || draft.kind === 'character' ? (
                    <p className="self-end text-xs text-muted-foreground">{draft.kind === 'hair' ? 'Students choose the hair color themselves.' : 'Built-in characters have fixed colors. Use "My own 3D model" for a brand-new character.'}</p>
                  ) : (
                    <>
                      <ColorField label="Main color" value={draft.color} onChange={(v) => set('color', v)} />
                      <ColorField label="Detail color" value={draft.accent} onChange={(v) => set('accent', v)} />
                      {draft.kind === 'shoes' && <ColorField label="Sole color" value={draft.sole} onChange={(v) => set('sole', v)} />}
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <Field label="Link to the .glb file" hint="Put your .glb file in your site's public/models folder on GitHub, then paste its web address (it must start with https:// or /). Tip: keep it under 2 MB.">
                    <input value={draft.modelUrl} onChange={(e) => set('modelUrl', e.target.value)} placeholder="https://yourname.github.io/play/models/pirate-hat.glb" className={inputCls} />
                  </Field>
                  {draft.kind === 'accessory' && (
                    <Field label="Where does it go?">
                      <select value={draft.attach} onChange={(e) => set('attach', e.target.value)} className={inputCls}>
                        {ATTACH.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                      </select>
                    </Field>
                  )}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <Field label={`Size ×${draft.modelScale.toFixed(2)}`}><input type="range" min={0.3} max={2.5} step={0.05} value={draft.modelScale} onChange={(e) => set('modelScale', Number(e.target.value))} className="w-full" /></Field>
                    <Field label={`Left / right ${draft.modelX.toFixed(1)}`}><input type="range" min={-2} max={2} step={0.1} value={draft.modelX} onChange={(e) => set('modelX', Number(e.target.value))} className="w-full" /></Field>
                    <Field label={`Up / down ${draft.modelY.toFixed(1)}`}><input type="range" min={-2} max={2} step={0.1} value={draft.modelY} onChange={(e) => set('modelY', Number(e.target.value))} className="w-full" /></Field>
                    <Field label={`Forward / back ${draft.modelZ.toFixed(1)}`}><input type="range" min={-2} max={2} step={0.1} value={draft.modelZ} onChange={(e) => set('modelZ', Number(e.target.value))} className="w-full" /></Field>
                    <Field label={`Turn ${Math.round(draft.modelRotY)}°`}><input type="range" min={-180} max={180} step={5} value={draft.modelRotY} onChange={(e) => set('modelRotY', Number(e.target.value))} className="w-full" /></Field>
                  </div>
                </div>
              )}
            </section>
          )}

          {draft.kind === 'set' && (
            <section className="card-surface p-4">
              <h2 className="font-display text-lg font-semibold text-primary">2. What is inside the set? <span className="text-sm font-normal text-muted-foreground">({draft.pieces.length} chosen)</span></h2>
              <div className="mt-2 grid max-h-72 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
                {piecePool.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-sm text-primary">
                    <input type="checkbox" checked={draft.pieces.includes(p.id)} onChange={(e) => set('pieces', e.target.checked ? [...draft.pieces, p.id] : draft.pieces.filter((x) => x !== p.id))} />
                    <span className="truncate">{label(p.slot)}: {p.name}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* save */}
          <section className="card-surface p-4">
            <h2 className="font-display text-lg font-semibold text-primary">3. Save</h2>
            <label className="mt-2 flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} />
              Visible to students in the Style Store
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={save} disabled={!valid || saving || tableMissing} className="rounded-xl bg-gradient-to-b from-[#FFB020] to-[#FF8A1F] px-6 py-3 font-extrabold text-white shadow disabled:opacity-50">
                {saving ? 'Saving…' : draft.id ? 'Save changes' : 'Add to the store'}
              </button>
              <button type="button" onClick={() => { setDraft(emptyDraft()); setMessage(null); }} className="rounded-xl border-2 border-border px-4 py-3 text-sm font-bold text-primary">New item</button>
              {!valid && <span className="text-xs text-muted-foreground">Give it a name{draft.kind === 'set' ? ' and pick at least 2 pieces (for the boy or the girl)' : ''}{draft.useModel ? ' and a valid model link' : ''}.</span>}
            </div>
            {message && <p className={`mt-2 text-sm font-semibold ${message.tone === 'ok' ? 'text-secondary' : 'text-destructive'}`} aria-live="polite">{message.text}</p>}
          </section>

          {/* existing admin items */}
          <section className="card-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-primary">Items you added ({rows.length})</h2>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" aria-label="Search your items" className="rounded-lg border-2 border-border bg-card px-3 py-1.5 text-sm" />
            </div>
            {loading ? <p className="mt-2 text-sm text-muted-foreground">Loading…</p> : shown.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nothing yet. Your first item will appear here.</p> : (
              <ul className="mt-3 divide-y divide-border/60">
                {shown.map((r) => {
                  const it = getItem(r.id.startsWith('x-') ? r.id : `x-${r.id}`);
                  return (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
                      <ItemThumb gender={r.gender === 'boy' ? 'boy' : 'girl'} item={it ?? null} size={56} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-primary">{r.name} {r.active === false && <span className="ml-1 rounded bg-muted px-1.5 text-[10px] font-bold">hidden</span>}</p>
                        <p className="text-xs text-muted-foreground">{label(r.slot)} · {r.gender === 'unisex' ? 'both' : r.gender} · 🪙 {r.price} · <span className={`rounded-full px-1.5 ${RARITY[(r.rarity as Rarity) ?? 'common'].cls}`}>{r.rarity}</span></p>
                      </div>
                      <div className="flex gap-1.5 text-xs font-bold">
                        <button type="button" onClick={() => it && setDraft(draftFromItem(it, true))} className="rounded-lg border-2 border-border px-2.5 py-1 text-primary hover:border-secondary">Edit</button>
                        <button type="button" onClick={() => it && setDraft(draftFromItem(it, false))} className="rounded-lg border-2 border-border px-2.5 py-1 text-primary hover:border-secondary">Duplicate</button>
                        <button type="button" onClick={() => toggle(r)} className="rounded-lg border-2 border-border px-2.5 py-1 text-primary hover:border-secondary">{r.active === false ? 'Show' : 'Hide'}</button>
                        <button type="button" onClick={() => remove(r.id)} className="rounded-lg border-2 border-destructive/60 px-2.5 py-1 text-destructive">Delete</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* live preview */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-3xl border-4 border-primary bg-card shadow-lg">
            <div className="bg-gradient-to-b from-sky-300 via-sky-200 to-violet-200">
              <AvatarStageView gender={previewGender} look={previewLook} className="h-[380px] w-full" view={draft.kind === 'hat' || draft.kind === 'hair' ? 'full' : 'full'} />
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <p className="min-w-0 truncate text-sm font-bold text-primary">{draft.name || 'Your new item'}</p>
              <div className="flex gap-1">
                {(['girl', 'boy'] as Gender[]).map((g) => (
                  <button key={g} type="button" onClick={() => setPreviewGender(g)} aria-pressed={previewGender === g} className={`rounded-full px-3 py-1 text-xs font-bold ${previewGender === g ? 'bg-primary text-primary-foreground' : 'border border-border text-primary'}`}>
                    {g === 'girl' ? 'Girl' : 'Boy'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Live preview. Drag to spin it.</p>
        </aside>
      </div>
    </div>
  );
}
