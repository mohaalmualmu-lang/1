"""Build the single-file study site: site/dist/index.html

Parts (edit these, then rebuild):
  src/head.html            title + font links
  src/styles.css           all styles
  src/figs.json            figure labels (boxes erased from images) and routes
  assets/img/*.webp        compressed figures (made by tools/prep_images.py)
  src/content/*.js         modules.js first, then one file per module
  src/js/*.js              engine, in the order listed in JS below
"""
import base64, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
JS = ["core.js", "ix.js", "ix2.js", "quiz.js", "views.js", "tools.js", "main.js"]


def main():
    head = (SRC / "head.html").read_text()
    css = (SRC / "styles.css").read_text()
    figs = json.loads((SRC / "figs.json").read_text())
    imgs = {}
    for p in sorted((ROOT / "assets" / "img").glob("*.webp")):
        imgs[p.stem] = "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode()
    content = [(SRC / "content" / "modules.js").read_text()]
    content += [p.read_text() for p in sorted((SRC / "content").glob("m*.js")) if p.name != "modules.js"]
    content.append((SRC / "content" / "tools.js").read_text())
    js = [(SRC / "js" / n).read_text() for n in JS]
    out = "\n".join([
        head.strip(),
        "<style>\n" + css + "\n</style>",
        '<div id="app"></div>',
        "<script>\n" + (SRC / "vendor" / "read-aloud.js").read_text().replace("</script", "<\\/script") + "\n</script>",
        "<script>",
        "const FIGS = " + json.dumps(figs, ensure_ascii=False) + ";",
        "const IMG = " + json.dumps(imgs) + ";",
        *content,
        *js,
        "</script>",
    ])
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    (dist / "index.html").write_text(out)
    print(f"dist/index.html  {len(out.encode())/1024:.0f} KB  ({len(imgs)} images)")


if __name__ == "__main__":
    main()
