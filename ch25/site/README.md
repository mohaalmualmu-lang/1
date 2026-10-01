# Hematologic Emergencies: study site (Chapter 25)

Published artifact: https://claude.ai/artifact/TQbU2H6AuYPGUJXEk5uAix

Sources: `ch25/docs/inventory.md` (A = SLID_CH25.pptx with speaker notes, B = Hematologic__notes.pdf).

## Layout
- `src/head.html`, `src/styles.css`: page head and all styles (dark-first, light mode)
- `src/figs.json`: figure labels (erased from the images, redrawn by the site); `src/images.json`: photos/tables used as-is
- `src/content/modules.js`: module catalogue, VIZ blocks, Table 25-1 data (`T251`, `t251()`)
- `src/content/mN.js`: one file per module; `src/content/tools.js`: entities, numbers, picture quiz, tables, gallery names
- `src/js/`: engine: `core`, `ix` (label/order/sort/match), `ix2` (3D stage + 3D sickle vessel, case engine, compare, tube, CBC analyzer, table drill, hematocrit flow model, cascade blocker, DIC stages, blood bank, transfusion monitor), `quiz`, `views`, `tools`, `main`
- `../docs/illustration_prompts.md`: Phase 5 prompts for the image AI
- `assets/raw/`: images extracted from the deck; `assets/img/`: processed WebP

## Commands
```
python3 ch25/site/tools/prep_images.py     # erase labels + compress figures
python3 ch25/site/tools/build.py           # -> ch25/site/dist/index.html
python3 ch25/site/tools/audit.py           # coverage audit vs the inventory (built modules must be 100%)
THREE_JS=/path/to/three.min.js NODE_PATH=$(npm root -g) node ch25/site/tools/qa.js --shots /tmp/shots   # headless QA at 360px, both themes
# THREE_JS: local three.js r128 (npm pack three@0.128.0) for the 3D step; ONLY=m7,m8 limits QA to some modules
```
