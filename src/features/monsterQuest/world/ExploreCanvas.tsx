import { useEffect, useRef, type MutableRefObject } from 'react';
import type { ZonePalette } from '../types';
import { trainerDataUrl, type Facing } from '../art/Trainer';
import { findPath, generateMap, GROUND, PATH, ROCK, TALL, TREE, WATER, walkable, type GameMap, type Tile } from './map';

export type DPad = 'up' | 'down' | 'left' | 'right';
const TW = 64, TH = 32, STEP_S = 0.2;
const KEYMAP: Record<string, DPad> = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };

interface Props {
  zoneId: string; palette: ZonePalette; paused: boolean;
  pad: MutableRefObject<Set<DPad>>;
  onStep: (tile: Tile) => void;
}
interface Mote { x: number; y: number; vx: number; vy: number; r: number; a: number; ph: number }

const iso = (gx: number, gy: number) => ({ x: (gx - gy) * (TW / 2), y: (gx + gy) * (TH / 2) });

export function ExploreCanvas({ zoneId, palette, paused, pad, onStep }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const stepRef = useRef(onStep); stepRef.current = onStep;

  useEffect(() => {
    const cv = canvas.current!, host = wrap.current!, ctx = cv.getContext('2d')!;
    const map: GameMap = generateMap(zoneId);
    const S = map.size;
    const me = { x: map.spawn.x, y: map.spawn.y, fx: map.spawn.x, fy: map.spawn.y, tx: map.spawn.x, ty: map.spawn.y, t: 1, facing: 'down' as Facing, flip: false, queue: [] as { x: number; y: number }[], target: null as { x: number; y: number } | null };
    const cam = { x: 0, y: 0 };
    let W = 0, H = 0, dpr = 1, scale = 1;

    const imgs: Record<string, HTMLImageElement> = {};
    for (const f of ['down', 'up', 'side'] as Facing[]) for (const s of [0, 1, 2] as const) {
      const im = new Image(); im.src = trainerDataUrl({ facing: f, step: s }, 96); imgs[`${f}${s}`] = im;
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
          diamond(c.x, c.y, palette.water);
          const w = Math.sin(time * 2 + x * 0.9 + y * 0.7);
          ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.25 * w})`; ctx.lineWidth = 2; ctx.beginPath();
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
        if (t === TREE) drawables.push({ d: x + y, f: () => {
          const sw = Math.sin(time * 1.5 + x * 1.3 + y) * 2.5;
          ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 22, 9, 0, 0, 6.3); ctx.fill();
          ctx.fillStyle = palette.trunk; ctx.fillRect(c.x - 5, c.y - 22, 10, 26);
          ctx.fillStyle = palette.tree;
          for (const [ox, oy, r] of [[0, -50, 22], [-14, -34, 18], [14, -34, 18], [0, -34, 22]] as const) { ctx.beginPath(); ctx.arc(c.x + ox + sw * (oy / -50), c.y + oy, r, 0, 6.3); ctx.fill(); }
          ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.arc(c.x - 7 + sw, c.y - 56, 9, 0, 6.3); ctx.fill();
        } });
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
  }, [zoneId, palette, pad]);

  return (
    <div ref={wrap} className="relative h-full w-full touch-none select-none overflow-hidden rounded-2xl">
      <canvas ref={canvas} className="block h-full w-full cursor-pointer" aria-label="Isometric world map. Use arrow keys or WASD to move, or tap a tile." role="application" />
    </div>
  );
}
