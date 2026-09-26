# Renal & GU Emergencies — study site (Chapter 22)

Published artifact: https://claude.ai/artifact/Bi3XZx25nRECWYiSGdaAng

## Layout
- `src/head.html`, `src/styles.css` — page head and all styles
- `src/figs.json` — figure labels (erased from the images, redrawn by the site) and drop routes
- `src/content/modules.js` — module catalogue; `src/content/mN.js` — one file per module
- `src/js/` — engine: `core` (state, storage, sound, Claude), `ix` (label/order/sort/match), `ix2` (3D kidney & torsion via lazy three.js r128, ECG, AKI flow, Foley, dialysis, triage cases, regions, compare, urine output), `quiz`, `views`, `tools` (exam, numbers, cheat sheet, entity hub, visual lab), `main`
- `src/content/tools.js` — entities, numbers and picture-quiz data; `src/images.json` — photos without labels
- `assets/raw/` — source images cropped from the slide decks; `assets/img/` — processed WebP

## Commands
```
python3 site/tools/prep_images.py          # erase labels + compress figures
python3 site/tools/build.py                # -> site/dist/index.html
python3 site/tools/audit.py               # coverage audit vs docs/inventory.md
THREE_JS=/path/to/three.min.js NODE_PATH=$(npm root -g) node site/tools/qa.js --shots .check/shots   # headless QA, 360px, both themes
# THREE_JS: local copy of three.js r128 (npm pack three@0.128.0) because cdnjs is blocked in the sandbox
```
