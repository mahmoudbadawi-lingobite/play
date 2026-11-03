/**
 * Runs the supplied CSS keyframe animations (monsterAnimations.css) on hidden <img> elements and reads each
 * element's computed transform / opacity / filter every frame, so the same animation can be drawn onto the world
 * canvas with correct depth sorting against the player. Nothing here re-implements the animations.
 */
export interface Pose { img: HTMLImageElement; m: [number, number, number, number, number, number]; ox: number; oy: number; ml: number; opacity: number; filter: string }

export class AnimSampler {
  private els = new Map<string, HTMLImageElement>();
  private host: HTMLElement;
  private paused = false;
  private base: string;
  private size: number;
  constructor(host: HTMLElement, base: string, size = 100) {
    this.base = base; this.size = size;
    this.host = document.createElement('div');
    this.host.setAttribute('aria-hidden', 'true');
    this.host.style.cssText = 'position:absolute;left:-10000px;top:0;width:1px;height:1px;overflow:visible;pointer-events:none;visibility:hidden';
    host.appendChild(this.host);
  }
  ensure(key: string, sprite: string): HTMLImageElement {
    let el = this.els.get(key);
    if (!el) {
      el = new Image(); el.decoding = 'async'; el.src = `${this.base}${sprite}.png`;
      el.className = `mon a-${sprite}`; el.width = this.size; el.height = this.size;
      el.style.cssText = `position:absolute;left:0;top:0;width:${this.size}px;height:${this.size}px;animation-delay:-${(Math.random() * 3).toFixed(2)}s;animation-play-state:${this.paused ? 'paused' : 'running'}`;
      this.host.appendChild(el); this.els.set(key, el);
    }
    return el;
  }
  setPaused(p: boolean) { this.paused = p; for (const el of this.els.values()) el.style.animationPlayState = p ? 'paused' : 'running'; }
  /** Current pose in the sprite's own pixel space (size x size). Returns null until the image has loaded. */
  sample(key: string, sprite: string): Pose | null {
    const img = this.ensure(key, sprite);
    if (!img.complete || !img.naturalWidth) return null;
    const cs = getComputedStyle(img), t = cs.transform, m: Pose['m'] = [1, 0, 0, 1, 0, 0];
    if (t && t !== 'none') { const v = t.match(/matrix\(([^)]+)\)/); if (v) { const n = v[1].split(',').map(parseFloat); if (n.length === 6) for (let i = 0; i < 6; i++) m[i] = n[i]; } }
    const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
    return { img, m, ox: ox || this.size / 2, oy: oy || this.size, ml: parseFloat(cs.marginLeft) || 0, opacity: parseFloat(cs.opacity), filter: cs.filter };
  }
  destroy() { this.host.remove(); this.els.clear(); }
}

const canFilter = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;
/** Draw a sampled pose with its feet at (x, y) at the given display size. */
export function drawPose(c: CanvasRenderingContext2D, p: Pose, x: number, y: number, size: number, flip = false, size0 = 100) {
  const k = size / size0;
  c.save();
  c.globalAlpha *= isNaN(p.opacity) ? 1 : p.opacity;
  c.translate(x, y + 6 * k);
  c.scale(k, k);
  c.translate(-size0 / 2 + p.ml, -size0);
  if (flip) { c.translate(size0 / 2, 0); c.scale(-1, 1); c.translate(-size0 / 2, 0); }
  c.translate(p.ox, p.oy); c.transform(p.m[0], p.m[1], p.m[2], p.m[3], p.m[4], p.m[5]); c.translate(-p.ox, -p.oy);
  if (canFilter && p.filter && p.filter !== 'none') (c as any).filter = p.filter;
  c.drawImage(p.img, 0, 0, size0, size0);
  c.restore();
}
