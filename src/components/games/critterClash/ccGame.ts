import { ANIMAL_INFO, COVER_INFO, POSES, animalPath, coverPath, type CoverName, type CoverState, type ImageStore, type Pose, type Species } from './ccAssets';
import { MAP_H, MAP_W, Terrain } from './ccTerrain';

/** Critter Clash game engine (stage 1: one-device preview). Pure canvas, no React. */

const GRAVITY_ANIMAL = 1400;
const GRAVITY_SHOT = 900;
const WALK_SPEED = 70;
const HOP_VY = -680;
const MOVE_BUDGET = 260;
const TURN_TIME = 30;
const SHOT_POWER = 1400;
const BLAST_R = 62;
const CRATER_R = 50;
const SS = 1.5; // sprite supersampling
const WATER_Y = MAP_H - 40;

export type Phase = 'move' | 'flight' | 'settle' | 'over';
export interface GameStatus { phase: Phase; team: 0 | 1; timeLeft: number; moveLeft: number; winner: 0 | 1 | null; canAct: boolean; hp: [number, number] }

interface Animal {
  species: Species; team: 0 | 1; name: string;
  x: number; y: number; vx: number; vy: number;
  hp: number; facing: 1 | -1; grounded: boolean;
  alive: boolean; water: boolean; fade: number;
  hitT: number; aimT: number; walkT: number; moving: boolean;
}
interface Cover { name: CoverName; x: number; ground: number; hp: number; k: number; box: [number, number, number, number] }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; kind: 'drop' | 'puff' }
interface Shot { x: number; y: number; vx: number; vy: number; t: number; owner: Animal; spin: number }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const SPECIES_SCALE = (s: Species) => clamp(390 / ANIMAL_INFO[s].h, 0.9, 1.15);

const PROPS: { file: string; x: number; h: number }[] = [
  { file: 'props/prop_lantern_post.webp', x: 30, h: 330 },
  { file: 'props/prop_fence.webp', x: 620, h: 115 },
  { file: 'props/prop_flag_blue.webp', x: 735, h: 230 },
  { file: 'props/prop_pine.webp', x: 1580, h: 350 },
  { file: 'props/prop_pine.webp', x: 4290, h: 330 },
  { file: 'props/prop_windmill.webp', x: 4050, h: 470 },
  { file: 'props/prop_flag_red.webp', x: 3370, h: 230 },
];

