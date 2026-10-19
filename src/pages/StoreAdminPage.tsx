import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  CATEGORIES,
  ITEMS,
  STARTER,
  STYLE_OPTIONS,
  getItem,
  getOriginalItem,
  isBuiltInId,
  priceOf,
  registerCustomItems,
  textOfSpec,
  type Category,
  type Gender,
  type Item,
  type ItemGender,
  type Look,
  type Rarity,
} from '../features/avatar/catalog';
import { loadRemoteStoreItems, rowToItem, type StoreItemRow } from '../features/avatar/remoteCatalog';
import { AvatarStageView } from '../features/avatar/AvatarImage';
import type { StageApi } from '../features/avatar/stage';
import { useCatalogVersion } from '../features/avatar/useCatalog';
import { ItemThumb, RARITY } from '../features/avatar/ui';

type Kind = 'outfit' | 'hat' | 'hair' | 'accessory' | 'shoes' | 'backpack' | 'pet' | 'character' | 'set';
type Spec = Record<string, string | number | boolean>;

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
  /** null = a brand-new item */
  id: string | null;
  /** editing one of the shipped items (the change is saved as an edit of that item) */
  builtIn: boolean;
  /** the item's original settings - kept so nothing is lost when only some fields are edited */
  baseSpec: Spec;
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
  frontText: string;
  backText: string;
  textColor: string;
  useModel: boolean;
  modelUrl: string;
  modelScale: number;
  modelX: number;
  modelY: number;
  modelZ: number;
  modelRotY: number;
  attach: string;
  pieces: string[];
  visible: boolean;
}

const emptyDraft = (): Draft => ({
  id: null, builtIn: false, baseSpec: {}, name: '', blurb: '', kind: 'hat', gender: 'unisex', price: 60, rarity: 'common', style: 'cap',
  color: '#E8453C', accent: '#FFFFFF', sole: '#FFFFFF', top: '#3D7BFF', bottom: '#2B3A67', bottomKind: 'pants', collar: '#FFFFFF',
  frontText: '', backText: '', textColor: '#FFFFFF',
  useModel: false, modelUrl: '', modelScale: 1, modelX: 0, modelY: 0, modelZ: 0, modelRotY: 0, attach: 'head', pieces: [], visible: true,
});

const str = (v: unknown, d: string) => (typeof v === 'string' && v ? v : d);
const numv = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const label = (s: string) => s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

function draftToSpec(d: Draft): Spec {
  const spec: Spec = { ...d.baseSpec };
  const put = (o: Spec) => Object.assign(spec, o);
  switch (d.kind) {
    case 'outfit': put({ kind: d.style, top: d.top, bottom: d.bottom, bottomKind: d.bottomKind, accent: d.accent, collar: d.collar }); break;
    case 'hat': case 'accessory': case 'backpack': case 'pet': put({ style: d.style, color: d.color, accent: d.accent }); break;
    case 'shoes': put({ style: d.style, color: d.color, sole: d.sole, accent: d.accent }); break;
    case 'hair': put({ style: d.style }); break;
    case 'character': put({ model: d.style }); break;
    case 'set': break;
  }
  if (d.kind === 'outfit' || d.kind === 'set') {
    for (const k of ['frontText', 'backText', 'textColor']) delete spec[k];
    if (d.frontText.trim() || d.backText.trim()) {
      if (d.frontText.trim()) spec.frontText = d.frontText.trim();
      if (d.backText.trim()) spec.backText = d.backText.trim();
      spec.textColor = d.textColor;
    }
  }
  for (const k of ['modelUrl', 'modelScale', 'modelX', 'modelY', 'modelZ', 'modelRotY', 'attach']) delete spec[k];
  if (d.useModel && d.modelUrl.trim() && MODEL_KINDS.includes(d.kind)) {
    put({ modelUrl: d.modelUrl.trim(), modelScale: d.modelScale, modelX: d.modelX, modelY: d.modelY, modelZ: d.modelZ, modelRotY: d.modelRotY });
    if (d.kind === 'accessory') spec.attach = d.attach;
  }
  if (d.builtIn && !d.visible) spec.disabled = true;
  else delete spec.disabled;
  return spec;
}

