/**
 * Wardrobe props: hats, face gear, neck gear and back gear that sit on top of any explorer.
 *
 * The art is drawn as SVG here (no image files). Placement is automatic: for every explorer frame we measure where
 * the head is (top of the artwork, centre and width of the head) and size/position each prop from that, so props
 * fit whichever explorer sprites are in public/monster-quest/players/, including newly generated ones.
 */
export type PropSlot = 'prop_head' | 'prop_face' | 'prop_neck' | 'prop_back';
export type Facing = 'down' | 'up' | 'side';

export interface PropDef {
  id: string; slot: PropSlot; name: string;
  /** SVG markup (viewBox 0 0 vw vh) */
  vw: number; vh: number; svg: string;
  /** prop width as a multiple of the head width */
  w: number;
  /** where on the explorer the anchor line sits: top of head, eyes, neck, shoulders */
  at: 'top' | 'eyes' | 'neck' | 'back';
  /** fraction of the prop height that sits on the anchor line */
  ay: number;
  /** extra offsets, as multiples of head width */
  ox?: number; oy?: number;
  /** squash/stretch the height (1 = natural aspect) */
  hs?: number;
}

const O = '#3b2a4d'; // outline colour shared by all props
const defs = (id: string, a: string, b: string) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const wrap = (vw: number, vh: number, inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${vw}" height="${vh}" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;
const flower = (cx: number, cy: number, r: number, petal: string, mid = '#ffd43b') =>
  [0, 72, 144, 216, 288].map((a) => `<ellipse cx="${cx}" cy="${cy - r * 0.62}" rx="${r * 0.42}" ry="${r * 0.55}" fill="${petal}" stroke="${O}" stroke-width="2" transform="rotate(${a} ${cx} ${cy})"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="${r * 0.38}" fill="${mid}" stroke="${O}" stroke-width="2"/>`;
const star = (cx: number, cy: number, R: number, r: number) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join(' ');

export const PROPS: PropDef[] = [
  { id: 'cap', slot: 'prop_head', name: 'Explorer Cap', vw: 130, vh: 84, w: 1.12, at: 'top', ay: 0.80, oy: 0.04,
    svg: wrap(130, 84, `<defs>${defs('c1', '#ff6a5c', '#d63a31')}</defs>
      <path d="M14 66 C10 22 40 6 66 6 C96 6 120 26 116 66 Z" fill="url(#c1)" stroke="${O}" stroke-width="4"/>
      <path d="M22 60 C22 30 44 16 64 14" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="5"/>
      <path d="M8 66 Q64 54 118 66 Q128 76 104 78 Q64 72 16 78 Q0 76 8 66 Z" fill="#b82d26" stroke="${O}" stroke-width="4"/>
      <circle cx="66" cy="8" r="5" fill="#ffd43b" stroke="${O}" stroke-width="3"/>
      <polygon points="${star(66, 38, 12, 5)}" fill="#ffd43b" stroke="${O}" stroke-width="3"/>`) },
  { id: 'party', slot: 'prop_head', name: 'Party Hat', vw: 90, vh: 120, w: 0.78, at: 'top', ay: 0.93, oy: 0.06, ox: 0.05,
    svg: wrap(90, 120, `<defs>${defs('p1', '#ff7ac8', '#c93a96')}</defs>
      <path d="M45 10 L82 106 Q45 118 8 106 Z" fill="url(#p1)" stroke="${O}" stroke-width="4"/>
      <path d="M30 56 L64 40 M22 80 L74 58 M36 32 L56 24" stroke="#ffe066" stroke-width="7" fill="none"/>
      <path d="M8 106 Q45 118 82 106" fill="none" stroke="#ffe066" stroke-width="7"/>
      <circle cx="45" cy="10" r="9" fill="#7be0ff" stroke="${O}" stroke-width="3.5"/>`) },
  { id: 'flowers', slot: 'prop_head', name: 'Flower Crown', vw: 150, vh: 54, w: 1.06, at: 'top', ay: 0.62, oy: 0.12,
    svg: wrap(150, 54, `<path d="M6 34 Q75 6 144 34" fill="none" stroke="#2f9e44" stroke-width="9"/><path d="M6 34 Q75 6 144 34" fill="none" stroke="#69db7c" stroke-width="4"/>
      <ellipse cx="32" cy="18" rx="10" ry="5" fill="#69db7c" stroke="${O}" stroke-width="2" transform="rotate(-30 32 18)"/><ellipse cx="118" cy="18" rx="10" ry="5" fill="#69db7c" stroke="${O}" stroke-width="2" transform="rotate(30 118 18)"/>
      ${flower(28, 30, 16, '#ff8fb8')}${flower(52, 20, 14, '#fff3a0', '#ff922b')}${flower(75, 15, 18, '#ff6b81')}${flower(98, 20, 14, '#c9a7ff', '#ffd43b')}${flower(122, 30, 16, '#7bd3ff')}`) },
  { id: 'catears', slot: 'prop_head', name: 'Cat Ears', vw: 150, vh: 80, w: 1.04, at: 'top', ay: 0.80, oy: 0.07,
    svg: wrap(150, 80, `<defs>${defs('e1', '#4a3a66', '#2b2040')}</defs>
      <path d="M10 70 Q75 52 140 70" fill="none" stroke="${O}" stroke-width="13"/><path d="M10 70 Q75 52 140 70" fill="none" stroke="#6b55a0" stroke-width="7"/>
      <path d="M14 66 L22 8 L62 56 Z" fill="url(#e1)" stroke="${O}" stroke-width="4"/><path d="M136 66 L128 8 L88 56 Z" fill="url(#e1)" stroke="${O}" stroke-width="4"/>
      <path d="M24 56 L27 22 L50 50 Z" fill="#ff9ec7"/><path d="M126 56 L123 22 L100 50 Z" fill="#ff9ec7"/>`) },
  { id: 'wizard', slot: 'prop_head', name: 'Wizard Hat', vw: 150, vh: 150, w: 1.34, at: 'top', ay: 0.86, oy: 0.08,
    svg: wrap(150, 150, `<defs>${defs('w1', '#7a5cf0', '#4326b8')}</defs>
      <path d="M66 10 Q80 6 88 20 Q112 70 122 116 L28 116 Q50 70 62 26 Q62 14 66 10 Z" fill="url(#w1)" stroke="${O}" stroke-width="4"/>
      <path d="M66 12 Q96 8 100 34" fill="none" stroke="#7a5cf0" stroke-width="2"/>
      <path d="M8 120 Q75 98 142 120 Q146 134 126 138 Q75 128 24 138 Q4 134 8 120 Z" fill="#5a3bd0" stroke="${O}" stroke-width="4"/>
      <path d="M28 116 Q75 104 122 116 L124 124 Q75 114 26 124 Z" fill="#ffd43b" stroke="${O}" stroke-width="3"/>
      <polygon points="${star(78, 62, 11, 4.5)}" fill="#ffe066" stroke="${O}" stroke-width="2.5"/><polygon points="${star(60, 92, 7, 3)}" fill="#fff" stroke="${O}" stroke-width="2"/>
      <circle cx="98" cy="84" r="3" fill="#fff"/>`) },
  { id: 'crown', slot: 'prop_head', name: 'Golden Crown', vw: 130, vh: 90, w: 0.86, at: 'top', ay: 0.88, oy: 0.1,
    svg: wrap(130, 90, `<defs>${defs('k1', '#ffe680', '#f0a800')}</defs>
      <path d="M12 76 L8 22 L36 46 L65 10 L94 46 L122 22 L118 76 Z" fill="url(#k1)" stroke="${O}" stroke-width="4"/>
      <rect x="12" y="66" width="106" height="16" rx="5" fill="#ffc21a" stroke="${O}" stroke-width="4"/>
      <circle cx="8" cy="20" r="6" fill="#ff5d73" stroke="${O}" stroke-width="3"/><circle cx="65" cy="9" r="7" fill="#5de0ff" stroke="${O}" stroke-width="3"/><circle cx="122" cy="20" r="6" fill="#ff5d73" stroke="${O}" stroke-width="3"/>
      <circle cx="35" cy="74" r="5" fill="#ff5d73" stroke="${O}" stroke-width="2"/><circle cx="65" cy="74" r="6" fill="#5de0ff" stroke="${O}" stroke-width="2"/><circle cx="95" cy="74" r="5" fill="#7dff9a" stroke="${O}" stroke-width="2"/>
      <path d="M22 62 L16 34" stroke="#fff" stroke-opacity=".55" stroke-width="4"/>`) },
  { id: 'glasses', slot: 'prop_face', name: 'Round Glasses', vw: 130, vh: 54, w: 0.78, at: 'eyes', ay: 0.5,
    svg: wrap(130, 54, `<circle cx="34" cy="27" r="22" fill="#bfe9ff" fill-opacity=".38" stroke="${O}" stroke-width="5"/><circle cx="96" cy="27" r="22" fill="#bfe9ff" fill-opacity=".38" stroke="${O}" stroke-width="5"/>
      <path d="M56 24 Q65 18 74 24" fill="none" stroke="${O}" stroke-width="5"/><path d="M14 22 L4 18 M116 22 L126 18" stroke="${O}" stroke-width="5"/>
      <path d="M20 18 Q26 10 36 10" fill="none" stroke="#fff" stroke-width="4" stroke-opacity=".8"/><path d="M82 18 Q88 10 98 10" fill="none" stroke="#fff" stroke-width="4" stroke-opacity=".8"/>`) },
  { id: 'stars', slot: 'prop_face', name: 'Star Shades', vw: 140, vh: 60, w: 0.78, at: 'eyes', ay: 0.5,
    svg: wrap(140, 60, `<defs>${defs('s1', '#ff7ac8', '#8a3cff')}</defs>
      <polygon points="${star(36, 31, 29, 14)}" fill="url(#s1)" stroke="${O}" stroke-width="4"/><polygon points="${star(104, 31, 29, 14)}" fill="url(#s1)" stroke="${O}" stroke-width="4"/>
      <path d="M62 28 Q70 22 78 28" fill="none" stroke="${O}" stroke-width="5"/>
      <path d="M26 24 L32 14" stroke="#fff" stroke-opacity=".75" stroke-width="4"/><path d="M94 24 L100 14" stroke="#fff" stroke-opacity=".75" stroke-width="4"/>`) },
  { id: 'goggles', slot: 'prop_face', name: 'Aviator Goggles', vw: 150, vh: 62, w: 0.86, at: 'eyes', ay: 0.5,
    svg: wrap(150, 62, `<defs>${defs('g1', '#ffe9a8', '#ffb33d')}</defs>
      <path d="M2 24 L20 26 M148 24 L130 26" stroke="${O}" stroke-width="9"/><path d="M2 24 L20 26 M148 24 L130 26" stroke="#8a5a2b" stroke-width="5"/>
      <circle cx="42" cy="32" r="25" fill="#8a5a2b" stroke="${O}" stroke-width="4"/><circle cx="108" cy="32" r="25" fill="#8a5a2b" stroke="${O}" stroke-width="4"/>
      <circle cx="42" cy="32" r="18" fill="url(#g1)" stroke="${O}" stroke-width="3"/><circle cx="108" cy="32" r="18" fill="url(#g1)" stroke="${O}" stroke-width="3"/>
      <rect x="64" y="26" width="22" height="10" rx="4" fill="#8a5a2b" stroke="${O}" stroke-width="3"/>
      <path d="M32 24 Q36 18 44 18" fill="none" stroke="#fff" stroke-width="4" stroke-opacity=".85"/><path d="M98 24 Q102 18 110 18" fill="none" stroke="#fff" stroke-width="4" stroke-opacity=".85"/>`) },
  { id: 'bowtie', slot: 'prop_neck', name: 'Bow Tie', vw: 100, vh: 56, w: 0.5, at: 'neck', ay: 0.5,
    svg: wrap(100, 56, `<defs>${defs('b1', '#ff6a7a', '#c4283f')}</defs>
      <path d="M50 28 L8 6 Q-2 28 8 50 Z" fill="url(#b1)" stroke="${O}" stroke-width="4"/><path d="M50 28 L92 6 Q102 28 92 50 Z" fill="url(#b1)" stroke="${O}" stroke-width="4"/>
      <rect x="40" y="16" width="20" height="24" rx="7" fill="#e5394f" stroke="${O}" stroke-width="4"/><path d="M16 16 L34 25 M84 16 L66 25" stroke="#fff" stroke-opacity=".4" stroke-width="3"/>`) },
  { id: 'scarf', slot: 'prop_neck', name: 'Cozy Scarf', vw: 150, vh: 80, w: 0.92, at: 'neck', ay: 0.28,
    svg: wrap(150, 80, `<defs>${defs('f1', '#ff7b6b', '#d9412f')}</defs>
      <path d="M96 30 L120 70 Q128 78 138 70 L122 28 Z" fill="url(#f1)" stroke="${O}" stroke-width="4"/>
      <path d="M104 46 L128 56 M110 58 L132 66" stroke="#fff" stroke-width="5"/>
      <path d="M8 24 Q75 52 142 22 L138 38 Q75 64 12 40 Z" fill="url(#f1)" stroke="${O}" stroke-width="4"/>
      <path d="M26 34 L30 48 M50 40 L52 54 M76 42 L76 56 M102 38 L100 52 M124 32 L120 44" stroke="#fff" stroke-width="5"/>`) },
  { id: 'pack', slot: 'prop_back', name: 'Leaf Backpack', vw: 130, vh: 140, w: 0.8, at: 'back', ay: 0.30, oy: 0.16, hs: 0.9,
    svg: wrap(130, 140, `<defs>${defs('l1', '#7fe06a', '#2f9e44')}</defs>
      <path d="M65 6 C112 10 126 60 112 110 Q100 132 65 134 Q30 132 18 110 C4 60 18 10 65 6 Z" fill="url(#l1)" stroke="${O}" stroke-width="4"/>
      <path d="M65 14 L65 126" stroke="#2b7a3a" stroke-width="4"/><path d="M65 44 L38 30 M65 70 L30 54 M65 96 L36 80 M65 44 L92 30 M65 70 L100 54 M65 96 L94 80" stroke="#2b7a3a" stroke-width="3"/>
      <path d="M30 34 C26 56 28 78 34 96" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="5"/>
      <rect x="48" y="104" width="34" height="18" rx="6" fill="#c98a3d" stroke="${O}" stroke-width="3.5"/><circle cx="65" cy="113" r="3.5" fill="#ffd43b"/>`) },
  { id: 'cape', slot: 'prop_back', name: 'Red Cape', vw: 170, vh: 170, w: 1.2, at: 'back', ay: 0.08, oy: 0.06, hs: 0.72,
    svg: wrap(170, 170, `<defs>${defs('r1', '#ff5a5a', '#b3202a')}</defs>
      <path d="M40 8 Q85 -2 130 8 Q150 70 164 158 Q120 170 85 158 Q50 170 6 158 Q20 70 40 8 Z" fill="url(#r1)" stroke="${O}" stroke-width="4"/>
      <path d="M62 14 Q56 90 48 160 M108 14 Q114 90 124 160" fill="none" stroke="#8a1822" stroke-opacity=".55" stroke-width="5"/>
      <path d="M44 22 Q30 80 22 140" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>
      <path d="M6 158 Q50 170 85 158 Q120 170 164 158" fill="none" stroke="#ffd43b" stroke-width="6"/>
      <circle cx="85" cy="10" r="9" fill="#ffd43b" stroke="${O}" stroke-width="3.5"/>`) },
  { id: 'wings', slot: 'prop_back', name: 'Fairy Wings', vw: 240, vh: 150, w: 1.9, at: 'back', ay: 0.46, oy: 0.1,
    svg: wrap(240, 150, `<defs><linearGradient id="n1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9f4ff"/><stop offset="1" stop-color="#d4b8ff"/></linearGradient></defs>
      <g fill="url(#n1)" fill-opacity=".86" stroke="${O}" stroke-width="3.5">
      <path d="M116 66 C90 4 20 -2 8 30 C0 58 56 76 116 70 Z"/><path d="M124 66 C150 4 220 -2 232 30 C240 58 184 76 124 70 Z"/>
      <path d="M116 76 C84 84 30 100 36 130 C44 150 100 130 116 82 Z"/><path d="M124 76 C156 84 210 100 204 130 C196 150 140 130 124 82 Z"/></g>
      <g fill="none" stroke="#9a7fd0" stroke-width="2" stroke-opacity=".8"><path d="M112 66 C80 44 40 34 20 34 M112 68 C80 60 50 56 24 52"/><path d="M128 66 C160 44 200 34 220 34 M128 68 C160 60 190 56 216 52"/><path d="M112 80 C86 96 60 110 44 124"/><path d="M128 80 C154 96 180 110 196 124"/></g>
      <g fill="#fff" fill-opacity=".7"><circle cx="40" cy="40" r="5"/><circle cx="200" cy="40" r="5"/></g>`) },
];
export const PROP_BY_ID = new Map(PROPS.map((p) => [p.id, p]));
export const propUrl = (p: PropDef) => `data:image/svg+xml;utf8,${encodeURIComponent(p.svg)}`;

// ------------------------------------------------------------------ measuring explorer frames
export interface HeadBox { top: number; bottom: number; cx: number; headW: number; w: number; h: number }
const cache = new Map<string, HeadBox | null>();

/** Finds the head of an explorer frame from its transparent pixels. Returns null until the image has loaded. */
export function measureFrame(img: HTMLImageElement): HeadBox | null {
  const key = img.currentSrc || img.src;
  if (cache.has(key)) return cache.get(key)!;
  if (!img.complete || !img.naturalWidth) return null;
  const w = img.naturalWidth, h = img.naturalHeight;
  let res: HeadBox | null = null;
  try {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d', { willReadFrequently: true })!; c.drawImage(img, 0, 0);
    const d = c.getImageData(0, 0, w, h).data;
    const rowExtent = (y: number): [number, number] | null => { let a = -1, b = -1; for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (a < 0) a = x; b = x; } return a < 0 ? null : [a, b]; };
    let top = -1, bottom = -1;
    for (let y = 0; y < h; y++) { if (rowExtent(y)) { if (top < 0) top = y; bottom = y; } }
    if (top >= 0) {
      const H = bottom - top; let lo = Infinity, hi = -Infinity;
      // the head is the widest, roundest part in the top third; sample a band well inside it
      for (let y = Math.round(top + H * 0.12); y <= Math.round(top + H * 0.30); y++) { const e = rowExtent(y); if (e) { lo = Math.min(lo, e[0]); hi = Math.max(hi, e[1]); } }
      if (isFinite(lo)) res = { top, bottom, cx: (lo + hi) / 2, headW: Math.max(20, hi - lo), w, h };
    }
  } catch { res = null; }
  cache.set(key, res);
  return res;
}

export interface PropPlacement { x: number; y: number; w: number; h: number; behind: boolean }
/** Where to draw a prop, in the frame's own pixel space (x, y = top-left corner). null = hidden from this angle. */
export function placeProp(p: PropDef, m: HeadBox, facing: Facing): PropPlacement | null {
  if (facing === 'up' && (p.slot === 'prop_face' || p.slot === 'prop_neck')) return null;
  const hw = m.headW, w = p.w * hw, h = w * (p.vh / p.vw) * (p.hs ?? 1);
  const ref = p.at === 'top' ? m.top : p.at === 'eyes' ? m.top + hw * 0.64 : p.at === 'neck' ? m.top + hw * 0.98 : m.top + hw * 1.1;
  let cx = m.cx + (p.ox ?? 0) * hw;
  if (facing === 'side') cx += p.slot === 'prop_face' ? hw * 0.2 : p.slot === 'prop_back' ? -hw * 0.34 : p.slot === 'prop_neck' ? hw * 0.02 : hw * 0.02;
  if (facing === 'side' && p.slot === 'prop_face') { /* narrower seen from the side */ return { x: cx - w * 0.36, y: ref + (p.oy ?? 0) * hw - p.ay * h, w: w * 0.72, h, behind: false }; }
  if (facing === 'side' && p.slot === 'prop_back') return { x: cx - w * 0.38, y: ref + (p.oy ?? 0) * hw - p.ay * h, w: w * 0.76, h, behind: true };
  return { x: cx - w / 2, y: ref + (p.oy ?? 0) * hw - p.ay * h, w, h, behind: p.slot === 'prop_back' && facing !== 'up' };
}
