#!/usr/bin/env python3
"""
Turn a generated walk sheet into a game character and register it.

  python tools/build_character.py --id adam --name Adam --blurb "Star-shirt explorer" --walk adam-walk.png [--price 150]

Walk sheet: 4 rows x 6 columns on a flat magenta (or transparent) background.
  rows = walking toward the camera, left, right, away.  columns = the 6 frames of the walk.
The tool finds every figure itself (they do not have to sit exactly inside the grid), removes the background and the coloured
edge, scales all frames the same, and lines them up on the head and the feet. Output:
  public/monster-quest/chars/<id>.png     7 columns x 4 rows of 256x256 frames: column 1 = standing, columns 2-7 = the walk
  public/monster-quest/chars/chars.json   the list of characters (name, price, head size for props). Edit names/prices here.
  supabase/monster_quest_characters.sql   run it in the Supabase SQL editor to put the characters in the shop
  tools/preview/<id>.png                  contact sheet to check the result
Needs: pip install pillow numpy scipy
"""
import argparse, json, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT_DIR = os.path.join(ROOT, 'public', 'monster-quest', 'chars')
JSON_PATH = os.path.join(OUT_DIR, 'chars.json')
SQL_PATH = os.path.join(ROOT, 'supabase', 'monster_quest_characters.sql')
PREVIEW_DIR = os.path.join(ROOT, 'tools', 'preview')
FW = FH = 256          # frame size
FEET = 248             # ground line inside a frame
CX = 128               # head centre column inside every frame
TARGET_H = 226         # standing height of the figure in a frame
ROWS = ['down', 'left', 'right', 'up']

def foreground(im):
    a = np.array(im.convert('RGBA')).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    if al[:4, :4].max() < 20:                       # already transparent
        return a, al > 24
    mag = (r > 150) & (b > 150) & (g < 0.45 * np.minimum(r, b)) & (abs(r - b) < 90)
    return a, ~mag

def defringe(a, fg):
    """Remove the thin magenta-tinted rim left on the outline by the generator."""
    bg = ~fg
    ring = fg & ndi.binary_dilation(bg, iterations=2)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # magenta contamination: blue (and red) well above green while the outline itself is dark
    t = np.clip((b - np.maximum(g, 40) - 30) / 200.0, 0, 1) * (g < 140)
    alpha = np.where(ring, 1 - np.clip(t * 1.4, 0, 1), 1.0)
    for ch, m in ((0, 255), (2, 255), (1, 0)):
        c = a[..., ch].astype(float); tt = np.clip(t, 0, 0.85)
        dec = (c - tt * m) / np.maximum(1 - tt, 0.15)
        a[..., ch] = np.where(ring & (tt > 0.05), np.clip(dec, 0, 255), c).astype(int)
    a[..., 3] = (np.where(fg, 255, 0) * alpha).astype(int)
    a[..., 3][~fg] = 0
    return a

