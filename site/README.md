# Renal & GU Emergencies — study site (Chapter 22)

Published artifact: https://claude.ai/artifact/Bi3XZx25nRECWYiSGdaAng

## Layout
- `src/head.html`, `src/styles.css` — page head and all styles
- `src/figs.json` — figure labels (erased from the images, redrawn by the site) and drop routes
- `src/content/modules.js` — module catalogue; `src/content/mN.js` — one file per module
- `src/js/` — engine: `core` (state, storage, sound, Claude), `ix` (interactives), `quiz`, `views`, `main`
- `assets/raw/` — source images cropped from the slide decks; `assets/img/` — processed WebP

## Commands
```
python3 site/tools/prep_images.py          # erase labels + compress figures
python3 site/tools/build.py                # -> site/dist/index.html
NODE_PATH=$(npm root -g) node site/tools/qa.js --shots .check/shots   # headless QA, 360px, both themes
```
