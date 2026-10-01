"""Prepare figures: erase baked-in labels (boxes from src/figs.json), resize, save WebP.

Usage: python3 site/tools/prep_images.py [--check]
--check also writes *_check.png with the erased boxes outlined (for eyeballing).
"""
import json, sys
from collections import Counter
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "raw"
OUT = ROOT / "assets" / "img"
FIGS = json.loads((ROOT / "src" / "figs.json").read_text())
EXTRA = json.loads((ROOT / "src" / "images.json").read_text()) if (ROOT / "src" / "images.json").exists() else {}


def border_color(im, box):
    x0, y0, x1, y1 = box
    px = im.load()
    W, H = im.size
    cols = []
    for x in range(max(0, x0 - 3), min(W, x1 + 3)):
        for y in (max(0, y0 - 3), min(H - 1, y1 + 2)):
            cols.append(px[x, y])
    for y in range(max(0, y0 - 3), min(H, y1 + 3)):
        for x in (max(0, x0 - 3), min(W - 1, x1 + 2)):
            cols.append(px[x, y])
    # quantize so near-identical colors vote together
    q = Counter((r // 8, g // 8, b // 8) for r, g, b in cols)
    (qr, qg, qb), _ = q.most_common(1)[0]
    pick = [c for c in cols if (c[0] // 8, c[1] // 8, c[2] // 8) == (qr, qg, qb)]
    n = len(pick)
    return tuple(sum(c[i] for c in pick) // n for i in range(3))


def main(check=False):
    OUT.mkdir(parents=True, exist_ok=True)
    for key, fig in FIGS.items():
        im = Image.open(RAW / fig["src"]).convert("RGB")
        W, H = im.size
        d = ImageDraw.Draw(im)
        boxes = []
        for lab in fig.get("labels", []):
            x0, y0, x1, y1 = lab["box"]
            b = (int(W * x0 / 100), int(H * y0 / 100), int(W * x1 / 100) + 1, int(H * y1 / 100) + 1)
            d.rectangle(b, fill=tuple(lab["fill"]) if "fill" in lab else border_color(im, b))
            boxes.append(b)
        w = fig.get("w", 900)
        if W > w:
            im = im.resize((w, round(H * w / W)), Image.LANCZOS)
        im.save(OUT / f"{key}.webp", "WEBP", quality=74, method=6)
        if check:
            c = im.copy()
            cd = ImageDraw.Draw(c)
            s = c.size[0] / W
            for b in boxes:
                cd.rectangle([v * s for v in b], outline=(255, 0, 0), width=2)
            c.save(ROOT.parent / ".check" / f"{key}_check.png") if (ROOT.parent / ".check").exists() else None
        print(key, im.size, (OUT / f"{key}.webp").stat().st_size // 1024, "KB")
    for key, spec in EXTRA.items():
        im = Image.open(RAW / spec["src"]).convert("RGB")
        if "crop" in spec:
            W, H = im.size
            x0, y0, x1, y1 = spec["crop"]
            im = im.crop((int(W * x0 / 100), int(H * y0 / 100), int(W * x1 / 100), int(H * y1 / 100)))
        W, H = im.size
        w = spec.get("w", 900)
        if W > w:
            im = im.resize((w, round(H * w / W)), Image.LANCZOS)
        im.save(OUT / f"{key}.webp", "WEBP", quality=spec.get("q", 74), method=6)
        print(key, im.size, (OUT / f"{key}.webp").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main("--check" in sys.argv)
