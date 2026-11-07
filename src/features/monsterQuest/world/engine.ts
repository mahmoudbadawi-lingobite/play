/** The free-roam world: input, movement, camera, rendering, interactions, encounters and location transitions. */
import { bakeLocation, PLAYER_R, type Baked } from './paintLocation';
import { drawMarker, glow, npcSprite, propSprite, shadowEll } from './paintProps';
import { SHEET, characterById, frameRect, headBox, sheetUrl, type Character } from './characters';
import { placeProp, propUrl, type PropDef } from './props';
import { loadStory } from './storybook/story';
import { LOCATIONS } from './locations';
import type { Facing, InteractDef, LocationDef, Pt } from './types';
import { pointInPoly, rng } from './util';
import type { Progress } from './progress';

export const SPEED = 160;            // px/s; a 2000 px location is crossed in about 12.5 s
const ACCEL_T = 0.1, STOP_T = 0.08;  // seconds to full speed / to stop
const DEAD_ZONE = 0.15;
const ENCOUNTER_RATE = 0.2;          // chance per second of motion on encounter ground
const RARE_RATE = 0.4;
const SHALLOW = 0.7;
const CAM_LAG = 0.1;
const PLAYER_K = 0.5;                // sheet frames are 256x256 with the feet on line 248 and a figure about 226px tall; drawn at half size
const WALK_STRIDE = 11;              // world pixels walked per walk frame (6 frames = one full stride)
const KEY: Record<string, 'u' | 'd' | 'l' | 'r'> = { ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };

export interface Dialog { name: string; lines: string[]; icon?: 'npc' | 'sign' | 'chest' | 'lore' | 'stone' }
export interface HudInfo { loc: LocationDef | null; zoneLabel: string | null; prompt: { name: string; kind: string } | null; canBattle: boolean; flags: string[] }
export interface EngineCallbacks {
  onHud: (h: HudInfo) => void;
  onDialog: (d: Dialog | null) => void;
  onShop: () => void;
  onExitWorld: () => void;
  onToast: (msg: string) => void;
  /** returns when the encounter UI is done starting; throw to show an error toast */
  onEncounter: (serverZone: string, zoneId: string, rare: boolean) => Promise<void>;
  onProgress: (p: Progress) => void;
  onLoading?: (on: boolean) => void;
}
export interface EngineOptions {
  canvas: HTMLCanvasElement; host: HTMLElement; mini: HTMLCanvasElement | null; character: string; /** wardrobe props worn by the explorer */ props?: PropDef[];
  progress: Progress; reduced: boolean; cb: EngineCallbacks;
}

interface Entity { y: number; draw: () => void }

export class WorldEngine {
  private cv: HTMLCanvasElement; private c: CanvasRenderingContext2D; private o: EngineOptions;
  private sheet: HTMLImageElement | null = null;
  private who: Character;
  private propDefs: PropDef[] = []; private propImgs = new Map<string, HTMLImageElement>();
  private loc: Baked | null = null;
  private raf = 0; private last = 0; private time = 0;
  private W = 0; private H = 0; private dpr = 1; private scale = 1;
  // player
  private p = { x: 0, y: 0, vx: 0, vy: 0, facing: 'down' as Facing, flip: false, dist: 0, moving: false };
  private cam = { x: 0, y: 0 }; private view = { x: 0, y: 0 };
  private keys = new Set<string>(); private joy: Pt = [0, 0];
  private route: Pt[] | null = null; private tapMark: { x: number; y: number; t: number } | null = null;
  // state
  private paused = false; private busy = false; private fade = 1; private fadeDir = -1; private pending: (() => void) | null = null;
  private gateLock = true; private encCool = 0; private bang = 0; private zoneIdx = -1;
  private flags: Set<string>; private plates = new Set<string>(); private opened = new Set<string>();
  private near: InteractDef | null = null; private lastHud = ''; private miniT = 0;
  private ents: Entity[] = []; private particles: { x: number; y: number; v: number; ph: number; r: number }[] = [];
  private ripples: { x: number; y: number; t: number }[] = [];
  private stuckT = 0; private reduced: boolean; private destroyed = false; private shake = 0;
  private visited: Set<string>;
  private ro: ResizeObserver;
  private handlers: [EventTarget, string, EventListener][] = [];

