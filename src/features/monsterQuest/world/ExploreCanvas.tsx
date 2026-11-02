import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Look, ZonePalette } from '../types';
import { trainerDataUrl, type Facing } from '../art/Trainer';
import { findPath, generateMap, GROUND, PATH, ROCK, TALL, TREE, WATER, walkable, type GameMap, type Tile } from './map';

export type DPad = 'up' | 'down' | 'left' | 'right';
const TW = 64, TH = 32, STEP_S = 0.2;
const KEYMAP: Record<string, DPad> = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };

interface Props {
  zoneId: string; palette: ZonePalette; paused: boolean; look?: Look;
  pad: MutableRefObject<Set<DPad>>;
  onStep: (tile: Tile) => void;
}
interface Mote { x: number; y: number; vx: number; vy: number; r: number; a: number; ph: number }

function drawScenery(ctx: CanvasRenderingContext2D, pal: ZonePalette, cx: number, cy: number, gx: number, gy: number, time: number) {
  const style = pal.style ?? 'tree', sw = Math.sin(time * 1.5 + gx * 1.3 + gy) * 2.5;
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(cx, cy + 4, 22, 9, 0, 0, 6.3); ctx.fill();
  const hash = (gx * 7 + gy * 13) % 5;
  if (style === 'cactus') {
    ctx.fillStyle = pal.tree; ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2;
    const rr = (x: number, y: number, w: number, h: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, w / 2); ctx.fill(); ctx.stroke(); };
    rr(cx - 8, cy - 52 - hash * 2, 16, 56 + hash * 2); rr(cx - 26, cy - 36, 12, 24); rr(cx - 26, cy - 20, 20, 10); rr(cx + 14, cy - 42, 12, 26); rr(cx + 6, cy - 24, 20, 10);
  } else if (style === 'pine') {
    ctx.fillStyle = pal.trunk; ctx.fillRect(cx - 4, cy - 14, 8, 18);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? pal.tree : '#3b9c88'; ctx.beginPath(); ctx.moveTo(cx + sw * 0.3 * k, cy - 70 + k * 6); ctx.lineTo(cx + 24 + k * 6, cy - 14 - (2 - k) * 4 + 6 * (k - 1) + 14); ctx.lineTo(cx - 24 - k * 6, cy - 14 - (2 - k) * 4 + 6 * (k - 1) + 14); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx, cy - 70); ctx.lineTo(cx + 9, cy - 52); ctx.lineTo(cx - 9, cy - 52); ctx.closePath(); ctx.fill();
  } else if (style === 'palm') {
    ctx.strokeStyle = pal.trunk; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.quadraticCurveTo(cx + 10 + sw, cy - 30, cx + 4 + sw, cy - 56); ctx.stroke();
    ctx.fillStyle = pal.tree;
    for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28 + sw * 0.03; ctx.beginPath(); ctx.ellipse(cx + 4 + sw + Math.cos(a) * 20, cy - 58 + Math.sin(a) * 9, 20, 6, a, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(cx + 2 + sw, cy - 54, 4, 0, 6.3); ctx.arc(cx + 9 + sw, cy - 52, 4, 0, 6.3); ctx.fill();
  } else if (style === 'crystal') {
    const cols = [pal.tree, '#e599f7', '#66d9e8'];
    for (let k = 0; k < 3; k++) {
      const ox = (k - 1) * 14, h = 38 + ((hash + k * 3) % 4) * 8 - (k === 1 ? 0 : 8), col = cols[(hash + k) % 3];
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx + ox, cy - h); ctx.lineTo(cx + ox + 11, cy - 10); ctx.lineTo(cx + ox, cy + 2); ctx.lineTo(cx + ox - 11, cy - 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(cx + ox, cy - h); ctx.lineTo(cx + ox - 11, cy - 10); ctx.lineTo(cx + ox - 2, cy - 12); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(time * 3 + gx + gy)})`; ctx.beginPath(); ctx.arc(cx + 10, cy - 38, 2.5, 0, 6.3); ctx.fill();
  } else if (style === 'rock') {
    ctx.fillStyle = pal.trunk; ctx.beginPath(); ctx.moveTo(cx - 24, cy + 2); ctx.lineTo(cx - 14, cy - 34 - hash * 3); ctx.lineTo(cx + 2, cy - 46 - hash * 2); ctx.lineTo(cx + 18, cy - 28); ctx.lineTo(cx + 26, cy + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,60,.55)'; ctx.beginPath(); ctx.moveTo(cx - 4, cy - 30); ctx.lineTo(cx + 2, cy - 12); ctx.lineTo(cx + 8, cy - 28); ctx.closePath(); ctx.fill();
  } else if (style === 'building') {
    const h = 50 + hash * 10, w = 22, tops = [pal.tree, '#7950f2', '#339af0', '#f06595'][hash % 4];
    ctx.fillStyle = tops; ctx.beginPath(); ctx.moveTo(cx - w, cy - 10); ctx.lineTo(cx, cy + 2); ctx.lineTo(cx, cy - h); ctx.lineTo(cx - w, cy - h - 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.moveTo(cx + w, cy - 10); ctx.lineTo(cx, cy + 2); ctx.lineTo(cx, cy - h); ctx.lineTo(cx + w, cy - h - 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(cx - w, cy - h - 12); ctx.lineTo(cx, cy - h); ctx.lineTo(cx + w, cy - h - 12); ctx.lineTo(cx, cy - h - 24); ctx.closePath(); ctx.fill();
    for (let r = 0; r < Math.floor(h / 16); r++) { const on = Math.sin(time * 0.8 + r * 2 + gx * 3 + gy) > -0.3; ctx.fillStyle = on ? '#ffe066' : '#364fc7'; ctx.fillRect(cx - 15, cy - 20 - r * 16 - 2, 7, 8); ctx.fillRect(cx - 5, cy - 14 - r * 16 - 2, 7, 8); }
  } else {
    ctx.fillStyle = pal.trunk; ctx.fillRect(cx - 5, cy - 22, 10, 26);
    ctx.fillStyle = pal.tree;
    for (const [ox, oy, r] of [[0, -50, 22], [-14, -34, 18], [14, -34, 18], [0, -34, 22]] as const) { ctx.beginPath(); ctx.arc(cx + ox + sw * (oy / -50), cy + oy, r, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.arc(cx - 7 + sw, cy - 56, 9, 0, 6.3); ctx.fill();
  }
}

const iso = (gx: number, gy: number) => ({ x: (gx - gy) * (TW / 2), y: (gx + gy) * (TH / 2) });

export function ExploreCanvas({ zoneId, palette, paused, pad, onStep, look }: Props) {
  const lookKey = JSON.stringify(look ?? null);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const stepRef = useRef(onStep); stepRef.current = onStep;

  useEffect(() => {
    const cv = canvas.current!, host = wrap.current!, ctx = cv.getContext('2d')!;
    const map: GameMap = generateMap(zoneId, { waterBias: palette.water_bias, treeDensity: palette.tree_density });
    const S = map.size;
    const me = { x: map.spawn.x, y: map.spawn.y, fx: map.spawn.x, fy: map.spawn.y, tx: map.spawn.x, ty: map.spawn.y, t: 1, facing: 'down' as Facing, flip: false, queue: [] as { x: number; y: number }[], target: null as { x: number; y: number } | null };
    const cam = { x: 0, y: 0 };
    let W = 0, H = 0, dpr = 1, scale = 1;

    const imgs: Record<string, HTMLImageElement> = {};
    for (const f of ['down', 'up', 'side'] as Facing[]) for (const s of [0, 1, 2] as const) {
      const im = new Image(); im.src = trainerDataUrl({ facing: f, step: s }, 96, look); imgs[`${f}${s}`] = im;
    }
    const rng = Math.random;
    const motes: Mote[] = Array.from({ length: 26 }, () => ({ x: rng(), y: rng(), vx: 0.01 + rng() * 0.02, vy: 0.008 + rng() * 0.02, r: 2 + rng() * 3, a: 0.3 + rng() * 0.5, ph: rng() * 6.28 }));

    const resize = () => {
      const r = host.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(200, r.width); H = Math.max(240, r.height);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = `${W}px`; cv.style.height = `${H}px`;
      scale = Math.min(1.3, Math.max(0.7, W / 760));
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(host);

    const tileAt = (x: number, y: number): Tile => map.tiles[y * S + x];
    stepRef.current(tileAt(me.x, me.y));

    // ---- input
    const keyDown = (e: KeyboardEvent) => {
      const d = KEYMAP[e.key]; if (!d) return;
      const tag = (e.target as HTMLElement)?.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault(); pad.current.add(d); me.queue = []; me.target = null;
    };
    const keyUp = (e: KeyboardEvent) => { const d = KEYMAP[e.key]; if (d) pad.current.delete(d); };
    const blur = () => pad.current.clear();
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); window.addEventListener('blur', blur);

    const onPointer = (e: PointerEvent) => {
      if (pausedRef.current) return;
      const r = cv.getBoundingClientRect();
      const sx = (e.clientX - r.left - W / 2) / scale + cam.x, sy = (e.clientY - r.top - H / 2) / scale + cam.y;
      const gx = Math.round((sx / (TW / 2) + sy / (TH / 2)) / 2), gy = Math.round((sy / (TH / 2) - sx / (TW / 2)) / 2);
      const from = { x: me.t >= 1 ? me.x : me.tx, y: me.t >= 1 ? me.y : me.ty };
      const path = findPath(map, from, { x: gx, y: gy });
      if (path && path.length) { me.queue = path; me.target = { x: gx, y: gy }; }
    };
    cv.addEventListener('pointerdown', onPointer);

    // ---- loop
    let raf = 0, last = performance.now(), time = 0;
    const tryStep = (dx: number, dy: number) => {
      const ok = (ax: number, ay: number) => walkable(map, me.x + ax, me.y + ay);
      if (dx && dy) {
        if (ok(dx, dy) && ok(dx, 0) && ok(0, dy)) return [dx, dy] as const;
        if (ok(dx, 0)) return [dx, 0] as const;
        if (ok(0, dy)) return [0, dy] as const;
        return null;
      }
      return ok(dx, dy) ? ([dx, dy] as const) : null;
    };
    const startStep = (dx: number, dy: number) => {
      me.fx = me.x; me.fy = me.y; me.tx = me.x + dx; me.ty = me.y + dy; me.t = 0;
      const sdx = dx - dy, sdy = dx + dy; // screen direction
      if (sdy < 0 && Math.abs(sdy) >= Math.abs(sdx)) { me.facing = 'up'; me.flip = false; }
      else if (sdy > 0 && Math.abs(sdy) > Math.abs(sdx)) { me.facing = 'down'; me.flip = false; }
      else { me.facing = 'side'; me.flip = sdx < 0; }
    };

    const update = (dt: number) => {
      if (me.t < 1) {
        me.t = Math.min(1, me.t + dt / STEP_S);
        me.x = me.fx + (me.tx - me.fx) * me.t; me.y = me.fy + (me.ty - me.fy) * me.t;
        if (me.t >= 1) {
          me.x = me.tx; me.y = me.ty;
          stepRef.current(tileAt(me.x, me.y));
          if (me.queue.length === 0) me.target = null;
        }
      }
      if (me.t >= 1 && !pausedRef.current) {
        const p = pad.current;
        const sx = (p.has('right') ? 1 : 0) - (p.has('left') ? 1 : 0), sy = (p.has('down') ? 1 : 0) - (p.has('up') ? 1 : 0);
        if (sx || sy) {
          const s = tryStep(Math.sign(sx + sy), Math.sign(sy - sx));
          if (s) startStep(s[0], s[1]);
        } else if (me.queue.length) {
          const n = me.queue.shift()!;
          if (walkable(map, n.x, n.y)) startStep(Math.sign(n.x - me.x), Math.sign(n.y - me.y)); else { me.queue = []; me.target = null; }
        }
      }
      const c = iso(me.x, me.y);
      cam.x += (c.x - cam.x) * Math.min(1, dt * 8); cam.y += (c.y - cam.y) * Math.min(1, dt * 8);
    };

    const diamond = (cx: number, cy: number, fill: string, grow = 0.6) => {
      ctx.beginPath(); ctx.moveTo(cx, cy - TH / 2 - grow); ctx.lineTo(cx + TW / 2 + grow, cy); ctx.lineTo(cx, cy + TH / 2 + grow); ctx.lineTo(cx - TW / 2 - grow, cy); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
    };

    const draw = () => {
      const g = ctx.createLinearGradient(0, 0, 0, H * dpr);
      g.addColorStop(0, palette.sky[0]); g.addColorStop(1, palette.sky[1]);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (W / 2 - cam.x * scale), dpr * (H / 2 - cam.y * scale));

      const drawables: { d: number; f: () => void }[] = [];
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const t = tileAt(x, y), c = iso(x, y), i = y * S + x;
        if (c.x < cam.x - W / scale / 2 - 80 || c.x > cam.x + W / scale / 2 + 80 || c.y < cam.y - H / scale / 2 - 80 || c.y > cam.y + H / scale / 2 + 80) continue;
        const checker = (x + y) & 1;
        if (t === WATER) {
          const lava = palette.liquid === 'lava';
          diamond(c.x, c.y, palette.water);
          const w = Math.sin(time * 2 + x * 0.9 + y * 0.7);
          if (lava) { diamond(c.x, c.y, `rgba(255,214,102,${0.25 + 0.2 * w})`, 0); }
          ctx.strokeStyle = lava ? `rgba(255,236,150,${0.5 + 0.3 * w})` : `rgba(255,255,255,${0.35 + 0.25 * w})`; ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(c.x - 12, c.y + w * 2); ctx.quadraticCurveTo(c.x - 4, c.y - 4 + w * 2, c.x + 4, c.y + w * 2); ctx.stroke();
        } else if (t === PATH) diamond(c.x, c.y, palette.path[checker]);
        else {
          diamond(c.x, c.y, palette.grass[checker]);
          if (t === TALL) {
            ctx.strokeStyle = palette.tall; ctx.lineWidth = 3; ctx.lineCap = 'round';
            for (let k = 0; k < 6; k++) {
              const bx = c.x + (k - 2.5) * 8, by = c.y + ((k * 7) % 5) * 2 - 4, sw = Math.sin(time * 2.2 + x + y + k) * 3;
              ctx.beginPath(); ctx.moveTo(bx, by + 6); ctx.quadraticCurveTo(bx + sw * 0.4, by - 2, bx + sw, by - 12); ctx.stroke();
            }
          }
        }
        if (t === GROUND && map.flowers[i]) {
          const col = ['#ff6b6b', '#ffd43b', '#fff', '#da77f2'][(x * 3 + y) % 4];
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(c.x - 6, c.y + 1, 3, 0, 6.3); ctx.arc(c.x + 5, c.y - 2, 2.5, 0, 6.3); ctx.fill();
        }
        if (t === TREE) drawables.push({ d: x + y, f: () => drawScenery(ctx, palette, c.x, c.y, x, y, time) });
        if (t === ROCK) drawables.push({ d: x + y, f: () => {
          ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 20, 8, 0, 0, 6.3); ctx.fill();
          ctx.fillStyle = palette.rock; ctx.beginPath(); ctx.ellipse(c.x, c.y - 6, 18, 14, 0, 0, 6.3); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(c.x - 6, c.y - 11, 7, 4, -0.5, 0, 6.3); ctx.fill();
        } });
      }
      if (me.target) {
        const c = iso(me.target.x, me.target.y), p = 0.5 + 0.5 * Math.sin(time * 6);
        ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * p})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(c.x, c.y - 14); ctx.lineTo(c.x + 28, c.y); ctx.lineTo(c.x, c.y + 14); ctx.lineTo(c.x - 28, c.y); ctx.closePath(); ctx.stroke();
      }
      const pc = iso(me.x, me.y), moving = me.t < 1;
      const frame = moving ? (Math.floor(me.t * 2) === 0 ? 1 : 2) : 0;
      const bob = moving ? Math.abs(Math.sin(me.t * Math.PI * 2)) * 3 : Math.sin(time * 3) * 1.2;
      drawables.push({ d: me.x + me.y + 0.01, f: () => {
        const im = imgs[`${me.facing}${frame}`];
        if (!im.complete || !im.naturalWidth) return;
        ctx.save(); ctx.translate(pc.x, pc.y);
        if (me.flip) ctx.scale(-1, 1);
        ctx.drawImage(im, -48, -84 - bob + 6, 96, 96);
        ctx.restore();
      } });
      drawables.sort((a, b) => a.d - b.d).forEach((o) => o.f());

      // drifting leaves / dust
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const m of motes) {
        const px = ((m.x + time * m.vx) % 1) * W, py = ((m.y + time * m.vy) % 1) * H + Math.sin(time * 1.5 + m.ph) * 6;
        ctx.fillStyle = `rgba(255,255,255,${m.a * 0.6})`; ctx.beginPath(); ctx.ellipse(px, py, m.r, m.r * 0.6, m.ph, 0, 6.3); ctx.fill();
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
      update(dt); draw(); raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', blur);
      cv.removeEventListener('pointerdown', onPointer); pad.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId, palette, pad, lookKey]);

  return (
    <div ref={wrap} className="relative h-full w-full touch-none select-none overflow-hidden rounded-2xl">
      <canvas ref={canvas} className="block h-full w-full cursor-pointer" aria-label="Isometric world map. Use arrow keys or WASD to move, or tap a tile." role="application" />
    </div>
  );
}