def find_frames(fg, cols, rows):
    """One mask per frame. Figures are found by connectivity, then matched to grid cells by their centre."""
    H, W = fg.shape
    lab, n = ndi.label(ndi.binary_dilation(fg, iterations=2))
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
    objs = ndi.find_objects(lab)
    big = [i + 1 for i in range(n) if sizes[i] > 6000]
    cw, ch = W / cols, H / rows
    cells = {}
    for i in big:
        ys, xs = np.where(lab == i)
        key = (min(rows - 1, int(ys.mean() // ch)), min(cols - 1, int(xs.mean() // cw)))
        cells.setdefault(key, []).append(i)
    # small loose pieces (a hair tuft, a shoe tip) join the nearest figure; specks far from any figure are dropped
    cent = {i: np.array([np.where(lab == i)[1].mean(), np.where(lab == i)[0].mean()]) for i in big}
    for i in range(1, n + 1):
        if i in cent or sizes[i - 1] < 40: continue
        sl = objs[i - 1]; p = np.array([(sl[1].start + sl[1].stop) / 2, (sl[0].start + sl[0].stop) / 2])
        j = min(big, key=lambda k: np.linalg.norm(cent[k] - p))
        if np.linalg.norm(cent[j] - p) < 140:
            for key, ids in cells.items():
                if j in ids: ids.append(i)
    frames = {}
    for r in range(rows):
        for c in range(cols):
            ids = cells.get((r, c))
            if not ids: sys.exit(f'No figure found for row {r + 1}, column {c + 1}. Check the sheet is {rows} rows x {cols} columns.')
            if sum(1 for i in ids if i in cent) > 1: sys.exit(f'Two figures overlap at row {r + 1}, column {c + 1}: leave more space between frames.')
            frames[(r, c)] = np.isin(lab, ids) & fg
    return frames

def head_metrics(m):
    """(centre x, top y of the head, head width) of a figure mask, in its own pixel space."""
    ys, xs = np.where(m); t, b = ys.min(), ys.max(); H = b - t
    band_lo, band_hi = int(t + H * 0.14), int(t + H * 0.30)
    ext = [(np.where(m[y])[0].min(), np.where(m[y])[0].max()) for y in range(band_lo, band_hi + 1) if m[y].any()]
    lo, hi = min(e[0] for e in ext), max(e[1] for e in ext); hw = hi - lo
    # head top = first row that is at least 45% as wide as the head (skips a thin ponytail tip or hair tuft)
    top = t
    for y in range(t, band_lo + 1):
        if m[y].any() and np.ptp(np.where(m[y])[0]) >= 0.45 * hw: top = y; break
    return (lo + hi) / 2, top, hw

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--id'); ap.add_argument('--name'); ap.add_argument('--blurb', default=''); ap.add_argument('--walk')
    ap.add_argument('--price', type=int); ap.add_argument('--cols', type=int, default=6); ap.add_argument('--rows', type=int, default=4)
    ap.add_argument('--rebuild', action='store_true', help='only regenerate the SQL from chars.json')
    o = ap.parse_args()
    data = json.load(open(JSON_PATH, encoding='utf-8')) if os.path.exists(JSON_PATH) else {'characters': []}
    if o.rebuild: return save(data)
    if not (o.id and o.name and o.walk): ap.error('need --id, --name and --walk')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', o.id): sys.exit('--id: lowercase letters, digits and dashes only')
    im = Image.open(o.walk)
    a, fg = foreground(im)
    frames = find_frames(fg, o.cols, o.rows)
    a = defringe(a, fg)
    rgba = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
    # one scale for the whole character
    heights = [np.ptp(np.where(m.any(1))[0]) for m in frames.values()]
    s = TARGET_H / float(np.median(heights))
    crops = {}
    for (r, c), m in frames.items():
        hx, htop, hw = head_metrics(m)
        ys, xs = np.where(m); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        sub = rgba.crop((x0, y0, x1, y1)); mk = Image.fromarray((m[y0:y1, x0:x1] * 255).astype(np.uint8))
        sub.putalpha(Image.fromarray(np.minimum(np.array(sub.getchannel('A')), np.array(mk)).astype(np.uint8)))
        sub = sub.resize((max(1, round(sub.width * s)), max(1, round(sub.height * s))), Image.LANCZOS)
        crops[(r, c)] = dict(img=sub, hx=(hx - x0) * s, htop=(htop - y0) * s, hw=hw * s, h=sub.height)
    # idle frame per row = the walk frame (2nd or 5th) with the feet closest together
    def spread(cr):
        al = np.array(cr['img'].getchannel('A')) > 40; lo = al[int(al.shape[0] * 0.82):]
        xs = np.where(lo.any(0))[0]; return xs.max() - xs.min()
    sheet = Image.new('RGBA', (FW * 7, FH * 4), (0, 0, 0, 0))
    head = {}
    for r in range(4):
        idle = min((1, 4), key=lambda c: spread(crops[(r, c)]))
        order = [crops[(r, idle)]] + [crops[(r, c)] for c in range(6)]
        tops, hws = [], []
        for k, cr in enumerate(order):
            x = round(CX - cr['hx']); y = FEET - cr['h']
            if x < 0 or x + cr['img'].width > FW: sys.exit(f'row {r + 1}: a frame is wider than {FW}px after scaling; use a sheet with the figures smaller')
            sheet.alpha_composite(cr['img'], (k * FW + x, r * FH + y)); tops.append(y + cr['htop']); hws.append(cr['hw'])
        head[ROWS[r]] = dict(top=int(round(float(np.median(tops)))), w=int(round(float(np.median(hws)))))
    os.makedirs(OUT_DIR, exist_ok=True); os.makedirs(PREVIEW_DIR, exist_ok=True)
    sheet.save(os.path.join(OUT_DIR, o.id + '.png'), optimize=True)
    prev = Image.new('RGBA', sheet.size, (58, 107, 209, 255)); prev.alpha_composite(sheet); prev.convert('RGB').save(os.path.join(PREVIEW_DIR, o.id + '.png'))
    chars = {c['id']: c for c in data['characters']}
    old = chars.get(o.id, {})
    price = o.price if o.price is not None else old.get('price', 150 + 50 * len(chars))
    chars[o.id] = dict(id=o.id, name=o.name, blurb=o.blurb or old.get('blurb', ''), price=price, head=old.get('head_override', head) if False else head)
    order_ids = [c['id'] for c in data['characters']] + ([o.id] if o.id not in {c['id'] for c in data['characters']} else [])
    data['characters'] = [chars[i] for i in order_ids]
    save(data)
    print(f'{o.id}: scale {s:.2f}, head {head}')

def save(data):
    os.makedirs(OUT_DIR, exist_ok=True)
    json.dump(data, open(JSON_PATH, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    q = lambda t: "'" + t.replace("'", "''") + "'"
    rows = [f"({q('char_' + c['id'])},'character',{q(c['name'])},{int(c['price'])},null,1,{q(json.dumps({'char': c['id']}, separators=(',', ':')))}::jsonb,{200 + i},true)" for i, c in enumerate(data['characters'])]
    keys = ','.join(q('char_' + c['id']) for c in data['characters']) or "''"
    sql = f"""-- Generated by tools/build_character.py from public/monster-quest/chars/chars.json. Safe to re-run any time.
begin;
insert into public.mq_cosmetics (key, slot, name, price_coins, price_gems, unlock_level, data, sort, active) values
{",\n".join(rows)}
on conflict (key) do update set slot=excluded.slot, name=excluded.name, price_coins=excluded.price_coins, price_gems=excluded.price_gems,
  unlock_level=excluded.unlock_level, data=excluded.data, sort=excluded.sort, active=true;
-- characters that are no longer in the list are retired; their owners pick a free new first explorer
update public.mq_cosmetics set active = false where slot = 'character' and key not in ({keys});
delete from public.mq_player_cosmetics pc using public.mq_cosmetics c where c.key = pc.cosmetic_key and c.slot = 'character' and not c.active;
update public.mq_players set outfit = outfit - 'character'
  where outfit ? 'character' and not exists (select 1 from public.mq_cosmetics c where c.key = outfit->>'character' and c.active);
grant execute on all functions in schema public to authenticated;
commit;
"""
    open(SQL_PATH, 'w', encoding='utf-8').write(sql)
    print(f"chars.json: {len(data['characters'])} characters; SQL written to {os.path.normpath(SQL_PATH)}")

if __name__ == '__main__':
    main()