function draftFromItem(it: Item, mode: 'edit' | 'copy', visible = !it.disabled): Draft {
  const sp = it.spec;
  const d = emptyDraft();
  const builtIn = isBuiltInId(it.id);
  d.id = mode === 'edit' ? it.id : null;
  d.builtIn = mode === 'edit' && builtIn;
  d.baseSpec = { ...sp };
  delete d.baseSpec.disabled;
  d.name = mode === 'edit' ? it.name : `${it.name} (copy)`;
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
  d.frontText = str(sp.frontText, '');
  d.backText = str(sp.backText, '');
  d.textColor = str(sp.textColor, '#FFFFFF');
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
  d.visible = visible;
  return d;
}

type Row = StoreItemRow & { created_by?: string; updated_at: string };

function draftToRow(d: Draft, createdBy: string | undefined): Row {
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
    // shipped items stay "active"; hiding one is stored inside its settings
    active: d.builtIn ? true : d.visible,
    ...(d.id ? {} : { created_by: createdBy }),
    updated_at: new Date().toISOString(),
  };
}

/** A row for quick changes (price, rarity, visible) made straight in the table. */
function itemToRow(it: Item, ch: { price?: number; rarity?: Rarity; visible?: boolean }): Row {
  const builtIn = isBuiltInId(it.id);
  const visible = ch.visible ?? !it.disabled;
  const spec: Spec = { ...it.spec };
  if (builtIn && !visible) spec.disabled = true;
  else delete spec.disabled;
  return {
    id: it.id,
    name: it.name,
    slot: it.slot,
    category: it.category,
    gender: it.gender,
    price: Math.max(0, Math.round(ch.price ?? it.price)),
    rarity: ch.rarity ?? it.rarity,
    blurb: it.blurb,
    spec,
    hidden: false,
    pieces: it.slot === 'set' ? (it.pieces ?? []) : null,
    active: builtIn ? true : visible,
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

interface Entry {
  item: Item;
  /** a custom item that is switched off */
  inactive: boolean;
}

type Quick = { price?: number; rarity?: Rarity; visible?: boolean };

export function StoreAdminPage() {
  const { profile } = useAuth();
  const catalogVersion = useCatalogVersion();
  const [rows, setRows] = useState<StoreItemRow[]>([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [previewGender, setPreviewGender] = useState<Gender>('girl');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all');
  const [srcFilter, setSrcFilter] = useState<'all' | 'builtin' | 'edited' | 'mine'>('all');
  const [quick, setQuick] = useState<Record<string, Quick>>({});
  const [stage, setStage] = useState<StageApi | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('store_items').select('*').order('created_at', { ascending: false });
    if (error) {
      const missing = error.code === '42P01' || error.code === 'PGRST205' || /store_items|schema cache|does not exist/i.test(error.message);
      setTableMissing(missing);
      if (!missing) setMessage({ tone: 'bad', text: error.message });
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

  const changeKind = (k: Kind) => {
    setDraft((d) => ({ ...d, kind: k, baseSpec: {}, style: STYLE_OPTIONS[k]?.[0] ?? '', gender: k === 'set' && d.gender === 'unisex' ? 'girl' : d.gender, useModel: false, pieces: [] }));
  };

  // show a boy's item on the boy and a girl's item on the girl
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft.gender !== 'unisex') setPreviewGender(draft.gender);
  }, [draft.gender, draft.id]);

  // ---- what the store shows right now (saved items + edits) and a live preview of the draft
  const saved = useMemo(() => {
    const items = rows.filter((r) => r.active !== false).map(rowToItem).filter((i): i is Item => !!i);
    return { custom: items.filter((i) => !isBuiltInId(i.id)), overrides: items.filter((i) => isBuiltInId(i.id)) };
  }, [rows]);

  const previewItem = useMemo(() => {
    if (draft.kind === 'set' && draft.pieces.length === 0) return null;
    return rowToItem({ ...draftToRow(draft, undefined), id: 'x-preview', active: true });
  }, [draft]);

  useLayoutEffect(() => {
    registerCustomItems(previewItem ? [...saved.custom.filter((i) => i.id !== draft.id), previewItem] : saved.custom, saved.overrides);
  }, [saved, previewItem, draft.id]);
  useEffect(() => () => registerCustomItems(saved.custom, saved.overrides), [saved]);

  const previewLook: Look = useMemo(() => {
    const base = { ...STARTER[previewGender] } as unknown as Record<string, unknown>;
    if (previewItem) {
      if (previewItem.slot === 'set') {
        for (const pid of previewItem.pieces ?? []) {
          const p = getItem(pid);
          if (p && p.slot !== 'set') base[p.slot] = pid;
        }
        base.outfitText = textOfSpec(previewItem.spec);
      } else base[previewItem.slot] = 'x-preview';
    }
    return base as unknown as Look;
    // `previewItem` changes whenever the draft changes
  }, [previewItem, previewGender]);

  const valid =
    draft.name.trim().length >= 2 &&
    (draft.kind !== 'set' || (draft.pieces.length >= 2 && draft.gender !== 'unisex')) &&
    (!draft.useModel || /^(https:\/\/|\/)/.test(draft.modelUrl.trim()));

  // ---- saving
  const done = async (text: string) => {
    setMessage({ tone: 'ok', text });
    await refresh();
    void loadRemoteStoreItems(true);
  };

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
    setDraft((d) => ({ ...d, id: row.id }));
    await done('Saved! Students will see the change in the Style Store.');
  };

  const saveQuick = async () => {
    const ids = Object.keys(quick);
    if (!ids.length) return;
    setSaving(true);
    const batch = ids.map((id) => getItem(id)).filter((i): i is Item => !!i).map((i) => itemToRow(i, quick[i.id]));
    // items that are switched off are not registered; rebuild them from their saved row
    for (const id of ids) {
      if (getItem(id)) continue;
      const r = rows.find((x) => x.id === id);
      const it = r ? rowToItem(r) : null;
      if (it) batch.push(itemToRow(it, quick[id]));
    }
    const { error } = await supabase.from('store_items').upsert(batch);
    setSaving(false);
    if (error) {
      setMessage({ tone: 'bad', text: `Could not save: ${error.message}` });
      return;
    }
    setQuick({});
    await done(`Saved ${batch.length} change${batch.length === 1 ? '' : 's'}.`);
  };

  const resetToOriginal = async (id: string) => {
    if (!window.confirm('Put this item back to how it was originally (name, price, colors, text)?')) return;
    const { error } = await supabase.from('store_items').delete().eq('id', id);
    if (error) setMessage({ tone: 'bad', text: error.message });
    else {
      const orig = getOriginalItem(id);
      if (orig) setDraft(draftFromItem(orig, 'edit'));
      await done('Back to the original.');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this item for everyone? This cannot be undone.')) return;
    const { error } = await supabase.from('store_items').delete().eq('id', id);
    if (error) setMessage({ tone: 'bad', text: error.message });
    else {
      if (draft.id === id) setDraft(emptyDraft());
      await done('Deleted.');
    }
  };

  // ---- the list of every item
  const entries: Entry[] = useMemo(() => {
    const live: Entry[] = ITEMS.filter((i) => i.id !== 'x-preview' && !i.hidden).map((item) => ({ item, inactive: false }));
    const off: Entry[] = rows
      .filter((r) => r.active === false && !isBuiltInId(r.id))
      .map((r) => rowToItem(r))
      .filter((i): i is Item => !!i)
      .map((item) => ({ item, inactive: true }));
    return [...live, ...off];
    // the catalog is changed in place; catalogVersion tells us when
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, catalogVersion]);

  const shown = entries.filter(({ item }) => {
    if (catFilter !== 'all' && item.category !== catFilter) return false;
    if (srcFilter === 'builtin' && (item.custom || item.edited)) return false;
    if (srcFilter === 'edited' && !item.edited) return false;
    if (srcFilter === 'mine' && !item.custom) return false;
    return !search || item.name.toLowerCase().includes(search.toLowerCase());
  });

  const setQ = (id: string, patch: Quick) => setQuick((q) => ({ ...q, [id]: { ...q[id], ...patch } }));
  const dirtyCount = Object.keys(quick).length;

  const styles = STYLE_OPTIONS[draft.kind] ?? [];
  const showModel = MODEL_KINDS.includes(draft.kind);
  const suggested = draft.kind === 'set' ? Math.round((draft.pieces.reduce((s, p) => s + (getItem(p) ? priceOf(getItem(p) as Item, []) : 0), 0) * 0.65) / 5) * 5 : null;
  const piecePool = ITEMS.filter((i) => i.slot !== 'set' && i.id !== 'x-preview' && (draft.gender === 'unisex' || i.gender === draft.gender || i.gender === 'unisex'));
  const isEdited = draft.builtIn && !!getItem(draft.id ?? '')?.edited;

  const TextFields = (
    <div className="mt-3 rounded-xl border-2 border-dashed border-border p-3">
      <p className="text-xs font-bold text-primary">Text on the {draft.kind === 'set' ? 'set\'s outfit' : 'outfit'} (optional)</p>
      <p className="text-[11px] text-muted-foreground">Arabic or English. Drag the preview to see the back. The back text is covered if a student wears a backpack.</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <Field label="Front text"><input dir="auto" value={draft.frontText} onChange={(e) => set('frontText', e.target.value)} maxLength={30} placeholder="e.g. LingoBite" className={inputCls} /></Field>
        <Field label="Back text (rear)"><input dir="auto" value={draft.backText} onChange={(e) => set('backText', e.target.value)} maxLength={30} placeholder="مثال: نجم المدرسة" className={inputCls} /></Field>
        <ColorField label="Text color" value={draft.textColor} onChange={(v) => set('textColor', v)} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4">
      <h1 className="font-display text-3xl font-bold text-primary">🛍️ Style Editor</h1>
      <p className="mt-1 text-sm text-muted-foreground">Change any item in the Style Store (prices, names, colors, text on outfits) or add brand-new ones. Students see changes right away.</p>

      {tableMissing && (
        <div className="mt-4 rounded-2xl border-2 border-secondary bg-secondary/10 p-4 text-sm text-primary">
          <p className="font-bold">One-time setup needed</p>
          <p className="mt-1">Open Supabase → SQL Editor, paste the contents of <code className="rounded bg-card px-1">supabase/store_items_patch.sql</code> and press Run. Then refresh this page.</p>
        </div>
      )}

      {/* ----------------------------------------------------------- every item */}
      <section className="card-surface mt-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-primary">All items <span className="text-sm font-normal text-muted-foreground">({shown.length} shown)</span></h2>
          <div className="flex flex-wrap gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" aria-label="Search items" className="rounded-lg border-2 border-border bg-card px-3 py-1.5 text-sm" />
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value as Category | 'all')} aria-label="Category" className="rounded-lg border-2 border-border bg-card px-2 py-1.5 text-sm">
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={srcFilter} onChange={(e) => setSrcFilter(e.target.value as typeof srcFilter)} aria-label="Source" className="rounded-lg border-2 border-border bg-card px-2 py-1.5 text-sm">
              <option value="all">Everything</option>
              <option value="builtin">Original items</option>
              <option value="edited">Items I changed</option>
              <option value="mine">Items I added</option>
            </select>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Change a price, rarity or visibility right here, then press <b>Save changes</b>. Use <b>Edit</b> for everything else. For a set, a price of 0 means "automatic discount"; any other number is the full price of the set.</p>

        {loading ? <p className="mt-3 text-sm text-muted-foreground">Loading…</p> : (
          <div className="mt-3 max-h-[28rem] overflow-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="p-2">Item</th><th className="p-2">For</th><th className="p-2">Price 🪙</th><th className="p-2">Rarity</th><th className="p-2 text-center">Shown</th><th className="p-2" /></tr>
              </thead>
              <tbody>
                {shown.map(({ item, inactive }) => {
                  const q = quick[item.id] ?? {};
                  const visible = q.visible ?? (item.custom ? !inactive : !item.disabled);
                  const dirty = item.id in quick;
                  return (
                    <tr key={item.id} className={`border-t border-border/60 ${dirty ? 'bg-secondary/10' : ''} ${!visible ? 'opacity-60' : ''}`}>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <ItemThumb gender={item.gender === 'boy' ? 'boy' : 'girl'} item={inactive ? null : item} size={44} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-primary">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">{label(item.slot)}{item.edited && <span className="ml-1 rounded bg-secondary/20 px-1 font-bold text-primary">edited</span>}{item.custom && <span className="ml-1 rounded bg-primary/10 px-1 font-bold text-primary">mine</span>}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-xs">{item.gender === 'unisex' ? 'Both' : item.gender === 'boy' ? 'Boy' : 'Girl'}</td>
                      <td className="p-2"><input type="number" min={0} max={99999} value={q.price ?? item.price} onChange={(e) => setQ(item.id, { price: Number(e.target.value) })} aria-label={`Price of ${item.name}`} className="w-20 rounded-lg border-2 border-border bg-card px-2 py-1 text-sm" /></td>
                      <td className="p-2">
                        <select value={q.rarity ?? item.rarity} onChange={(e) => setQ(item.id, { rarity: e.target.value as Rarity })} aria-label={`Rarity of ${item.name}`} className={`rounded-full border-0 px-2 py-1 text-xs font-bold ${RARITY[q.rarity ?? item.rarity].cls}`}>
                          <option value="common">Common</option><option value="rare">Rare</option><option value="epic">Epic</option>
                        </select>
                      </td>
                      <td className="p-2 text-center"><input type="checkbox" checked={visible} onChange={(e) => setQ(item.id, { visible: e.target.checked })} aria-label={`Show ${item.name} in the store`} /></td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <button type="button" onClick={() => { setDraft(draftFromItem(item, 'edit', visible)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg border-2 border-border px-2.5 py-1 text-xs font-bold text-primary hover:border-secondary">Edit</button>
                        <button type="button" onClick={() => setDraft(draftFromItem(item, 'copy', true))} className="ml-1 rounded-lg border-2 border-border px-2.5 py-1 text-xs font-bold text-primary hover:border-secondary">Copy</button>
                        {item.custom && <button type="button" onClick={() => remove(item.id)} className="ml-1 rounded-lg border-2 border-destructive/60 px-2.5 py-1 text-xs font-bold text-destructive">Delete</button>}
                      </td>
                    </tr>
                  );
                })}
                {shown.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">No items match.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={saveQuick} disabled={dirtyCount === 0 || saving || tableMissing} className="rounded-xl bg-gradient-to-b from-[#FFB020] to-[#FF8A1F] px-5 py-2.5 font-extrabold text-white shadow disabled:opacity-50">
            {saving ? 'Saving…' : `Save changes${dirtyCount ? ` (${dirtyCount})` : ''}`}
          </button>
          {dirtyCount > 0 && <button type="button" onClick={() => setQuick({})} className="text-xs font-bold text-muted-foreground underline">Discard</button>}
        </div>
      </section>

      {/* ----------------------------------------------------------- editor */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <section className="card-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-primary">
                {draft.id ? `Editing: ${draft.name || 'item'}` : '1. What is it?'}
              </h2>
              {draft.id ? (
                <button type="button" onClick={() => { setDraft(emptyDraft()); setMessage(null); }} className="rounded-lg border-2 border-border px-3 py-1.5 text-xs font-bold text-primary">+ New item</button>
              ) : (
                <select
                  aria-label="Start from an existing item"
                  value=""
                  onChange={(e) => {
                    const it = getItem(e.target.value);
                    if (it) setDraft(draftFromItem(it, 'copy'));
                  }}
                  className="rounded-lg border-2 border-border bg-card px-2 py-1.5 text-sm"
                >
                  <option value="">Start from an existing item…</option>
                  {ITEMS.filter((i) => !i.hidden && i.slot !== 'set' && i.id !== 'x-preview').map((i) => <option key={i.id} value={i.id}>{label(i.slot)}: {i.name}</option>)}
                </select>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {KINDS.map((k) => (
                <button key={k.id} type="button" disabled={!!draft.id && draft.kind !== k.id} onClick={() => changeKind(k.id)} aria-pressed={draft.kind === k.id} className={`rounded-xl border-2 px-2 py-2 text-center text-xs font-bold disabled:opacity-40 ${draft.kind === k.id ? 'border-[#FF9A1F] bg-[#FF9A1F]/15 text-primary' : 'border-border text-primary'}`}>
                  <span className="block text-xl" aria-hidden="true">{k.icon}</span>
                  {k.label}
                </button>
              ))}
            </div>
            {draft.id && <p className="mt-1 text-[11px] text-muted-foreground">The kind of an existing item can't be changed. Use "Copy" in the list to make a new one from it.</p>}
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
                <Field label="Price (coins)" hint={draft.kind === 'set' ? '0 = automatic discount' : undefined}><input type="number" min={0} max={99999} value={draft.price} onChange={(e) => set('price', Number(e.target.value))} className={inputCls} /></Field>
                <Field label="Rarity">
                  <select value={draft.rarity} onChange={(e) => set('rarity', e.target.value as Rarity)} className={inputCls}>
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                  </select>
                </Field>
              </div>
            </div>
            {suggested !== null && draft.pieces.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Automatic set price would be about 🪙 {suggested}. Type a price above to set your own.</p>}
          </section>

          {draft.kind !== 'set' && (
            <section className="card-surface p-4">
              <h2 className="font-display text-lg font-semibold text-primary">{draft.id ? 'Look' : '2. What does it look like?'}</h2>
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
              {draft.kind === 'outfit' && TextFields}
            </section>
          )}

          {draft.kind === 'set' && (
            <section className="card-surface p-4">
              <h2 className="font-display text-lg font-semibold text-primary">{draft.id ? 'Pieces' : '2. What is inside the set?'} <span className="text-sm font-normal text-muted-foreground">({draft.pieces.length} chosen)</span></h2>
              <div className="mt-2 grid max-h-72 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
                {piecePool.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-sm text-primary">
                    <input type="checkbox" checked={draft.pieces.includes(p.id)} onChange={(e) => set('pieces', e.target.checked ? [...draft.pieces, p.id] : draft.pieces.filter((x) => x !== p.id))} />
                    <span className="truncate">{label(p.slot)}: {p.name}</span>
                  </label>
                ))}
              </div>
              {TextFields}
            </section>
          )}

          <section className="card-surface p-4">
            <h2 className="font-display text-lg font-semibold text-primary">{draft.id ? 'Save' : '3. Save'}</h2>
            <label className="mt-2 flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={draft.visible} onChange={(e) => set('visible', e.target.checked)} />
              Show in the Style Store
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={save} disabled={!valid || saving || tableMissing} className="rounded-xl bg-gradient-to-b from-[#FFB020] to-[#FF8A1F] px-6 py-3 font-extrabold text-white shadow disabled:opacity-50">
                {saving ? 'Saving…' : draft.id ? 'Save changes' : 'Add to the store'}
              </button>
              {isEdited && draft.id && <button type="button" onClick={() => resetToOriginal(draft.id as string)} className="rounded-xl border-2 border-border px-4 py-3 text-sm font-bold text-primary">Reset to original</button>}
              {!valid && <span className="text-xs text-muted-foreground">Give it a name{draft.kind === 'set' ? ' and pick at least 2 pieces (for the boy or the girl)' : ''}{draft.useModel ? ' and a valid model link' : ''}.</span>}
            </div>
            {message && <p className={`mt-2 text-sm font-semibold ${message.tone === 'ok' ? 'text-secondary' : 'text-destructive'}`} aria-live="polite">{message.text}</p>}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-3xl border-4 border-primary bg-card shadow-lg">
            <div className="bg-gradient-to-b from-sky-300 via-sky-200 to-violet-200">
              <AvatarStageView gender={previewGender} look={previewLook} className="h-[380px] w-full" onApi={setStage} />
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <p className="min-w-0 truncate text-sm font-bold text-primary">{draft.name || 'Your item'}</p>
              <div className="flex gap-1">
                <button type="button" onClick={() => stage?.rotateBy(Math.PI)} className="rounded-full border border-border px-3 py-1 text-xs font-bold text-primary">↻ Back</button>
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