  constructor(o: EngineOptions) {
    this.o = o; this.cv = o.canvas; this.c = o.canvas.getContext('2d')!; this.reduced = o.reduced;
    this.who = characterById(o.character);
    this.flags = new Set(o.progress.flags); this.visited = new Set(o.progress.visited); this.opened = new Set(o.progress.chests);
    this.loadFrames(); this.setProps(o.props ?? []);
    for (let i = 0; i < 46; i++) { const r = rng(i + 7); this.particles.push({ x: r(), y: r(), v: 0.02 + r() * 0.05, ph: r() * 6.28, r: 1.5 + r() * 2.5 }); }
    this.resize(); this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(o.host);
    const on = (t: EventTarget, e: string, f: (ev: any) => void) => { t.addEventListener(e, f as EventListener); this.handlers.push([t, e, f as EventListener]); };
    on(window, 'keydown', (e: KeyboardEvent) => this.keyDown(e)); on(window, 'keyup', (e: KeyboardEvent) => { const d = KEY[e.key]; if (d) this.keys.delete(d); });
    on(window, 'blur', () => { this.keys.clear(); this.joy = [0, 0]; });
    on(this.cv, 'pointerdown', (e: PointerEvent) => this.tap(e));
    this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  // ------------------------------------------------------------------ public api
  setJoystick(x: number, y: number) { this.joy = [x, y]; if (x || y) this.route = null; }
  setPaused(p: boolean) { this.paused = p; if (p) { this.keys.clear(); this.joy = [0, 0]; } }
  setReduced(r: boolean) { this.reduced = r; }
  setCharacter(id: string) { this.who = characterById(id); this.o.character = id; this.loadFrames(); }
  /** Wardrobe props worn by the explorer. */
  setProps(defs: PropDef[]) {
    this.propDefs = defs;
    for (const p of defs) if (!this.propImgs.has(p.id)) { const im = new Image(); im.src = propUrl(p); this.propImgs.set(p.id, im); }
  }
  private loadFrames() { const im = new Image(); im.src = sheetUrl(this.who.id); this.sheet = im; }
  get location() { return this.loc?.def ?? null; }
  get position(): Pt { return [this.p.x, this.p.y]; }
  get field() { return this.loc?.field ?? null; }
  /** test hook: teleport (used by the automated checks) */
  debugTeleport(x: number, y: number) { this.p.x = x; this.p.y = y; this.p.vx = this.p.vy = 0; this.cam.x = x; this.cam.y = y; }
  debugState() { return { x: this.p.x, y: this.p.y, loc: this.loc?.def.id, fade: this.fade, zone: this.zoneIdx, busy: this.busy }; }
  debugBaked() { return this.loc; }

  async load(id: string, entrance: string) {
    this.o.cb.onLoading?.(true);
    if (LOCATIONS[id]?.style === 'storybook') await loadStory();   // the painted sprites must be loaded before the place is drawn
    this.pending = () => this.swap(id, entrance);
    this.fadeDir = 1;
  }
  private swap(id: string, entrance: string) {
    const def = LOCATIONS[id]; if (!def) return;
    this.loc = bakeLocation(def);
    const e = def.entrances[entrance] ?? Object.values(def.entrances)[0];
    this.p.x = e.x; this.p.y = e.y; this.p.vx = this.p.vy = 0; this.p.facing = e.facing; this.p.flip = !!e.flip; this.cam.x = e.x; this.cam.y = e.y;
    this.route = null; this.gateLock = true; this.zoneIdx = -1; this.near = null; this.ripples = [];
    this.plates = new Set([...this.flags].filter((f) => f.startsWith('plate:')).map((f) => f.slice(6)));
    if (!this.visited.has(id)) { this.visited.add(id); } this.setFlag(`visit:${id}`);
    this.o.cb.onLoading?.(false); this.fadeDir = -1; this.hud(true);
  }
  destroy() {
    this.destroyed = true; cancelAnimationFrame(this.raf); this.ro.disconnect();
    for (const [t, e, f] of this.handlers) t.removeEventListener(e, f);
  }
  interact() {
    if (this.paused || this.busy || !this.loc) return;
    const it = this.near; if (!it) return;
    const cb = this.o.cb;
    switch (it.kind) {
      case 'shop': cb.onShop(); break;
      case 'sign': cb.onDialog({ name: it.name ?? 'Signpost', lines: [`This way: ${it.name}`], icon: 'sign' }); break;
      case 'npc': cb.onDialog({ name: it.name ?? 'Villager', lines: it.lines ?? ['Hello!'], icon: 'npc' }); this.setFlag(`talk:${it.id}`); break;
      case 'mystery': case 'lore': case 'lookout': cb.onDialog({ name: it.name ?? 'Mystery', lines: it.lines ?? ['…'], icon: 'lore' }); this.setFlag(`mystery:${it.id}`); break;
      case 'chest': {
        if (it.link === 'plates' && !(this.plates.has('plateA') && this.plates.has('plateB'))) { cb.onDialog({ name: 'Sealed chest', lines: ['The lid will not budge. Two glowing tiles in the ruined halls look like they belong to it.'], icon: 'chest' }); break; }
        const first = !this.opened.has(it.id); this.opened.add(it.id); this.o.progress.chests = [...this.opened]; cb.onProgress(this.o.progress); this.setFlag(`chest:${it.id}`);
        cb.onDialog({ name: 'Treasure chest', lines: first ? ['The chest creaks open and glitters. Its rewards will arrive when chest rewards are switched on for this world.'] : ['Already opened. Chests refill daily once rewards are switched on.'], icon: 'chest' });
        break;
      }
      case 'stone': cb.onDialog({ name: 'Fast-travel stone', lines: ['Runes glow under your hand. Villages you have visited are saved here.', `Villages found: ${[...this.visited].filter((v) => LOCATIONS[v]?.kind === 'village').map((v) => LOCATIONS[v].name).join(', ') || 'none yet'}.`], icon: 'stone' }); break;
      default: break;
    }
  }
  /** Battle / Search button: start an encounter if standing on encounter ground. */
  search() { if (this.zoneIdx >= 0) void this.startEncounter(); }
  private setFlag(f: string) { if (this.flags.has(f)) return; this.flags.add(f); this.o.progress.flags = [...this.flags]; this.o.progress.visited = [...this.visited]; this.o.cb.onProgress(this.o.progress); this.hud(true); }
  drawFullMap(cv: HTMLCanvasElement) {
    const b = this.loc; if (!b) return; const c = cv.getContext('2d')!; const k = Math.min(cv.width / b.mini.width, cv.height / b.mini.height);
    c.clearRect(0, 0, cv.width, cv.height); const w = b.mini.width * k, h = b.mini.height * k, ox = (cv.width - w) / 2, oy = (cv.height - h) / 2;
    c.drawImage(b.mini, ox, oy, w, h);
    const px = ox + this.p.x * b.miniScale * k, py = oy + this.p.y * b.miniScale * k;
    c.fillStyle = '#fff'; c.strokeStyle = '#e8742a'; c.lineWidth = 4; c.beginPath(); c.arc(px, py, 8, 0, 6.3); c.fill(); c.stroke();
    c.font = '800 14px Nunito, system-ui, sans-serif'; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 4; c.textAlign = 'center';
    c.strokeText('You', px, py - 14); c.fillText('You', px, py - 14);
  }

  // ------------------------------------------------------------------ input
  private keyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const d = KEY[e.key];
    if (d) { if (this.paused) return; e.preventDefault(); this.keys.add(d); this.route = null; return; }
    if (e.repeat) return;
    if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') { if (this.near && !this.paused) { e.preventDefault(); this.interact(); } }
    else if (e.key === 'f' || e.key === 'F') this.search();
  }
  private tap(e: PointerEvent) {
    if (this.paused || this.busy || !this.loc) return;
    const r = this.cv.getBoundingClientRect(), wx = (e.clientX - r.left - this.W / 2) / this.scale + this.view.x, wy = (e.clientY - r.top - this.H / 2) / this.scale + this.view.y;
    // tapping an interactable walks next to it and uses it
    const path = this.loc.field.findPath([this.p.x, this.p.y], [wx, wy], PLAYER_R);
    if (path && path.length) { this.route = path; this.tapMark = { x: path[path.length - 1][0], y: path[path.length - 1][1], t: 0 }; }
  }

