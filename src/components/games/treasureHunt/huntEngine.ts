import { FRAME_H, FRAME_W, GROUND_ANCHOR, PROP_ANCHOR, type HuntAssets } from './huntAssets';
import type { Tier } from './huntQuestions';
import type { Cell, WorldMap } from './huntWorld';

/**
 * The isometric view of a treasure-hunt world: movement, collision, camera and drawing.
 * It knows nothing about questions, lives or React - the game component drives it
 * (which chest is active, which are open) and listens to its events.
 *
 * Picture sizes: a ground tile is 256 px wide, its flat top is TW x TH.
 */
export const TW = 256;
export const TH = 174;

const SPEED = 420; // picture pixels per second
const RADIUS = 0.26; // the explorer's size in cells (for collision)

type Dir = 0 | 1 | 2 | 3; // down, left, right, up

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

export interface Ghost {
  id: string;
  name: string;
  character: string;
  /** where the other player is on the map (cells) */
  x: number;
  y: number;
  dir: number;
  moving: boolean;
  /** drawn position (eased towards x, y) */
  dx?: number;
  dy?: number;
  walkT?: number;
}

export interface EngineEvents {
  /** the explorer walked into the active chest */
  onBump?: () => void;
  /** the explorer is close enough to the active chest to open it */
  onNear?: (near: boolean) => void;
}

const proj = (gx: number, gy: number): [number, number] => [((gx - gy) * TW) / 2, ((gx + gy) * TH) / 2];

export class HuntEngine {
  private ctx: CanvasRenderingContext2D;
  private world: WorldMap | null = null;
  private px = 0;
  private py = 0;
  private dir: Dir = 0;
  private walkT = 0;
  private moving = false;
  private camX = 0;
  private camY = 0;
  private keys = new Set<string>();
  private stick = { x: 0, y: 0 };
  private active: number | null = null;
  private tiers: Tier[] = [];
  private opened = new Set<number>();
  private paused = false;
  private hintT = 0;
  private time = 0;
  private particles: Particle[] = [];
  private bumpArmed = true;
  private actionLatch = false;
  private ghosts = new Map<string, Ghost>();
  private near = false;
  private raf = 0;
  private last = 0;
  private cssW = 800;
  private cssH = 500;
  private zoom = 0.5;
  events: EngineEvents = {};
  character = 'pink';

  private canvas: HTMLCanvasElement;
  private assets: HuntAssets;

  constructor(canvas: HTMLCanvasElement, assets: HuntAssets) {
    this.canvas = canvas;
    this.assets = assets;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D canvas');
    this.ctx = ctx;
  }