const COVERS: { name: CoverName; x: number }[] = [
  { name: 'boulder', x: 360 }, { name: 'hay', x: 1060 }, { name: 'log', x: 1380 }, { name: 'crates', x: 1930 },
  { name: 'barrel', x: 2330 }, { name: 'hay', x: 2740 }, { name: 'wall', x: 3610 },
];
const TEAMS: Species[][] = [['hippo', 'llama', 'chicken'], ['penguin', 'goat', 'bunny']];
const SPAWN_X = [[150, 520, 1010], [3100, 3500, 3950]];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export class CritterGame {
  terrain: Terrain;
  private imgs: ImageStore;
  private sprites = new Map<string, HTMLCanvasElement>();
  private coverSprites = new Map<string, HTMLCanvasElement>();
  private bg: HTMLCanvasElement;
  animals: Animal[] = [];
  covers: Cover[] = [];
  parts: Particle[] = [];
  shot: Shot | null = null;
  phase: Phase = 'move';
  team: 0 | 1 = 0;
  turnIdx = [0, 0];
  active!: Animal;
  timeLeft = TURN_TIME;
  moveLeft = MOVE_BUDGET;
  settleT = 0;
  winner: 0 | 1 | null = null;
  // aiming
  angle = 0.8; power = 0.6; aiming = false;
  // input
  moveDir = 0;
  mapView = false;
  // camera
  cam = { x: 400, y: 500, z: 1 };
  private time = 0;
  private lastStatus = '';
  onStatus?: (s: GameStatus) => void;
  cw = 800; ch = 480;

  constructor(terrain: Terrain, imgs: ImageStore) {
    this.terrain = terrain;
    this.imgs = imgs;
    this.bg = this.buildBackground();
    this.buildSprites();
    this.placeCovers();
    this.spawn();
    this.startTurn(0);
    this.cam.x = this.active.x; this.cam.y = this.active.y - 120;
  }

  // ------------------------------------------------------------------ setup
  private buildBackground(): HTMLCanvasElement {
    const S = 0.5; const H = Math.round(MAP_H * S); const W = Math.round(MAP_W * S);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d')!;
    const files = ['world/bg_meadow_far.webp', 'world/bg_meadow_wide_b.webp', 'world/bg_meadow_wide_c.webp'];
    const over = 120; let x = 0;
    files.forEach((f, i) => {
      const im = this.imgs.get(f)!;
      const w = Math.round(im.width * (H / im.height));
      if (i === 0) { g.drawImage(im, 0, 0, w, H); x = w; return; }
      const start = x - over;
      const t = document.createElement('canvas'); t.width = w; t.height = H;
      const tg = t.getContext('2d')!;
      tg.drawImage(im, 0, 0, w, H);
      tg.globalCompositeOperation = 'destination-in';
      const gr = tg.createLinearGradient(0, 0, over, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
      tg.fillStyle = gr; tg.fillRect(0, 0, over, H);
      tg.fillStyle = '#000';
      tg.globalCompositeOperation = 'destination-in';
      // keep everything right of the fade
      tg.fillRect(over, 0, w, H);
      g.drawImage(t, start, 0);
      x = start + w;
    });
    if (x < W) { // stretch to fill if the pictures are narrower than the map
      const copy = document.createElement('canvas'); copy.width = x; copy.height = H;
      copy.getContext('2d')!.drawImage(c, 0, 0);
      g.clearRect(0, 0, W, H); g.drawImage(copy, 0, 0, x, H, 0, 0, W, H);
    }
    return c;
  }

  private buildSprites() {
    const species = new Set<Species>(TEAMS.flat());
    for (const s of species) {
      const k = (175 / 512) * SPECIES_SCALE(s) * SS;
      const size = Math.round(512 * k);
      for (const p of POSES) {
        const im = this.imgs.get(animalPath(s, p));
        if (!im) continue;
        const c = document.createElement('canvas'); c.width = size; c.height = size;
        c.getContext('2d')!.drawImage(im, 0, 0, size, size);
        this.sprites.set(`${s}_${p}`, c);
        this.imgs.delete(animalPath(s, p));
      }
    }
    for (const name of Object.keys(COVER_INFO) as CoverName[]) {
      for (const st of ['intact', 'cracked', 'rubble'] as CoverState[]) {
        const im = this.imgs.get(coverPath(name, st));
        if (!im) continue;
        const k = (COVER_INFO[name].hMul * 175 / COVER_INFO[name].height) * SS;
        const size = Math.round(512 * k);
        const c = document.createElement('canvas'); c.width = size; c.height = size;
        c.getContext('2d')!.drawImage(im, 0, 0, size, size);
        this.coverSprites.set(`${name}_${st}`, c);
        this.imgs.delete(coverPath(name, st));
      }
    }
  }

  private placeCovers() {
    for (const c of COVERS) {
      const info = COVER_INFO[c.name];
      const k = (info.hMul * 175) / info.height;
      const ground = this.terrain.surf[c.x];
      const left = c.x - 256 * k;
      const top = ground - info.ground * k + 5;
      this.covers.push({ name: c.name, x: c.x, ground, hp: info.hits, k, box: [left + info.bbox[0] * k, top + info.bbox[1] * k, left + info.bbox[2] * k, top + info.bbox[3] * k] });
    }
  }

  private spawn() {
    TEAMS.forEach((sp, team) => sp.forEach((s, i) => {
      const x = SPAWN_X[team][i];
      this.animals.push({ species: s, team: team as 0 | 1, name: cap(s), x, y: this.terrain.surf[x], vx: 0, vy: 0, hp: 100, facing: team === 0 ? 1 : -1, grounded: true, alive: true, water: false, fade: 1, hitT: 0, aimT: 0, walkT: 0, moving: false });
    }));
  }

  // ------------------------------------------------------------------ collisions
  private coverSolid(x: number, y: number, onlyHoppable: boolean): boolean {
    for (const c of this.covers) {
      if (c.hp <= 0) continue;
      if (onlyHoppable && !COVER_INFO[c.name].hoppable) continue;
      if (x >= c.box[0] && x <= c.box[2] && y >= c.box[1] && y <= c.box[3]) return true;
    }
    return false;
  }
  private groundSolid(x: number, y: number) { return this.terrain.solid(x, y) || this.coverSolid(x, y, true); }
  private bodySolid(x: number, y: number) { return this.terrain.solid(x, y) || this.coverSolid(x, y, false); }

  private alive(team?: number) { return this.animals.filter((a) => a.alive && !a.water && (team === undefined || a.team === team)); }

  // ------------------------------------------------------------------ turns
  private startTurn(team: 0 | 1) {
    this.team = team;
    const list = this.animals.filter((a) => a.team === team && a.alive && !a.water);
    this.active = list[this.turnIdx[team] % list.length];
    this.turnIdx[team]++;
    this.phase = 'move';
    this.timeLeft = TURN_TIME;
    this.moveLeft = MOVE_BUDGET;
    this.aiming = false;
    this.angle = 0.8; this.power = 0.6;
    this.mapView = false;
  }

  private endTurn() {
    const blue = this.alive(0).length; const red = this.alive(1).length;
    if (!blue || !red) {
      this.phase = 'over';
      this.winner = blue ? 0 : red ? 1 : null;
      return;
    }
    this.startTurn(this.team === 0 ? 1 : 0);
  }

  // ------------------------------------------------------------------ player actions
  get canAct() { return this.phase === 'move' && this.active.grounded && this.active.aimT <= 0; }

  setAim(dx: number, dy: number) {
    // slingshot: pull back from the target
    const len = Math.hypot(dx, dy);
    if (len < 6) return;
    this.active.facing = dx >= 0 ? 1 : -1;
    this.angle = clamp(Math.atan2(-dy, Math.abs(dx)), -0.35, 1.5);
    this.power = clamp(len / 140, 0.15, 1);
    this.aiming = true;
  }
  adjust(dAngle: number, dPower: number) {
    this.angle = clamp(this.angle + dAngle, -0.35, 1.5);
    this.power = clamp(this.power + dPower, 0.15, 1);
    this.aiming = true;
  }
  face(dir: 1 | -1) { if (this.canAct) this.active.facing = dir; }

  hop() {
    const a = this.active;
    if (!this.canAct || this.moveLeft < 40) return;
    a.vy = HOP_VY; a.vx = a.facing * 150; a.grounded = false; this.moveLeft -= 40;
  }

  fire() {
    const a = this.active;
    if (!this.canAct) return;
    const dirx = Math.cos(this.angle) * a.facing; const diry = -Math.sin(this.angle);
    const v = this.power * SHOT_POWER;
    this.shot = { x: a.x + dirx * 30, y: a.y - 95 + diry * 30, vx: dirx * v, vy: diry * v, t: 0, owner: a, spin: 0 };
    a.aimT = 0.35; this.aiming = false; this.phase = 'flight';
  }

  preview(): { x: number; y: number }[] {
    const a = this.active; const out: { x: number; y: number }[] = [];
    const v = this.power * SHOT_POWER;
    let x = a.x + Math.cos(this.angle) * a.facing * 30; let y = a.y - 95 - Math.sin(this.angle) * 30;
    let vx = Math.cos(this.angle) * a.facing * v; let vy = -Math.sin(this.angle) * v;
    for (let i = 0; i < 60; i++) {
      for (let j = 0; j < 3; j++) { vy += GRAVITY_SHOT * 0.016; x += vx * 0.016; y += vy * 0.016; }
      if (this.bodySolid(x, y) || y > MAP_H || x < 0 || x > MAP_W) break;
      out.push({ x, y });
    }
    return out;
  }

  // ------------------------------------------------------------------ simulation
  update(dtIn: number) {
    const dt = Math.min(dtIn, 0.033);
    this.time += dt;
    for (let s = 0; s < 2; s++) this.step(dt / 2);
    for (const p of this.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 'drop') p.vy += 900 * dt; else { p.vx *= 0.96; p.vy *= 0.96; } }
    this.parts = this.parts.filter((p) => p.life > 0);

    if (this.phase === 'move') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.phase = 'settle'; this.settleT = 0.6; }
    }
    if (this.phase === 'settle') {
      this.settleT -= dt;
      const busy = this.animals.some((a) => a.alive && !a.water && (!a.grounded || a.hitT > 0));
      if (this.settleT <= 0 && !busy) this.endTurn();
    }
    this.updateCamera(dt);
    this.emitStatus();
  }

  private step(dt: number) {
    for (const a of this.animals) this.stepAnimal(a, dt);
    if (this.shot) this.stepShot(dt);
  }

  private stepAnimal(a: Animal, dt: number) {
    if (!a.alive) return;
    if (a.hitT > 0) a.hitT -= dt;
    if (a.aimT > 0) a.aimT -= dt;
    if (a.water) {
      a.fade -= dt / 2.2; a.x += 18 * dt; a.y = WATER_Y + Math.sin(this.time * 3 + a.x) * 3;
      if (a.fade <= 0) { a.alive = false; this.poof(a.x, a.y - 30); }
      return;
    }
    a.moving = false;
    if (a.grounded) {
      if (a === this.active && this.canAct && this.moveDir !== 0 && this.moveLeft > 0) this.walk(a, this.moveDir as 1 | -1, dt);
      // ground vanished under the animal?
      if (a.grounded && !this.groundSolid(a.x, a.y + 2) && !this.groundSolid(a.x, a.y)) { a.grounded = false; a.vy = 0; }
      if (a.grounded) { a.vx = 0; }
    }
    if (!a.grounded) {
      a.vy += GRAVITY_ANIMAL * dt;
      const nx = a.x + a.vx * dt;
      const dir = Math.sign(a.vx);
      if (dir && (this.bodySolid(nx + dir * 18, a.y - 30) || this.bodySolid(nx + dir * 18, a.y - 70))) a.vx = 0; else a.x = nx;
      a.y += a.vy * dt;
      if (a.vy < 0 && this.bodySolid(a.x, a.y - 100)) a.vy = 0;
      if (a.vy >= 0 && this.groundSolid(a.x, a.y)) {
        let n = 0; while (n < 40 && this.groundSolid(a.x, a.y - 1)) { a.y--; n++; }
        a.grounded = true; a.vy = 0; a.vx = 0;
      }
      a.x = clamp(a.x, 10, MAP_W - 10);
      if (a.y > WATER_Y) { a.water = true; a.fade = 1; a.vx = 0; a.vy = 0; this.splash(a.x, WATER_Y); }
    }
  }

  private walk(a: Animal, dir: 1 | -1, dt: number) {
    a.facing = dir;
    const step = WALK_SPEED * dt;
    const nx = a.x + dir * step;
    if (nx < 10 || nx > MAP_W - 10) return;
    if (this.bodySolid(nx + dir * 18, a.y - 30) || this.bodySolid(nx + dir * 18, a.y - 70)) return;
    if (this.groundSolid(nx, a.y - 18)) return; // too steep to step up
    let gy = -1;
    for (let y = a.y - 18; y <= a.y + 22; y++) if (this.groundSolid(nx, y)) { gy = y; break; }
    a.x = nx; a.moving = true; a.walkT += dt; this.moveLeft = Math.max(0, this.moveLeft - step);
    if (gy >= 0) a.y = gy; else { a.grounded = false; a.vy = 0; a.vx = 0; }
  }

  private stepShot(dt: number) {
    const s = this.shot!;
    s.t += dt; s.spin += dt * 8;
    s.vy += GRAVITY_SHOT * dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (Math.random() < 0.5) this.parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.35, max: 0.35, r: 3, kind: 'puff' });
    if (s.x < -50 || s.x > MAP_W + 50 || s.y > MAP_H + 30) { this.splash(clamp(s.x, 0, MAP_W), WATER_Y); this.finishShot(); return; }
    let hit = this.bodySolid(s.x, s.y);
    if (!hit) for (const a of this.animals) {
      if (!a.alive || a.water || (a === s.owner && s.t < 0.3)) continue;
      if (Math.hypot(s.x - a.x, s.y - (a.y - 45)) < 38) { hit = true; break; }
    }
    if (hit) { this.explode(s.x, s.y); this.finishShot(); }
  }

  private finishShot() { this.shot = null; this.phase = 'settle'; this.settleT = 1.0; }

  private explode(x: number, y: number) {
    this.terrain.carve(x, y, CRATER_R);
    for (let i = 0; i < 26; i++) {
      const ang = Math.random() * Math.PI * 2; const sp = 80 + Math.random() * 320;
      this.parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 120, life: 0.7 + Math.random() * 0.5, max: 1.2, r: 3 + Math.random() * 4, kind: 'drop' });
    }
    for (let i = 0; i < 8; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.8, max: 0.8, r: 18 + Math.random() * 14, kind: 'puff' });
    for (const a of this.animals) {
      if (!a.alive || a.water) continue;
      const dx = a.x - x; const dy = a.y - 45 - y; const d = Math.hypot(dx, dy);
      if (d > BLAST_R + 38) continue;
      const f = 1 - d / (BLAST_R + 38);
      a.hp = Math.max(0, a.hp - Math.round(40 * f));
      const n = d || 1;
      a.vx = (dx / n) * 320 * f + (dx >= 0 ? 40 : -40); a.vy = -320 * f - 120; a.grounded = false; a.hitT = 0.9;
      if (a.hp <= 0) { a.alive = false; this.poof(a.x, a.y - 45); }
    }
    for (const c of this.covers) {
      if (c.hp <= 0) continue;
      const nx = clamp(x, c.box[0], c.box[2]); const ny = clamp(y, c.box[1], c.box[3]);
      if (Math.hypot(nx - x, ny - y) < BLAST_R) { c.hp--; if (c.hp <= 0) this.poof((c.box[0] + c.box[2]) / 2, (c.box[1] + c.box[3]) / 2); }
    }
  }

  private poof(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2;
      this.parts.push({ x, y, vx: Math.cos(ang) * 60, vy: Math.sin(ang) * 60, life: 0.9, max: 0.9, r: 16 + Math.random() * 12, kind: 'puff' });
    }
  }
  private splash(x: number, y: number) {
    for (let i = 0; i < 16; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 200, vy: -150 - Math.random() * 300, life: 0.9, max: 0.9, r: 3 + Math.random() * 3, kind: 'drop' });
  }

  // ------------------------------------------------------------------ camera
  resize(cw: number, ch: number) { this.cw = cw; this.ch = ch; }
  private targetZoom() {
    if (this.mapView) return Math.max(this.cw / MAP_W, this.ch / MAP_H * 0.6);
    return Math.max(Math.min(this.ch / 640, this.cw / 800), this.ch / MAP_H);
  }
  private updateCamera(dt: number) {
    const tz = this.targetZoom();
    const f = this.shot ?? this.active;
    const fy = this.shot ? f.y : f.y - 100;
    let tx = f.x; let ty = fy;
    if (this.mapView) { tx = MAP_W / 2; ty = MAP_H / 2; }
    const k = 1 - Math.pow(0.0015, dt);
    this.cam.z += (tz - this.cam.z) * k; this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
  }
  private clampCam() {
    const z = this.cam.z; const hw = this.cw / (2 * z); const hh = this.ch / (2 * z);
    const cx = hw * 2 >= MAP_W ? MAP_W / 2 : clamp(this.cam.x, hw, MAP_W - hw);
    const cy = hh * 2 >= MAP_H ? MAP_H / 2 : clamp(this.cam.y, hh, MAP_H - hh);
    return { cx, cy, z, hw, hh };
  }
  /** screen to world, for dragging and tapping */
  toWorld(sx: number, sy: number) { const { cx, cy, z } = this.clampCam(); return { x: (sx - this.cw / 2) / z + cx, y: (sy - this.ch / 2) / z + cy }; }

  private emitStatus() {
    const hp: [number, number] = [0, 0];
    for (const a of this.animals) if (a.alive && !a.water) hp[a.team] += a.hp;
    const st: GameStatus = { phase: this.phase, team: this.team, timeLeft: Math.max(0, Math.ceil(this.timeLeft)), moveLeft: Math.round(this.moveLeft / 10), winner: this.winner, canAct: this.canAct, hp };
    const key = JSON.stringify(st);
    if (key !== this.lastStatus) { this.lastStatus = key; this.onStatus?.(st); }
  }

  // ------------------------------------------------------------------ drawing
  private poseOf(a: Animal): Pose {
    if (a.water) return 'water';
    if (this.phase === 'over' && this.winner !== null) return a.team === this.winner ? 'happy' : 'sad';
    if (a.hitT > 0) return 'hit';
    if (a.aimT > 0 || (a === this.active && this.aiming && this.phase === 'move' && a.grounded)) return 'aim';
    if (!a.grounded) return 'happy';
    if (a.moving) return Math.floor(a.walkT / 0.18) % 2 ? 'walk_b' : 'walk_a';
    return 'idle';
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { cx, cy, z, hw, hh } = this.clampCam();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#bfe3f5'; ctx.fillRect(0, 0, this.cw, this.ch);
    ctx.setTransform(z, 0, 0, z, this.cw / 2 - cx * z, this.ch / 2 - cy * z);
    const vx0 = Math.max(0, Math.floor(cx - hw)); const vx1 = Math.min(MAP_W, Math.ceil(cx + hw));
    const vy0 = Math.max(0, Math.floor(cy - hh)); const vy1 = Math.min(MAP_H, Math.ceil(cy + hh));
    const vw = vx1 - vx0; const vh = vy1 - vy0;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.bg, vx0 / 2, vy0 / 2, vw / 2, vh / 2, vx0, vy0, vw, vh);

    // water band
    const wy = MAP_H - 70;
    ctx.fillStyle = 'rgba(70,160,210,0.55)'; ctx.fillRect(vx0, wy, vw, 70);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = vx0; x <= vx1; x += 12) { const y = wy + Math.sin(x / 40 + this.time * 2) * 3; if (x === vx0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();

    this.drawBridge(ctx); // behind the ground so the islands stay readable
    for (const c of [this.terrain.rock, this.terrain.edge, this.terrain.cap]) ctx.drawImage(c, vx0, vy0, vw, vh, vx0, vy0, vw, vh);

    // props and bridge
    for (const p of PROPS) {
      if (p.x < vx0 - 300 || p.x > vx1 + 300) continue;
      const im = this.imgs.get(p.file); if (!im) continue;
      const w = im.width * (p.h / im.height);
      ctx.drawImage(im, p.x - w / 2, this.terrain.surf[p.x] + 4 - p.h, w, p.h);
    }

    // covers
    for (const c of this.covers) {
      const st: CoverState = c.hp <= 0 ? 'rubble' : c.hp / COVER_INFO[c.name].hits > 0.66 ? 'intact' : 'cracked';
      const sp = this.coverSprites.get(`${c.name}_${st}`); if (!sp) continue;
      const size = sp.width / SS;
      if (c.x + size < vx0 || c.x - size > vx1) continue;
      ctx.drawImage(sp, c.x - size / 2, c.ground - COVER_INFO[c.name].ground * c.k + 5, size, size);
    }

    // animals
    for (const a of this.animals) if (a.alive) this.drawAnimal(ctx, a);

    // projectile and effects
    if (this.phase === 'move' && this.aiming && this.active.grounded) this.drawAim(ctx);
    if (this.shot) this.drawShot(ctx, this.shot);
    for (const p of this.parts) {
      const t = p.life / p.max;
      if (p.kind === 'drop') { ctx.fillStyle = `rgba(150,215,255,${t})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + t * 0.5), 0, 7); ctx.fill(); }
      else { ctx.fillStyle = `rgba(255,255,255,${t * 0.7})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.4 - t * 0.6), 0, 7); ctx.fill(); }
    }

    // front grass band (in front of animals so feet sink into the grass)
    const sc = this.terrain.cap;
    for (let x = vx0 - (vx0 % 4); x < vx1; x += 4) {
      const sy = this.terrain.surf[x]; if (sy >= MAP_H) continue;
      ctx.drawImage(sc, x, sy - 11, 4, 51, x, sy - 11, 4, 51);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawForeground(ctx);
    this.drawHud(ctx, z, cx, cy);
  }

  private drawBridge(ctx: CanvasRenderingContext2D) {
    const im = this.imgs.get('props/prop_bridge.webp'); if (!im) return;
    const xl = 2470; const xr = 3400;
    const yl = this.terrain.surf[xl - 12] + 6; const yr = this.terrain.surf[xr + 12] + 6;
    const dx = xr - xl; const len = Math.hypot(dx, yr - yl); const s = len / im.width;
    ctx.save(); ctx.translate(xl, yl); ctx.rotate(Math.atan2(yr - yl, dx));
    ctx.drawImage(im, 0, -im.height * s, len, im.height * s);
    ctx.restore();
  }

  private drawAnimal(ctx: CanvasRenderingContext2D, a: Animal) {
    const sp = this.sprites.get(`${a.species}_${this.poseOf(a)}`); if (!sp) return;
    const info = ANIMAL_INFO[a.species];
    const k = (175 / 512) * SPECIES_SCALE(a.species);
    const size = 512 * k;
    const bounce = a.moving ? Math.abs(Math.sin(a.walkT * 17)) * -4 : 0;
    const wob = a.hitT > 0 ? Math.sin(this.time * 30) * 0.12 * Math.min(1, a.hitT) : 0;
    ctx.save();
    if (a.water) ctx.globalAlpha = Math.max(0, a.fade);
    ctx.translate(a.x, a.y + bounce);
    if (wob) ctx.rotate(wob);
    if (a.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(sp, -info.cx * k, -info.feet * k + 6, size, size);
    ctx.restore();
    if (!a.water) {
      const top = a.y - (info.feet - info.bbox[1]) * k;
      const w = 44; const x = a.x - w / 2; const y = top - 12;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x - 1, y - 1, w + 2, 8);
      ctx.fillStyle = a.hp > 50 ? '#5fd35f' : a.hp > 25 ? '#f2c230' : '#e9503f'; ctx.fillRect(x, y, w * a.hp / 100, 6);
      if (a === this.active && this.phase !== 'over') {
        const mk = this.imgs.get(a.team === 0 ? 'ui/ui_marker_blue.webp' : 'ui/ui_marker_red.webp');
        if (mk) { const mw = 40; const mh = mk.height * mw / mk.width; ctx.drawImage(mk, a.x - mw / 2, y - mh - 6 + Math.sin(this.time * 4) * 4, mw, mh); }
      }
    }
  }

  private drawAim(ctx: CanvasRenderingContext2D) {
    const pts = this.preview();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    pts.forEach((p, i) => { if (i % 3) return; ctx.beginPath(); ctx.arc(p.x, p.y, 3.5 - i / 40, 0, 7); ctx.fill(); });
    const last = pts[pts.length - 1];
    const ch = this.imgs.get('ui/ui_crosshair.webp');
    if (last && ch) { const w = 34; ctx.drawImage(ch, last.x - w / 2, last.y - w / 2, w, ch.height * w / ch.width); }
  }

  private drawShot(ctx: CanvasRenderingContext2D, s: Shot) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx));
    const g = ctx.createRadialGradient(-4, -4, 2, 0, 0, 15);
    g.addColorStop(0, '#d9f3ff'); g.addColorStop(1, '#3a9be0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 15, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2d7fc0'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-21, -5); ctx.lineTo(-21, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-4, -5, 4, 2.5, -0.5, 0, 7); ctx.fill();
    ctx.restore();
  }

  private drawForeground(ctx: CanvasRenderingContext2D) {
    const u = this.ch / 720;
    const place = (file: string, k: number, corner: 'tl' | 'br' | 'bl') => {
      const im = this.imgs.get(file); if (!im) return;
      const w = im.width * k * u; const h = im.height * k * u;
      const x = corner === 'br' ? this.cw - w : 0; const y = corner === 'tl' ? 0 : this.ch - h;
      ctx.globalAlpha = 0.95; ctx.drawImage(im, x, y, w, h); ctx.globalAlpha = 1;
    };
    place('props/fg_tree_topleft.webp', 0.38, 'tl');
    place('props/fg_rocks_bottomright.webp', 0.5, 'br');
    place('props/fg_bushes_bottomleft.webp', 0.45, 'bl');
  }

  private drawHud(ctx: CanvasRenderingContext2D, z: number, cx: number, cy: number) {
    void z; void cx; void cy;
    const s = clamp(this.cw / 720, 0.7, 1.2);
    const bar = (x: number, team: 0 | 1) => {
      const hp = this.animals.filter((a) => a.team === team && a.alive && !a.water).reduce((t, a) => t + a.hp, 0) / 300;
      const w = 130 * s; const h = 16 * s;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 2, 10 - 2, w + 4, h + 4);
      ctx.fillStyle = team === 0 ? '#3f8fe8' : '#e8574a'; ctx.fillRect(x, 10, w * hp, h);
    };
    bar(10, 0); bar(this.cw - 10 - 130 * s, 1);
    // timer
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.arc(this.cw / 2, 28 * s, 22 * s, 0, 7); ctx.fill();
    ctx.fillStyle = this.timeLeft < 6 ? '#ff7b6b' : '#fff'; ctx.font = `bold ${20 * s}px system-ui, sans-serif`;
    if (this.phase === 'move') ctx.fillText(String(Math.max(0, Math.ceil(this.timeLeft))), this.cw / 2, 29 * s);
    // movement bar
    if (this.phase === 'move') {
      const w = 120 * s; const x = this.cw / 2 - w / 2; const y = 56 * s;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 2, y - 2, w + 4, 10 * s);
      ctx.fillStyle = '#ffd54a'; ctx.fillRect(x, y, w * this.moveLeft / MOVE_BUDGET, 6 * s);
    }
  }
}