  // ------------------------------------------------------------------ loop
  private resize() {
    const r = this.o.host.getBoundingClientRect(); this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = Math.max(200, r.width); this.H = Math.max(200, r.height);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr); this.cv.style.width = `${this.W}px`; this.cv.style.height = `${this.H}px`;
    this.scale = Math.max(0.6, Math.min(1.3, this.W / 1000));
  }
  private frame(now: number) {
    if (this.destroyed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.time += dt;
    if (++this.chk % 90 === 0 && this.bgLost()) this.rebake();
    this.update(dt); this.render(); this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  private chk = 0;
  private peekImgs = new Map<string, HTMLImageElement>();
  private drawPeek(c: CanvasRenderingContext2D, pk: { x: number; y: number; id: string; ph: number }, t: number) {
    let im = this.peekImgs.get(pk.id);
    if (!im) { im = new Image(); im.src = `${import.meta.env.BASE_URL}monster-quest/sprites/${pk.id}.png`; this.peekImgs.set(pk.id, im); }
    if (!im.complete || !im.naturalWidth) return;
    const cyc = (t + pk.ph) % 9, vis = cyc < 2.6 ? Math.sin((cyc / 2.6) * Math.PI) : 0; if (vis <= 0.02) return;
    c.save(); c.globalAlpha = Math.min(1, vis * 1.6); c.translate(pk.x, pk.y + 14 - vis * 30); c.rotate(Math.sin(t * 5 + pk.ph) * 0.03); c.drawImage(im, -29, -58, 58, 58); c.restore();
  }
  /** Phones can throw away big canvases when memory is short (ground and props then draw blank). Detect that and paint the place again. */
  private bgLost(): boolean {
    const b = this.loc; if (!b) return false;
    try {
      const g = b.bg.getContext('2d'); if (!g) return true;
      for (const [fx, fy] of [[0.5, 0.5], [0.25, 0.7], [0.75, 0.3], [0.5, 0.9]]) if (g.getImageData(Math.floor(b.def.w * fx), Math.floor(b.def.h * fy), 1, 1).data[3] > 0) return false;
      return true;
    } catch { return false; }
  }
  private rebake() { const id = this.loc?.def.id, def = id ? LOCATIONS[id] : null; if (def) this.loc = bakeLocation(def); }

  private update(dt: number) {
    // fades and location swaps
    if (this.fadeDir) {
      this.fade = Math.max(0, Math.min(1, this.fade + this.fadeDir * dt / 0.28));
      if (this.fadeDir > 0 && this.fade >= 1 && this.pending) { const f = this.pending; this.pending = null; f(); }
      else if (this.fadeDir < 0 && this.fade <= 0) this.fadeDir = 0;
    }
    const b = this.loc; if (!b) return;
    const p = this.p, field = b.field;
    this.encCool = Math.max(0, this.encCool - dt); this.bang = Math.max(0, this.bang - dt); this.shake = Math.max(0, this.shake - dt);
    const locked = this.paused || this.busy || this.fadeDir > 0 || this.bang > 0;

    // desired direction: keyboard, joystick (analog, dead zone) or tapped route
    let ix = (this.keys.has('r') ? 1 : 0) - (this.keys.has('l') ? 1 : 0), iy = (this.keys.has('d') ? 1 : 0) - (this.keys.has('u') ? 1 : 0), mag = 0;
    if (ix || iy) { const l = Math.hypot(ix, iy); ix /= l; iy /= l; mag = 1; }
    else { const jm = Math.hypot(this.joy[0], this.joy[1]); if (jm > DEAD_ZONE) { mag = Math.min(1, (jm - DEAD_ZONE) / (1 - DEAD_ZONE)); ix = this.joy[0] / jm; iy = this.joy[1] / jm; } }
    if (!mag && this.route && !locked) {
      const [tx, ty] = this.route[0], dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d < 10 && this.route.length > 1) this.route.shift(); else if (d < 8) { this.route = null; this.tapMark = null; } else { ix = dx / d; iy = dy / d; mag = Math.min(1, d / 30 + 0.2); }
    }
    if (locked) mag = 0;
    const slow = field.isSlow(p.x, p.y) ? SHALLOW : 1, tvx = ix * SPEED * mag * slow, tvy = iy * SPEED * mag * slow;
    // acceleration: full speed in ACCEL_T, stop in STOP_T (no sliding)
    const dvx = tvx - p.vx, dvy = tvy - p.vy, dl = Math.hypot(dvx, dvy), tm = Math.hypot(tvx, tvy), cm = Math.hypot(p.vx, p.vy);
    const step = ((tm >= cm ? SPEED / ACCEL_T : SPEED / STOP_T) * dt);
    if (dl <= step) { p.vx = tvx; p.vy = tvy; } else { p.vx += (dvx / dl) * step; p.vy += (dvy / dl) * step; }
    // move, then push out of solids along the distance-field gradient (slides along walls, rounds corners)
    const ox = p.x, oy = p.y; let nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    [nx, ny] = field.resolve(nx, ny, PLAYER_R);
    if (field.sdf(nx, ny) < PLAYER_R - 1) { nx = ox; ny = oy; }
    p.x = nx; p.y = ny;
    const rvx = (p.x - ox) / (dt || 1), rvy = (p.y - oy) / (dt || 1), sp = Math.hypot(rvx, rvy);
    p.vx = rvx; p.vy = rvy; p.moving = sp > 14;
    if (p.moving) {
      p.dist += sp * dt;
      if (Math.abs(rvy) > Math.abs(rvx) * 0.9) { p.facing = rvy < 0 ? 'up' : 'down'; p.flip = false; } else { p.facing = 'side'; p.flip = rvx < 0; }
      if (field.isSlow(p.x, p.y) && Math.random() < dt * 5) this.ripples.push({ x: p.x, y: p.y + 4, t: 0 });
    }
    if (this.route && mag > 0 && !ix_key(this)) { this.stuckT = sp < 12 ? this.stuckT + dt : 0; if (this.stuckT > 0.6) { this.route = null; this.tapMark = null; this.stuckT = 0; } } else this.stuckT = 0;
    if (this.tapMark) this.tapMark.t += dt;
    this.ripples = this.ripples.filter((r) => (r.t += dt) < 0.9);

    // camera with a short smooth lag, clamped to the location
    const k = 1 - Math.exp(-dt / CAM_LAG); this.cam.x += (p.x - this.cam.x) * k; this.cam.y += (p.y - this.cam.y) * k;

    const def = b.def;
    // gateways
    let inGate = false;
    for (const g of def.gates) {
      const [gx, gy, gw, gh] = g.rect; if (p.x < gx || p.x > gx + gw || p.y < gy || p.y > gy + gh) continue;
      inGate = true; if (this.gateLock || locked) continue;
      this.setFlag(`touch:${def.id}:${g.id}`);
      if ('loc' in g.to) { this.gateLock = true; void this.load(g.to.loc, g.to.entrance); }
      else if (g.to.exit === 'world') { this.gateLock = true; this.fadeDir = 1; this.pending = () => { this.o.cb.onExitWorld(); }; }
      else { this.gateLock = true; this.o.cb.onToast(g.to.message ?? 'This way is closed for now.'); const back = { left: [140, 0], right: [-140, 0], up: [0, 160], down: [0, -160] }[g.dir]; p.x += back[0]; p.y += back[1]; p.vx = p.vy = 0; }
    }
    if (!inGate) this.gateLock = false;

    // pressure plates
    for (const it of def.interactables) if (it.kind === 'plate' && !this.plates.has(it.id) && Math.hypot(it.x - p.x, it.y - p.y) < 40) { this.plates.add(it.id); this.setFlag(`plate:${it.id}`); this.o.cb.onToast(this.plates.size >= 2 ? 'Both tiles glow. A sealed chest clicks open nearby!' : 'The tile lights up. Find its twin!'); }

    // nearest interactable in front of the player
    const fx = p.facing === 'up' ? [0, -22] : p.facing === 'down' ? [0, 22] : [p.flip ? -22 : 22, 0];
    let best: InteractDef | null = null, bd = 1e9;
    for (const it of def.interactables) { if (it.kind === 'plate') continue; const d = Math.hypot(it.x - (p.x + fx[0]), it.y - (p.y + fx[1])); if (d < (it.range ?? 92) && d < bd) { bd = d; best = it; } }
    this.near = locked ? null : best;

    // encounter ground
    let zi = -1; for (let i = 0; i < b.zonePolys.length; i++) if (pointInPoly(p.x, p.y, b.zonePolys[i])) { zi = i; break; }
    this.zoneIdx = zi;
    if (zi >= 0 && p.moving && !locked && this.encCool <= 0 && !this.busy) {
      const rate = def.zones[zi].rare ? RARE_RATE : ENCOUNTER_RATE;
      if (Math.random() < 1 - Math.pow(1 - rate, dt)) void this.startEncounter();
    }
    this.miniT -= dt; if (this.miniT <= 0) { this.miniT = 0.1; this.drawMini(); }
    this.hud(false);
  }

  private async startEncounter() {
    const b = this.loc; if (!b || this.busy || this.zoneIdx < 0) return;
    const z = b.def.zones[this.zoneIdx]; this.busy = true; this.bang = 0.55; this.shake = 0.3; this.p.vx = this.p.vy = 0; this.route = null; this.encCool = 1.6;
    await new Promise((r) => setTimeout(r, 520));
    try { await this.o.cb.onEncounter(b.def.serverZone, z.id, !!z.rare); }
    catch (err) { this.o.cb.onToast((err as Error).message); this.encCool = 2; }
    finally { this.busy = false; }
  }

  private hud(force: boolean) {
    const b = this.loc, z = b && this.zoneIdx >= 0 ? b.def.zones[this.zoneIdx] : null;
    const info: HudInfo = { loc: b?.def ?? null, zoneLabel: z ? z.label : null, prompt: this.near ? { name: this.near.name ?? '', kind: this.near.kind } : null, canBattle: !!z && !this.busy, flags: [...this.flags] };
    const sig = `${b?.def.id}|${z?.id}|${this.near?.id}|${info.canBattle}|${info.flags.length}`;
    if (force || sig !== this.lastHud) { this.lastHud = sig; this.o.cb.onHud(info); }
  }

  // ------------------------------------------------------------------ render
  private drawMini() {
    const cv = this.o.mini, b = this.loc; if (!cv || !b) return; const c = cv.getContext('2d')!, D = cv.width, k = 0.15, src = D / k * b.miniScale;
    c.save(); c.clearRect(0, 0, D, D); c.beginPath(); c.arc(D / 2, D / 2, D / 2 - 2, 0, 6.3); c.clip(); c.fillStyle = '#2a1c24'; c.fillRect(0, 0, D, D);
    c.drawImage(b.mini, this.p.x * b.miniScale - src / 2, this.p.y * b.miniScale - src / 2, src, src, 0, 0, D, D);
    c.restore();
    c.fillStyle = '#fff'; c.strokeStyle = '#e8742a'; c.lineWidth = 3; c.beginPath(); c.arc(D / 2, D / 2, 6, 0, 6.3); c.fill(); c.stroke();
  }

  private render() {
    const c = this.c, b = this.loc, W = this.W, H = this.H, sc = this.scale, t = this.time;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#1a1018'; c.fillRect(0, 0, this.cv.width, this.cv.height);
    if (!b) return;
    const def = b.def, halfW = W / sc / 2, halfH = H / sc / 2;
    const cx = Math.max(Math.min(halfW, def.w / 2), Math.min(def.w - Math.min(halfW, def.w / 2), this.cam.x)), cy = Math.max(Math.min(halfH, def.h / 2), Math.min(def.h - Math.min(halfH, def.h / 2), this.cam.y));
    this.view.x = cx; this.view.y = cy;
    const sx = this.shake > 0 ? (Math.random() - 0.5) * 6 * (this.shake / 0.3) : 0;
    const L = cx - halfW, T = cy - halfH, R = cx + halfW, B = cy + halfH;
    c.setTransform(this.dpr * sc, 0, 0, this.dpr * sc, this.dpr * (-L * sc + sx), this.dpr * -T * sc);
    c.imageSmoothingEnabled = true;
    c.drawImage(b.bg, 0, 0);

    // ---- flat dynamic ground effects
    const calm = this.reduced;
    if (!calm) {
      for (const s of b.sparkles) {
        if (s.x < L - 20 || s.x > R + 20 || s.y < T - 20 || s.y > B + 20) continue;
        const a = 0.5 + 0.5 * Math.sin(t * 2.2 + s.ph); if (a < 0.45) continue;
        if (s.kind === 'water') { c.strokeStyle = `rgba(255,255,255,${a * 0.85})`; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x - s.r, s.y); c.lineTo(s.x + s.r, s.y); c.moveTo(s.x, s.y - s.r); c.lineTo(s.x, s.y + s.r); c.stroke(); }
        else { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, s.x, s.y - ((t * 8 + s.ph * 9) % 14), s.r * 2.4, '#ffd46a', a * 0.5); c.restore(); }
      }
    }
    // rare spots + plates + gateways pulse
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const z of def.zones) if (z.rare) { const [zx, zy] = z.poly.reduce((a, q) => [a[0] + q[0] / z.poly.length, a[1] + q[1] / z.poly.length], [0, 0]); glow(c, zx, zy, 70 + (calm ? 0 : Math.sin(t * 2.4) * 10), '#fff0a0', 0.5); }
    for (const it of def.interactables) if (it.kind === 'plate') { const on = this.plates.has(it.id); glow(c, it.x, it.y, on ? 60 : 34 + (calm ? 0 : Math.sin(t * 3) * 5), on ? '#7fe9ff' : '#ffb347', on ? 0.8 : 0.45); }
    for (const g of def.gates) if (g.style === 'portal' || g.style === 'door') glow(c, g.rect[0] + g.rect[2] / 2, g.rect[1] + g.rect[3] / 2, 120 + (calm ? 0 : Math.sin(t * 2) * 14), '#ffe9a0', 0.4);
    c.restore();
    for (const it of def.interactables) if (it.kind === 'plate') { c.fillStyle = 'rgba(40,24,30,.5)'; c.beginPath(); c.ellipse(it.x, it.y, 30, 18, 0, 0, 6.3); c.fill(); c.fillStyle = this.plates.has(it.id) ? '#7fe9ff' : '#ffb347'; c.strokeStyle = '#4a3a3a'; c.lineWidth = 3; c.beginPath(); c.ellipse(it.x, it.y - 2, 26, 15, 0, 0, 6.3); c.fill(); c.stroke(); }
    for (const rp of this.ripples) { c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - rp.t / 0.9)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(rp.x, rp.y, 10 + rp.t * 34, 5 + rp.t * 15, 0, 0, 6.3); c.stroke(); }
    if (this.tapMark) { const a = 0.5 + 0.4 * Math.sin(this.tapMark.t * 7); c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 3; c.beginPath(); c.ellipse(this.tapMark.x, this.tapMark.y, 24, 13, 0, 0, 6.3); c.stroke(); }

    // ---- encounter tufts (sway; bend away from the player)
    const tuftOf = (tf: (typeof b.tufts)[number]) => b.tuftSprites[def.zones[tf.zone].ground][tf.k];
    const p = this.p;
    const drawTuft = (tf: (typeof b.tufts)[number]) => {
      const img = tuftOf(tf), near = Math.hypot(tf.x - this.p.x, tf.y - this.p.y), push = near < 50 ? (1 - near / 50) * Math.sign(tf.x - this.p.x || 1) * 0.5 : 0;
      const rustle = p.moving && near < 120 ? Math.sin(t * 14 + tf.ph) * 0.16 * (1 - near / 120) : 0;
      const sway = calm ? 0 : Math.sin(t * 2 + tf.ph) * 0.12 + push + rustle;
      c.save(); c.translate(tf.x, tf.y); c.transform(1, 0, sway, 1, 0, 0); c.drawImage(img, -img.width / 2, -img.height + 4); c.restore();
    };
    // monsters peeking out of the tall grass now and then when you are near (the grass drawn after them hides their lower half)
    if (!calm) for (const pk of b.peeks) { const near = Math.hypot(pk.x - p.x, pk.y - p.y); if (near < 460 && pk.x > L - 60 && pk.x < R + 60 && pk.y > T - 80 && pk.y < B + 120) this.drawPeek(c, pk, t); }
    let lo = 0, hi = b.tufts.length; while (lo < hi) { const m = (lo + hi) >> 1; if (b.tufts[m].y < T - 20) lo = m + 1; else hi = m; }
    const tufStart = lo; for (let i = tufStart; i < b.tufts.length && b.tufts[i].y < B + 60; i++) { const tf = b.tufts[i]; if (tf.x > L - 30 && tf.x < R + 30) drawTuft(tf); }

    // ---- entities, sorted by their ground contact point
    const ents = this.ents; ents.length = 0;
    for (const pp of b.props) {
      if (pp.overhead) continue; const d = pp.def, sp = pp.sp;
      if (d.x - sp.ox > R || d.x - sp.ox + sp.w < L || d.y - sp.oy > B || d.y - sp.oy + sp.h < T) continue;
      if (pp.canopy) { const behind = p.y < d.y && p.y > d.y - sp.oy && p.x > d.x - sp.ox && p.x < d.x - sp.ox + sp.w; pp.fade += ((behind ? 0.5 : 1) - pp.fade) * 0.15; }
      ents.push({ y: d.y, draw: () => {
        if (pp.fade < 0.99) c.globalAlpha = pp.fade;
        c.save(); c.translate(d.x, d.y); if (d.flip) c.scale(-1, 1);
        if (pp.sway && !calm) c.transform(1, 0, Math.sin(t * 1.6 + d.x * 0.011 + d.y * 0.007) * pp.sway, 1, 0, 0);   // wind: lean about the foot
        if (pp.frames) { const f = pp.frames; c.drawImage(f.img, (Math.floor(t * f.fps) % f.n) * f.fw, 0, f.fw, f.fh, -sp.ox, -sp.oy, sp.w, sp.h); } else c.drawImage(sp.cv, -sp.ox, -sp.oy);
        c.restore(); c.globalAlpha = 1;
      } });
    }
    for (const it of def.interactables) {
      if (it.x < L - 120 || it.x > R + 120 || it.y < T - 120 || it.y > B + 160) continue;
      if (it.kind === 'npc') { const sp = npcSprite(it.npc ?? 'guide'); ents.push({ y: it.y, draw: () => { const bob = calm ? 0 : Math.sin(t * 2 + it.x) * 1.5; c.drawImage(sp.cv, it.x - sp.ox, it.y - sp.oy - bob); } }); }
      else if (it.kind === 'chest') { const sp = propSprite({ kind: 'chest', x: 0, y: 0, v: this.opened.has(it.id) ? 1 : 0 })!; ents.push({ y: it.y, draw: () => c.drawImage(sp.cv, it.x - sp.ox, it.y - sp.oy) }); }
      else if (it.kind === 'sign') { const sp = propSprite({ kind: 'sign', x: 0, y: 0, dir: it.dir })!; ents.push({ y: it.y, draw: () => c.drawImage(sp.cv, it.x - sp.ox, it.y - sp.oy) }); }
      else if (it.kind === 'stone') { const sp = propSprite({ kind: 'runeStone', x: 0, y: 0 })!; ents.push({ y: it.y, draw: () => c.drawImage(sp.cv, it.x - sp.ox, it.y - sp.oy) }); }
    }
    // player: the supplied artwork. Characters without a back view reuse their front frames when walking up.
    // column 0 = standing, columns 1-6 = the six walk frames (the drawn frames already bounce, so no extra bob while walking)
    const col = !p.moving ? 0 : 1 + (Math.floor(p.dist / WALK_STRIDE) % SHEET.walkFrames);
    const bob = p.moving ? 0 : calm ? 0 : Math.sin(t * 3) * 0.6;
    ents.push({ y: p.y, draw: () => {
      const face: Facing = p.facing, im = this.sheet, left = face === 'side' && p.flip; shadowEllAt(c, p.x, p.y, 24);
      if (!im || !im.complete || !im.naturalWidth) return;
      const r = frameRect(face, col, left), w = SHEET.w * PLAYER_K, h = SHEET.h * PLAYER_K;
      c.save(); c.translate(p.x, p.y + 4);
      // props are placed from the explorer's head position (chars.json), so they fit every explorer
      const box = this.propDefs.length ? headBox(this.who, face, left) : null, ox = -w / 2, oy = -SHEET.feet * PLAYER_K - bob;
      const layer = (behind: boolean) => {
        if (!box) return;
        for (const pd of this.propDefs) {
          const pl = placeProp(pd, box, face, left), pi = this.propImgs.get(pd.id);
          if (!pl || pl.behind !== behind || !pi || !pi.complete || !pi.naturalWidth) continue;
          c.drawImage(pi, ox + pl.x * PLAYER_K, oy + pl.y * PLAYER_K, pl.w * PLAYER_K, pl.h * PLAYER_K);
        }
      };
      layer(true); c.drawImage(im, r.sx, r.sy, r.sw, r.sh, ox, oy, w, h); layer(false); c.restore();
    } });
    ents.sort((a, b2) => a.y - b2.y); for (const e of ents) e.draw();

    // tufts in front of the player's feet
    for (let i = tufStart; i < b.tufts.length && b.tufts[i].y < p.y + 40; i++) { const tf = b.tufts[i]; if (tf.y > p.y - 2 && Math.abs(tf.x - p.x) < 40) drawTuft(tf); }

    // animated glows on props (lanterns, crystals, lava)
    if (!calm) for (const pp of b.props) {
      if (!pp.fx) continue; const d = pp.def; if (d.x < L - 260 || d.x > R + 260 || d.y < T - 120 || d.y > B + 560) continue;
      c.save(); c.translate(d.x, d.y); const s = d.s ?? 1; c.scale(s, s); pp.fx(c, d, t); c.restore();
    }
    // overhead (arch lintels) and quest markers
    for (const pp of b.props) if (pp.overhead) { const d = pp.def, sp = pp.sp; if (d.x - sp.ox > R || d.x - sp.ox + sp.w < L) continue; c.drawImage(sp.cv, d.x - sp.ox, d.y - sp.oy); }
    for (const it of def.interactables) {
      if (it.x < L - 80 || it.x > R + 80 || it.y < T - 40 || it.y > B + 200) continue;
      const m = it.marker ?? 'none'; if (m === 'none') continue;
      if (it.kind === 'chest' && this.opened.has(it.id)) continue; if (it.kind === 'mystery' && this.flags.has(`mystery:${it.id}`)) continue; if (it.kind === 'npc' && this.flags.has(`talk:${it.id}`) && m === '!') { /* keep: guides can be re-read */ }
      const h = it.kind === 'npc' ? 98 : it.kind === 'chest' ? 56 : it.kind === 'shop' ? 150 : 28;
      drawMarker(c, m as '!' | '?' | 'shimmer' | 'arrow', it.x, it.y - h, calm ? 0 : t);
    }
    if (this.bang > 0) drawMarker(c, '!', p.x, p.y - 100, 0);

    // ---- screen space: particles, haze, vignette, fade
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (!calm) {
      c.fillStyle = def.pal.motes;
      for (const q of this.particles) {
        const y = def.particles === 'ash' ? ((q.y + t * q.v * 0.6) % 1) * H : (1 - ((q.y + t * q.v) % 1)) * H, x = ((q.x + Math.sin(t * 0.5 + q.ph) * 0.03) % 1) * W;
        c.globalAlpha = 0.25 + 0.4 * Math.abs(Math.sin(t + q.ph)); c.beginPath(); c.arc(x, y, q.r, 0, 6.3); c.fill();
      }
      c.globalAlpha = 1;
    }
    c.fillStyle = def.pal.haze; c.fillRect(0, 0, W, H);
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.78); vg.addColorStop(0, 'rgba(20,8,16,0)'); vg.addColorStop(1, 'rgba(20,8,16,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    if (this.fade > 0) { c.fillStyle = `rgba(14,6,14,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
}
function shadowEllAt(c: CanvasRenderingContext2D, x: number, y: number, rx: number) { c.save(); c.translate(x, y); shadowEll(c, rx, rx * 0.32, 0.26, 3, 2); c.restore(); }

function ix_key(e: WorldEngine) { return (e as any).keys.size > 0 || Math.hypot((e as any).joy[0], (e as any).joy[1]) > DEAD_ZONE; }