  // ------------------------------------------------------------------ set up
  start() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }

  resize(cssW: number, cssH: number) {
    this.cssW = Math.max(200, cssW);
    this.cssH = Math.max(200, cssH);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.cssW * dpr);
    this.canvas.height = Math.round(this.cssH * dpr);
    this.zoom = Math.max(0.33, Math.min(0.52, this.cssW / 1600));
  }

  loadWorld(world: WorldMap) {
    this.world = world;
    this.ghosts.clear();
    this.opened = new Set();
    this.active = null;
    this.tiers = [];
    this.px = world.start.gx + 0.5;
    this.py = world.start.gy + 0.5;
    this.dir = 0;
    const [cx, cy] = proj(this.px, this.py);
    this.camX = cx;
    this.camY = cy;
    this.bumpArmed = true;
    this.setNear(false);
  }

  setTiers(tiers: Tier[]) {
    this.tiers = tiers;
  }
  setActiveChest(i: number | null) {
    this.active = i;
    this.bumpArmed = true;
    this.setNear(false);
  }
  markOpened(i: number, quiet = false) {
    this.opened.add(i);
    const w = this.world;
    if (!w || quiet) return;
    const c = w.chests[i];
    const [x, y] = proj(c.gx + 0.5, c.gy + 0.5);
    for (let k = 0; k < 14; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = 160 + Math.random() * 220;
      this.particles.push({ x, y: y - 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 260, life: 0, max: 0.9 + Math.random() * 0.5 });
    }
  }
  /** where the explorer is right now (sent to the other players) */
  getState() {
    return { x: this.px, y: this.py, dir: this.dir as number, moving: this.moving };
  }
  /** other players on this map (names and positions come from the network) */
  setGhost(g: Ghost) {
    const old = this.ghosts.get(g.id);
    this.ghosts.set(g.id, { ...g, dx: old?.dx ?? g.x, dy: old?.dy ?? g.y, walkT: old?.walkT ?? 0 });
  }
  removeGhost(id: string) {
    this.ghosts.delete(id);
  }
  clearGhosts() {
    this.ghosts.clear();
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (p) {
      this.keys.clear();
      this.stick = { x: 0, y: 0 };
    }
  }
  setStick(x: number, y: number) {
    this.stick = { x, y };
  }
  showHint(seconds = 6) {
    this.hintT = seconds;
  }
  /** where the active chest is on the screen relative to the explorer, in picture pixels (for the hint text) */
  activeOffset(): { dx: number; dy: number } | null {
    const w = this.world;
    if (!w || this.active === null) return null;
    const c = w.chests[this.active];
    const [ax, ay] = proj(c.gx + 0.5, c.gy + 0.5);
    const [bx, by] = proj(this.px, this.py);
    return { dx: ax - bx, dy: ay - by };
  }

  // ------------------------------------------------------------------ input
  private onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(k)) {
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
      if (!this.paused) {
        this.keys.add(k);
        if (k === ' ') this.actionLatch = true;
      }
    }
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };
  private onBlur = () => {
    this.keys.clear();
  };

  // ------------------------------------------------------------------ rules of the map
  private cell(x: number, y: number): Cell | null {
    const w = this.world;
    if (!w || x < 0 || y < 0 || x >= w.n || y >= w.n) return null;
    return w.cells[y * w.n + x];
  }

  /** chests are solid while they are on the map (the active one and the ones already opened) */
  private chestAt(x: number, y: number): boolean {
    const w = this.world;
    if (!w) return false;
    return w.chests.some((c, i) => c.gx === x && c.gy === y && (i === this.active || this.opened.has(i)));
  }

  private blocked(px: number, py: number): boolean {
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        const cx = Math.floor(px + sx * RADIUS);
        const cy = Math.floor(py + sy * RADIUS);
        const c = this.cell(cx, cy);
        if (!c || c.water || c.block || this.chestAt(cx, cy)) return true;
      }
    return false;
  }

  private setNear(n: boolean) {
    if (n !== this.near) {
      this.near = n;
      this.events.onNear?.(n);
    }
  }

  /** Opens the active chest if the explorer stands close to it (used by the "Open" button and the space bar). */
  isNearActive(): boolean {
    return this.near;
  }

  // ------------------------------------------------------------------ update
  private update(dt: number) {
    const w = this.world;
    if (!w) return;
    this.time += dt;
    let ix = 0;
    let iy = 0;
    if (!this.paused) {
      const k = this.keys;
      ix = (k.has('arrowright') || k.has('d') ? 1 : 0) - (k.has('arrowleft') || k.has('a') ? 1 : 0);
      iy = (k.has('arrowdown') || k.has('s') ? 1 : 0) - (k.has('arrowup') || k.has('w') ? 1 : 0);
      ix += this.stick.x;
      iy += this.stick.y;
      if ((k.has(' ') || this.actionLatch) && this.near) {
        this.keys.delete(' ');
        this.actionLatch = false;
        this.events.onBump?.();
      }
      this.actionLatch = false;
    }
    const len = Math.hypot(ix, iy);
    this.moving = len > 0.08;
    if (this.moving) {
      const m = Math.min(1, len);
      const ux = (ix / len) * m;
      const uy = (iy / len) * m;
      // a step on the screen (picture pixels) turned into a step on the map grid
      // on a bigger map the explorer walks a little faster, so the long way between chests stays fun
      const speed = SPEED * Math.min(1.4, Math.max(1, w.n / 30));
      const sx = ux * speed * dt;
      const sy = uy * speed * dt;
      const dx = sx / TW + sy / TH;
      const dy = sy / TH - sx / TW;
      if (!this.blocked(this.px + dx, this.py)) this.px += dx;
      if (!this.blocked(this.px, this.py + dy)) this.py += dy;
      this.dir = Math.abs(ix) > Math.abs(iy) ? (ix < 0 ? 1 : 2) : iy < 0 ? 3 : 0;
      this.walkT += dt;
    } else this.walkT = 0;

    const [tx, ty] = proj(this.px, this.py);
    const f = Math.min(1, dt * 6);
    this.camX += (tx - this.camX) * f;
    this.camY += (ty - this.camY) * f;

    // the active chest: walking into it, or standing next to it
    if (this.active !== null) {
      const c = w.chests[this.active];
      const d = Math.hypot(this.px - (c.gx + 0.5), this.py - (c.gy + 0.5));
      this.setNear(d < 1.6);
      if (d < 1.25 && this.bumpArmed && !this.paused) {
        this.bumpArmed = false;
        this.events.onBump?.();
      }
      if (d > 2.2) this.bumpArmed = true;
    } else this.setNear(false);

    for (const g of this.ghosts.values()) {
      const f2 = Math.min(1, dt * 9);
      g.dx = (g.dx ?? g.x) + (g.x - (g.dx ?? g.x)) * f2;
      g.dy = (g.dy ?? g.y) + (g.y - (g.dy ?? g.y)) * f2;
      g.walkT = g.moving ? (g.walkT ?? 0) + dt : 0;
    }
    if (this.hintT > 0) this.hintT -= dt;
    this.particles = this.particles.filter((p) => (p.life += dt) < p.max);
    for (const p of this.particles) {
      p.vy += 700 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  // ------------------------------------------------------------------ drawing
  private img(key: string) {
    return this.assets.img[key];
  }

  private groundKey(w: WorldMap, c: Cell) {
    return `${w.id}/${c.ground}`;
  }

  render() {
    const ctx = this.ctx;
    const dpr = this.canvas.width / this.cssW;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = this.cssW;
    const H = this.cssH;
    const w = this.world;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, w?.sky[0] ?? '#9ddcff');
    sky.addColorStop(1, w?.sky[1] ?? '#e4f7cf');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    if (!w) return;

    const z = this.zoom;
    const ox = W / 2 - this.camX * z;
    const oy = H / 2 - this.camY * z - 20;
    const sx = (gx: number, gy: number) => ox + proj(gx, gy)[0] * z;
    const sy = (gx: number, gy: number) => oy + proj(gx, gy)[1] * z;

    // 1) the ground, back to front
    for (let y = 0; y < w.n; y++)
      for (let x = 0; x < w.n; x++) {
        const cx = sx(x + 0.5, y + 0.5);
        const cy = sy(x + 0.5, y + 0.5);
        if (cx < -TW * z || cx > W + TW * z || cy < -TH * z || cy > H + TH * z * 1.5) continue;
        const key = this.groundKey(w, w.cells[y * w.n + x]);
        const im = this.img(key);
        if (!im) continue;
        const ay = GROUND_ANCHOR[key] ?? 92;
        ctx.drawImage(im, cx - (im.width / 2) * z, cy - ay * z, im.width * z, im.height * z);
      }

    // 2) everything that stands on it, sorted by depth
    interface Item {
      depth: number;
      draw: () => void;
    }
    const items: Item[] = [];
    const prop = (assetKey: string, gx: number, gy: number, scale = 1) => {
      const im = this.img(assetKey);
      if (!im) return;
      const cx = sx(gx + 0.5, gy + 0.5);
      const cy = sy(gx + 0.5, gy + 0.5);
      if (cx < -TW * z * 1.5 || cx > W + TW * z * 1.5 || cy < -TH * z * 2 || cy > H + TH * z * 2) return;
      const foot = PROP_ANCHOR[assetKey] ?? im.height - Math.max(12, Math.min(34, im.width * 0.11));
      const k = z * scale;
      items.push({ depth: gx + gy + 1, draw: () => ctx.drawImage(im, cx - (im.width / 2) * k, cy - foot * k, im.width * k, im.height * k) });
    };
    for (let y = 0; y < w.n; y++)
      for (let x = 0; x < w.n; x++) {
        const c = w.cells[y * w.n + x];
        if (c.prop) prop(`${w.id}/${c.prop}`, x, y);
      }
    // chests
    const CHEST = 0.55;
    w.chests.forEach((c, i) => {
      const isOpen = this.opened.has(i);
      if (!isOpen && i !== this.active) return;
      const tier = this.tiers[i] ?? 'bronze';
      prop(`ui/${isOpen ? 'open' : 'chest'}-${tier}`, c.gx, c.gy, CHEST);
      if (!isOpen) {
        const cx = sx(c.gx + 0.5, c.gy + 0.5);
        const cy = sy(c.gx + 0.5, c.gy + 0.5);
        items.push({
          depth: c.gx + c.gy + 1.2,
          draw: () => {
            const d = Math.hypot(this.px - (c.gx + 0.5), this.py - (c.gy + 0.5));
            if (d > 6.5) return;
            const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
            const star = this.img('ui/star');
            ctx.save();
            ctx.globalAlpha = 0.55 + 0.4 * pulse;
            ctx.fillStyle = '#ffe27a';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 8 * z * 2, (26 + 6 * pulse) * z * 2, (10 + 3 * pulse) * z * 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            if (star) {
              const s = 0.16 * z * 2;
              const bob = Math.sin(this.time * 3) * 5;
              ctx.drawImage(star, cx - (star.width * s) / 2, cy - 110 * z * 1.2 + bob, star.width * s, star.height * s);
            }
          },
        });
      }
    });
    // the other players
    for (const g of this.ghosts.values()) {
      const gsheet = this.img(`chars/${g.character}`);
      const gx = g.dx ?? g.x;
      const gy = g.dy ?? g.y;
      const gcx = sx(gx, gy);
      const gcy = sy(gx, gy);
      if (gcx < -200 || gcx > W + 200 || gcy < -200 || gcy > H + 300) continue;
      const gframe = g.moving ? [0, 1, 0, 2][Math.floor((g.walkT ?? 0) * 8) % 4] : 0;
      const gk = z * 1.5;
      items.push({
        depth: gx + gy,
        draw: () => {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.ellipse(gcx, gcy, 30 * gk * 0.5, 10 * gk * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.88;
          if (gsheet) ctx.drawImage(gsheet, gframe * FRAME_W, g.dir * FRAME_H, FRAME_W, FRAME_H, gcx - (FRAME_W / 2) * gk, gcy - (FRAME_H - 6) * gk, FRAME_W * gk, FRAME_H * gk);
          ctx.globalAlpha = 1;
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#2B2B6B';
          ctx.fillStyle = '#fff';
          const ty = gcy - (FRAME_H - 2) * gk;
          ctx.strokeText(g.name, gcx, ty);
          ctx.fillText(g.name, gcx, ty);
          ctx.restore();
        },
      });
    }
    // the explorer
    {
      const sheet = this.img(`chars/${this.character}`);
      const cx = sx(this.px, this.py);
      const cy = sy(this.px, this.py);
      const frame = this.moving ? [0, 1, 0, 2][Math.floor(this.walkT * 8) % 4] : 0;
      const k = z * 1.5;
      items.push({
        depth: this.px + this.py,
        draw: () => {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.ellipse(cx, cy, 30 * k * 0.5, 10 * k * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (sheet) ctx.drawImage(sheet, frame * FRAME_W, this.dir * FRAME_H, FRAME_W, FRAME_H, cx - (FRAME_W / 2) * k, cy - (FRAME_H - 6) * k, FRAME_W * k, FRAME_H * k);
          else {
            ctx.fillStyle = '#ffcc33';
            ctx.fillRect(cx - 12, cy - 40, 24, 40);
          }
        },
      });
    }
    items.sort((a, b) => a.depth - b.depth);
    for (const it of items) it.draw();

    // 3) coin burst
    const coin = this.img('ui/coin');
    if (coin)
      for (const p of this.particles) {
        const s = 0.22 * z * 2 * (1 - p.life / p.max * 0.4);
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
        ctx.drawImage(coin, ox + p.x * z - (coin.width * s) / 2, oy + p.y * z - (coin.height * s) / 2, coin.width * s, coin.height * s);
        ctx.globalAlpha = 1;
      }

    // 4) hint arrow: points from the explorer towards the active chest
    if (this.hintT > 0) {
      const off = this.activeOffset();
      if (off) {
        const ang = Math.atan2(off.dy, off.dx);
        const cx = sx(this.px, this.py);
        const cy = sy(this.px, this.py) - 60 * z * 1.5;
        const r = 70 + Math.sin(this.time * 8) * 6;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r * 0.8;
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.hintT);
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.fillStyle = '#ffd23f';
        ctx.strokeStyle = '#2b2b6b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-12, -16);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-12, 16);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.restore();
      }
    }
  }
}
