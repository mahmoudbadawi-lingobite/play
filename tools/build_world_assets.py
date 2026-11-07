#!/usr/bin/env python3
"""
Cut the world art sheets into the files the game loads and write public/monster-quest/world/world-assets.json.

  python tools/build_world_assets.py ground  tiles.png                     # 3x3 sheet of ground tiles (reading order, see GROUND below)
  python tools/build_world_assets.py sprites sheet.png --names "a,b,c"     # separate objects on magenta/transparent, reading order
  python tools/build_world_assets.py anim    strip.png --name campfire --frames 6 --fps 8      # 6 frames in a row
  python tools/build_world_assets.py anim    clip.gif  --name torch --fps 8                    # animated GIF (one object per frame)

Objects are found automatically (they do not have to sit in an exact grid), background removed, trimmed, and registered.
Re-using a name replaces that picture and keeps any numbers you tuned in world-assets.json.
Needs: pip install pillow numpy scipy
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image, ImageSequence
from scipy import ndimage as ndi

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'monster-quest', 'world')
JSON_PATH = os.path.join(OUT, 'world-assets.json')
GROUND = ['grass1', 'dirt', 'cobble', 'sand', 'moss-stone', 'forest', 'mud-water', 'grass2', 'grass3']

def load():
    if os.path.exists(JSON_PATH): return json.load(open(JSON_PATH, encoding='utf-8'))
    return {'ground': {}, 'sprites': {}, 'anims': {}}
def save(d):
    os.makedirs(OUT, exist_ok=True)
    text = json.dumps(d, indent=1, default=int)      # build the text first so a failure can never leave a half-written file
    open(JSON_PATH, 'w', encoding='utf-8').write(text)
    print(f"world-assets.json: {len(d['ground'])} ground, {len(d['sprites'])} sprites, {len(d['anims'])} animations")

def key_alpha(im):
    """RGBA with the background removed (transparent sheets are kept, magenta is keyed with a defringed edge)."""
    a = np.array(im.convert('RGBA')).astype(int)
    if a[:4, :4, 3].max() < 20 or (a[..., 3] < 250).mean() > 0.2:
        a[..., 3] = np.where(a[..., 3] > 40, a[..., 3], 0); return a
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r > 215) & (b > 215) & (g < 95) & (abs(r - b) < 45)      # strict: purple and pink objects must never be keyed
    fg = ~mag
    ring = fg & ndi.binary_dilation(mag, iterations=2)
    t = np.clip((b - np.maximum(g, 40) - 30) / 200.0, 0, 1) * (g < 150)
    alpha = np.where(ring, 1 - np.clip(t * 1.4, 0, 1), 1.0)
    tt = np.clip(t, 0, 0.85)
    for ch, m in ((0, 255), (2, 255), (1, 0)):
        c = a[..., ch].astype(float); dec = (c - tt * m) / np.maximum(1 - tt, 0.15)
        a[..., ch] = np.where(ring & (tt > 0.05), np.clip(dec, 0, 255), c).astype(int)
    a[..., 3] = np.where(fg, 255 * alpha, 0).astype(int)
    return a

def components(a, dil=3, min_px=900):
    fg = a[..., 3] > 60
    lab, n = ndi.label(ndi.binary_dilation(fg, iterations=dil))
    out = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        m = (lab == i + 1) & fg
        if m.sum() < min_px: continue
        ys, xs = sl; out.append(dict(box=(xs.start, ys.start, xs.stop, ys.stop), mask=m))
    # a loose piece lying inside another object's box (a chimney top, a lantern) belongs to it
    keep = []
    for o in out:
        cx, cy = (o['box'][0] + o['box'][2]) / 2, (o['box'][1] + o['box'][3]) / 2
        host = next((h for h in out if h is not o and (h['box'][2] - h['box'][0]) * (h['box'][3] - h['box'][1]) > 4 * (o['box'][2] - o['box'][0]) * (o['box'][3] - o['box'][1]) and h['box'][0] <= cx <= h['box'][2] and h['box'][1] <= cy <= h['box'][3]), None)
        if host is None: keep.append(o)
        else:
            host['mask'] = host['mask'] | o['mask']
            host['box'] = (min(host['box'][0], o['box'][0]), min(host['box'][1], o['box'][1]), max(host['box'][2], o['box'][2]), max(host['box'][3], o['box'][3]))
    out = keep
    # reading order: rows by centre y, then x
    out.sort(key=lambda o: (o['box'][1] + o['box'][3]) / 2)
    rows, cur = [], [out[0]]
    for o in out[1:]:
        cy = (o['box'][1] + o['box'][3]) / 2; ref = sum((u['box'][1] + u['box'][3]) / 2 for u in cur) / len(cur)
        if abs(cy - ref) < 70: cur.append(o)
        else: rows.append(cur); cur = [o]
    rows.append(cur)
    return [o for r in rows for o in sorted(r, key=lambda o: o['box'][0])]

def crop(a, o):
    x0, y0, x1, y1 = o['box']; sub = a[y0:y1, x0:x1].copy()
    sub[..., 3] = np.where(o['mask'][y0:y1, x0:x1], sub[..., 3], 0)
    return Image.fromarray(sub.clip(0, 255).astype(np.uint8), 'RGBA')

def seamless(img):
    a = np.array(img).astype(float); h, w = a.shape[:2]
    b = np.roll(a, (h // 2, w // 2), (0, 1))
    mx = np.sin(np.linspace(0, np.pi, w)) ** 2; my = np.sin(np.linspace(0, np.pi, h)) ** 2
    m = (my[:, None] * mx[None, :])[..., None]
    return Image.fromarray((a * m + b * (1 - m)).clip(0, 255).astype(np.uint8))

def cmd_ground(o):
    d = load(); im = Image.open(o.sheet).convert('RGB'); cw, ch = im.width // 3, im.height // 3
    os.makedirs(os.path.join(OUT, 'ground'), exist_ok=True)
    for i, name in enumerate(GROUND):
        r, c = divmod(i, 3); t = im.crop((c * cw + 3, r * ch + 3, (c + 1) * cw - 3, (r + 1) * ch - 3))
        keep = name in ('cobble', 'moss-stone', 'mud-water')           # big features: not cross-faded
        if not keep: t = seamless(t)
        t.save(os.path.join(OUT, 'ground', name + '.jpg'), quality=88)
        d['ground'][name] = dict(file=f'ground/{name}.jpg', w=t.width, h=t.height, seamless=not keep)
    save(d)

def cmd_sprites(o):
    d = load(); a = key_alpha(Image.open(o.sheet)); comps = components(a, o.dilate)
    names = [n.strip() for n in o.names.split(',') if n.strip()]
    if len(names) != len(comps): sys.exit(f'found {len(comps)} objects but got {len(names)} names (reading order: left to right, top to bottom)')
    os.makedirs(os.path.join(OUT, 'sprites'), exist_ok=True)
    for n, c in zip(names, comps):
        if n == '-': continue
        im = crop(a, c); bb = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox(); im = im.crop(bb)
        k = min(1.0, 600 / max(im.size)); im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS) if k < 1 else im
        im.save(os.path.join(OUT, 'sprites', n + '.webp'), 'WEBP', quality=90, alpha_quality=100, method=6)
        old = d['sprites'].get(n, {})
        d['sprites'][n] = {**old, 'file': f'sprites/{n}.webp', 'w': im.width, 'h': im.height}
    save(d)

def cmd_anim(o):
    d = load(); frames = []
    if o.sheet.lower().endswith('.gif'):
        for fr in ImageSequence.Iterator(Image.open(o.sheet)): frames.append(key_alpha(fr.convert('RGB')))
    else:
        a = key_alpha(Image.open(o.sheet)); n = o.frames; w = a.shape[1] // n
        frames = [a[:, i * w:(i + 1) * w] for i in range(n)]
    al = np.maximum.reduce([f[..., 3] for f in frames]) > 60
    ys, xs = np.where(al); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    k = min(1.0, 420 / max(x1 - x0, y1 - y0)); fw, fh = x1 - x0, y1 - y0
    strip = Image.new('RGBA', (fw * len(frames), fh), (0, 0, 0, 0))
    for i, f in enumerate(frames): strip.alpha_composite(Image.fromarray(f[y0:y1, x0:x1].clip(0, 255).astype(np.uint8), 'RGBA'), (i * fw, 0))
    if k < 1: strip = strip.resize((round(strip.width * k) // len(frames) * len(frames), round(fh * k)), Image.LANCZOS); fw, fh = strip.width // len(frames), strip.height
    os.makedirs(os.path.join(OUT, 'anim'), exist_ok=True)
    strip.save(os.path.join(OUT, 'anim', o.name + '.webp'), 'WEBP', quality=90, alpha_quality=100, method=6)
    old = d['anims'].get(o.name, {})
    d['anims'][o.name] = {**old, 'file': f'anim/{o.name}.webp', 'n': len(frames), 'fps': o.fps, 'fw': int(fw), 'fh': int(fh)}
    save(d)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    g = sp.add_parser('ground'); g.add_argument('sheet')
    s = sp.add_parser('sprites'); s.add_argument('sheet'); s.add_argument('--names', required=True); s.add_argument('--dilate', type=int, default=3)
    a = sp.add_parser('anim'); a.add_argument('sheet'); a.add_argument('--name', required=True); a.add_argument('--frames', type=int, default=6); a.add_argument('--fps', type=float, default=8)
    o = ap.parse_args(); {'ground': cmd_ground, 'sprites': cmd_sprites, 'anim': cmd_anim}[o.cmd](o)

if __name__ == '__main__':
    main()
