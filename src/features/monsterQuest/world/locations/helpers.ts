/** Shared authoring helpers for the storybook locations (same code as emberlands.ts, copied so World 1 stays untouched). */
import type { InteractDef, LocationDef, Pt, PropDef, ZoneDef } from '../types';
import { blobPoly, rng, smooth } from '../util';

// ------------------------------------------------------------------ helpers
export function distSeg(p: Pt, a: Pt, b: Pt) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)); return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t)); }
export function distPoly(p: Pt, pts: Pt[]) { let d = 1e9; for (let i = 1; i < pts.length; i++) d = Math.min(d, distSeg(p, pts[i - 1], pts[i])); return d; }
export function insidePoly(x: number, y: number, poly: Pt[]) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; }

export interface Avoid { paths: { pts: Pt[]; width: number }[]; liquids: { pts: Pt[]; width?: number; closed?: boolean }[]; zones: Pt[][]; points: { x: number; y: number; r: number }[]; plateaus?: Pt[][]; floorsOnly?: Pt[][] }
export function scatter(seed: string, n: number, w: number, h: number, av: Avoid, kinds: { kind: PropDef['kind']; v?: number[]; s?: [number, number]; w: number }[], inset = 150): PropDef[] {
  const r = rng(seed), out: PropDef[] = [], total = kinds.reduce((a, k) => a + k.w, 0);
  const paths = av.paths.map((p) => ({ pts: smooth(p.pts, 6), width: p.width })), liq = av.liquids.map((l) => ({ pts: l.closed ? smooth(l.pts, 6, true) : smooth(l.pts, 6), width: l.width ?? 0, closed: l.closed }));
  const zones = av.zones.map((z) => smooth(z, 4, true));
  for (let tries = 0; out.length < n && tries < n * 60; tries++) {
    const x = inset + r() * (w - inset * 2), y = inset + r() * (h - inset * 2), p: Pt = [x, y];
    if (paths.some((q) => distPoly(p, q.pts) < q.width / 2 + 70)) continue;
    if (liq.some((q) => (q.closed ? insidePoly(x, y, q.pts) || distPoly(p, q.pts) < 80 : distPoly(p, q.pts) < q.width / 2 + 70))) continue;
    if (zones.some((z) => insidePoly(x, y, z) || distPoly(p, z) < 50)) continue;
    if (av.points.some((q) => Math.hypot(q.x - x, q.y - y) < q.r)) continue;
    if (av.floorsOnly && !av.floorsOnly.some((f) => insidePoly(x, y, smooth(f, 4, true)))) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.y - y) < 90)) continue;
    let k = r() * total, pick = kinds[0]; for (const kk of kinds) { if ((k -= kk.w) <= 0) { pick = kk; break; } }
    const v = pick.v ? pick.v[Math.floor(r() * pick.v.length)] : undefined, s = pick.s ? pick.s[0] + r() * (pick.s[1] - pick.s[0]) : 1;
    out.push({ kind: pick.kind, x, y, v, s });
  }
  return out;
}
export const avoidOf = (d: { paths: any[]; liquids: any[]; zones: ZoneDef[]; bridges: any[]; interactables: InteractDef[]; props: PropDef[]; gates: any[] }): Avoid => ({
  paths: [...d.paths.map((p) => ({ pts: p.pts, width: p.width })), ...d.bridges.map((b) => ({ pts: [b.a, b.b] as Pt[], width: b.width + 40 }))],
  liquids: d.liquids, zones: d.zones.map((z) => z.poly),
  points: [...d.interactables.map((i) => ({ x: i.x, y: i.y, r: 130 })), ...d.props.map((p) => ({ x: p.x, y: p.y, r: p.kind === 'house' ? 200 : p.kind === 'fountain' || p.kind === 'statue' ? 220 : 90 })), ...d.gates.map((g: any) => ({ x: g.rect[0] + g.rect[2] / 2, y: g.rect[1] + g.rect[3] / 2, r: 320 }))],
});
export const zone = (id: string, label: string, cx: number, cy: number, rx: number, ry: number, ground: 'ash' | 'moss', pool: string[], extra: Partial<ZoneDef> = {}): ZoneDef => ({ id, label, ground, pool, poly: blobPoly(cx, cy, rx, ry, id, 0.1, 10).filter((_, i) => i % 6 === 0), ...extra });

