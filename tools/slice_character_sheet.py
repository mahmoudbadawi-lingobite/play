#!/usr/bin/env python3
"""
Cut a generated explorer sheet into the 9 game frames.

Sheet layout (3 columns x 3 rows, equal cells):
    row 1 = facing the camera   (down0 down1 down2)   col 1 = standing, col 2/3 = walk steps
    row 2 = facing RIGHT        (side0 side1 side2)
    row 3 = seen from behind    (up0   up1   up2)

Usage:  python3 tools/slice_character_sheet.py sheet.png boy
Output: public/monster-quest/players/boy/{down,side,up}{0,1,2}.png  (260x232, feet on line 222, transparent)

Needs Pillow (pip install pillow). Works with a transparent sheet or a flat background colour (white, green, magenta...).
"""
import sys, os
from collections import deque
from PIL import Image

W, H, FEET = 260, 232, 222
HEAD_ROOM = 8

def remove_bg(im, tol=48):
    im = im.convert('RGBA'); px = im.load(); w, h = im.size
    if min(px[x, y][3] for x in (0, w - 1) for y in (0, h - 1)) < 20:  # already transparent
        return im
    bg = px[0, 0][:3]
    close = lambda c: sum(abs(c[i] - bg[i]) for i in range(3)) <= tol * 3 // 2
    seen = bytearray(w * h); q = deque()
    for x in range(w):
        for y in (0, h - 1): q.append((x, y))
    for y in range(h):
        for x in (0, w - 1): q.append((x, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y * w + x]: continue
        seen[y * w + x] = 1
        if not close(px[x, y][:3]): continue
        px[x, y] = (0, 0, 0, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return im

def main():
    if len(sys.argv) < 3: sys.exit(__doc__)
    sheet, cid = sys.argv[1], sys.argv[2]
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'monster-quest', 'players', cid)
    os.makedirs(out, exist_ok=True)
    im = remove_bg(Image.open(sheet))
    cw, ch = im.width // 3, im.height // 3
    cells = {}
    for r, name in enumerate(('down', 'side', 'up')):
        for c in range(3):
            cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            bb = cell.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
            if not bb: sys.exit(f'row {r+1} column {c+1} is empty - check the sheet is a 3x3 grid')
            cells[(name, c)] = cell.crop(bb)
    # one scale for all nine frames so the explorer never changes size while walking
    k = min((FEET - HEAD_ROOM) / max(f.height for f in cells.values()), (W - 10) / max(f.width for f in cells.values()))
    for (name, c), f in cells.items():
        f = f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.LANCZOS)
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        canvas.paste(f, ((W - f.width) // 2, FEET - f.height), f)
        canvas.save(os.path.join(out, f'{name}{c}.png'))
    print('wrote 9 frames to', os.path.normpath(out))

if __name__ == '__main__':
    main()