/** Grows an authored location by `k`: places move apart, plazas and gates grow, widths of paths and rivers (and object sizes) stay. */
export function scaleLoc(d: LocationDef, k: number): LocationDef {
  const P = (p: Pt): Pt => [Math.round(p[0] * k), Math.round(p[1] * k)];
  return {
    ...d, w: Math.round(d.w * k), h: Math.round(d.h * k), forestY: d.forestY ? Math.round(d.forestY * k) : undefined,
    blockers: (d.blockers ?? []).map((b) => ({ ...b, x: b.x * k, y: b.y * k, rx: b.rx * k, ry: b.ry * k })),
    plazas: (d.plazas ?? []).map((q) => ({ ...q, x: q.x * k, y: q.y * k, rx: q.rx * k * 0.92, ry: q.ry * k * 0.92 })),
    paths: d.paths.map((q) => ({ ...q, pts: q.pts.map(P) })),
    liquids: d.liquids.map((q) => ({ ...q, pts: q.pts.map(P) })),
    bridges: d.bridges.map((q) => { const cx = ((q.a[0] + q.b[0]) / 2) * k, cy = ((q.a[1] + q.b[1]) / 2) * k, hx = (q.b[0] - q.a[0]) / 2, hy = (q.b[1] - q.a[1]) / 2; return { ...q, a: [cx - hx, cy - hy] as Pt, b: [cx + hx, cy + hy] as Pt }; }),
    zones: d.zones.map((z) => ({ ...z, poly: z.poly.map(P) })),
    gates: d.gates.map((g) => ({ ...g, rect: g.rect.map((v) => Math.round(v * k)) as [number, number, number, number] })),
    entrances: Object.fromEntries(Object.entries(d.entrances).map(([n, e]) => [n, { ...e, x: Math.round(e.x * k), y: Math.round(e.y * k) }])),
    props: d.props.map((q) => ({ ...q, x: q.x * k, y: q.y * k })),
    interactables: d.interactables.map((q) => ({ ...q, x: q.x * k, y: q.y * k })),
    lights: (d.lights ?? []).map((q) => ({ ...q, x: q.x * k, y: q.y * k, r: q.r * k })),
    landmark: d.landmark ? { ...d.landmark, x: d.landmark.x * k, y: d.landmark.y * k } : d.landmark,
  };
}
/** props placed beside a path, every `step` px, alternating sides, `off` px from its centre line */
export function beside(pts: Pt[], step: number, off: number, make: (x: number, y: number, i: number) => PropDef): PropDef[] {
  const sp = smooth(pts, 8, false), out: PropDef[] = []; let acc = step * 0.4, i = 0;
  for (let k = 1; k < sp.length; k++) {
    const [ax, ay] = sp[k - 1], [bx, by] = sp[k], len = Math.hypot(bx - ax, by - ay); if (!len) continue; acc += len;
    if (acc >= step) { acc = 0; const side = i % 2 ? 1 : -1; out.push(make(bx + (-(by - ay) / len) * off * side, by + ((bx - ax) / len) * off * side, i)); i++; }
  }
  return out;
}

export const rrPts = (x0: number, y0: number, x1: number, y1: number, r: number): Pt[] => { const o: Pt[] = []; const arc = (cx: number, cy: number, a0: number) => { for (let k = 0; k <= 3; k++) { const a = a0 + (k * Math.PI) / 6; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }; arc(x1 - r, y0 + r, -Math.PI / 2); arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, Math.PI / 2); arc(x0 + r, y0 + r, Math.PI); return o; };
export const blob = (cx: number, cy: number, rx: number, ry: number, id: string, wob = 0.08): Pt[] => blobPoly(cx, cy, rx, ry, id, wob, 12).filter((_, i) => i % 6 === 0);
