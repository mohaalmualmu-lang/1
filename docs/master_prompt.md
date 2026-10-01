Turn my course material into an interactive study website that makes me understand AND remember everything in it. My files are the only source of truth: anything in them can come up on the exam, so nothing may be skipped, shortened away, or replaced with outside knowledge. Work in phases with checkpoints and don't skip ahead.

MY CONTEXT (fill in)
* Subject / chapter: [ ]
* Exam format: [e.g. mostly 4-option MCQ + some short answer / case vignettes / OSCE]
* Exam date: [ ]
* What the instructor emphasized: [ ]
* Which file is the instructor's own deck (if any): [ ]
* I'm a [BSc EMS] student. The site is in English. Chat with me in [Arabic].
* I may upload files across several messages. Don't start until I write GO.

====================================================================
PHASE 1 — READ EVERYTHING (exhaustive, nothing skipped)
====================================================================
1. Get the page count of every file first. Extract all text page by page AND rasterize every page and look at it, in batches, so nothing hidden in images is missed: text inside slide images, tables pasted as pictures, labels on diagrams, ECGs/X-rays/photos, handwritten notes, speaker notes, captions, links, video URLs.
2. Transcribe every table word for word (zoom in on table images until every cell is readable). Record every label baked into every figure.
3. When two files cover the same topic, merge them as a UNION: keep every point that appears in either file, and record which file each point came from.
4. Write the inventory to a file in the repo (docs/inventory.md), organized by topic, with the slide reference (e.g. "A12, B19") on every line. It must contain every:
   - topic and sub-topic, definition, list item (all of them, in the source order)
   - number, percentage, dose, threshold, time, angle, count ("3 regions", "5 parts")
   - classification and sequence/pathway
   - entity (disease, drug, procedure, device, anatomical structure, sign)
   - table (verbatim), figure (with all its labels), photo, case, mnemonic, link
   - instructor-only additions (things only in the instructor's deck), marked ★
   Also list non-examinable slides (title, break, memes, decorative) so I can confirm they're safe to drop.
5. Extract every embedded image from the files (not just page screenshots) and keep the useful ones for the site.

====================================================================
PHASE 2 — PROPOSE, THEN STOP
====================================================================
Design for THIS material, not a template from another subject. Send a plan in short sections:
1. Coverage map: every topic with counts (e.g. "2 tables, 18 conditions, 27 numbers, 25 figures") so I can spot gaps.
2. Modules: what each covers, why this split fits the content, ordered so each builds on the last.
3. Entity cards: entity types and the fields each card needs.
4. Interactives per module: what I will DO, tied to a specific concept. Say which one or two teach the most.
5. Question plan: types and counts per module matched to my exam format (plus short-answer items if the exam has any).
6. Illustrations I'll need (purpose + where they go).
7. Conflicts: (a) between my files, (b) between my files and standard references. Keep my version for the exam, flagged ⚑. Never silently pick one.
8. Questions for me: only ones that change the build, max 3 (e.g. which deck is the instructor's, may slide images be used).
Then STOP and wait for my approval.

====================================================================
PHASE 3 — HOME + ONE MODULE FIRST
====================================================================
Build the home screen, the full engine, and Module 1 completely; publish; wait for my feedback so style/structure changes happen once.

====================================================================
PHASE 4 — FULL BUILD (once I approve, work straight through without stopping unless truly blocked)
====================================================================
Build all remaining modules and tools, run QA + coverage audit, publish to the SAME artifact link.

====================================================================
PHASE 5 — ILLUSTRATIONS (alongside Phase 4)
====================================================================
Prompts for an external image AI: natural descriptive paragraphs, one image per prompt, each ending with the same style block. Every prompt requires: one single illustration (never a grid/contact sheet); ≥1600 px long side; plain white background, no fake checkerboard; nothing cut off; NO text/labels/letters/numbers anywhere; the clinical must-haves spelled out (counts, locations, exactly what differs between panels); a file name. Ask for 2 test images first to lock the style. When images come back, check resolution, background, stray text and accuracy against my material; reject with exact "keep this image, change only X" fixes; integrate accepted ones compressed with a "what to notice" caption and republish.

====================================================================
CONTENT STANDARDS (accuracy first)
====================================================================
* My files are the source of truth. Never invent facts. Anything added from outside (a definition the slides only label, a "why", an example) goes in a clearly marked "Beyond your notes" box.
* EVERY inventory item must appear in the site: every list item, every number, every table row, every figure label, every instructor addition. Keep wording close to the notes for anything examinable (definitions, lists, numbers, drug actions, "do / don't" rules).
* Every card shows its source slides. Flag conflicts ⚑ on the card and in related questions.
* One idea per card (~70 words), key terms highlighted, numbers styled distinctly, plain language.
* Learning science: ask before showing ("think first" reveals), questions right after the idea they test, spacing (flashcards), interleaving (mixed review), a visual for every big idea, concrete clinical examples, the "why" not just the "what".
* Each module ends with: lock-in round (re-ask misses until right), recall screen (write lists from memory, reveal, self-mark; misses go to the front of flashcards), memory hooks, Arabic summary (English exam terms kept).

QUESTION STANDARDS
* Match my exam format and difficulty; mix recall / understanding / application (clinical vignettes "what next?").
* Every question answerable from my material, with its source slide.
* Explanation says why the right answer is right AND why the most tempting wrong option is wrong (every question has a real "trap" option).
* Plausible same-category distractors, no "all/none of the above", answers shuffled each time, correct option not reliably the longest.
* Questions that test every list, every number and every table row; "NOT/EXCEPT" items for lists; image questions for figures and photos.
* Short-answer items (if my exam has them) with a model answer and key points; graded by Claude when the page can call Claude, otherwise self-marked against the checklist.

====================================================================
INTERACTIVES (make it beautiful and hands-on; this is what makes it stick)
====================================================================
Use the material's own figures wherever possible:
* Tap-to-label on every anatomy/diagram figure: erase the labels baked into the slide images (fill boxes with the surrounding color), then redraw them as HTML chips (EN/Arabic toggle) and quiz mode ("Find: X" → tap the dot). Dense figures use numbered dots + legend; zoom button below the figure (never covering a label).
* Route/sequence builders: tap stations in order while an animated marker travels the real path on the figure (any pathway, flow or process in the material).
* 3D models (three.js r128 from cdnjs, lazy-loaded, text fallback): rotate with drag, pinch zoom, tap a part to name it, a slider that changes the state (cut open, twist, inflate, block...), mini "find the part" quiz.
* Simulators with live animation tied to a concept: e.g. a monitor whose trace changes with a slider, a flow model you can block in different places, a device you can mishandle and see the consequence, a calculator for thresholds in the notes. Treatments in a simulator must behave exactly as the notes say (including cautions/contraindications).
* Clinical case engine: step-by-step vignette with vitals, images, and a decision at each step; include any case from my slides.
* Sort / match / compare-two-pictures games; scenario "triage" drills for every table of management rules (one card per row).
Every interactive records completion; "Skip for now" is allowed but marked.

====================================================================
TOOLS EVERY SITE GETS
====================================================================
* Global search over cards, questions, figure labels, flashcards, hooks, entities, numbers; each result shows where it lives and jumps there.
* Setting: questions inline or all at the end of each module; theme; sound; figure-label language.
* Flashcards with spaced repetition (1/3/7/16/35 days, misses come back first), due count on the home screen.
* Exam builder: length, module selection, optional timer, instant or end feedback, optional short answers, results weakest-first with one-tap drill, review of misses, and a mixed interleaved review weighted to my weak areas and mistakes.
* My mistakes (stay until answered right), numbers drill (every number in the files, with source), searchable cheat sheet (every list and table).
* Entity hub with side-by-side compare and a "which one is it?" quiz.
* Visual lab: every figure, photo, ECG and interactive in one gallery, full screen, plus a picture quiz.
* Arabic summary per module (reachable inside each module) and as one page.
* If the published page can call Claude: "Explain differently" on every card (simpler / patient example / in Arabic, staying within the card's facts) and Claude grading of short answers.

DESIGN
Dark clinical aesthetic with an equally intentional light mode. Teal/cyan = correct/primary, amber = key terms, coral = danger/wrong. A signature detail from the subject's own world (e.g. a vitals-monitor status strip). Mobile-first at 360 px, 44 px+ tap targets, safe-area insets, sticky bottom navigation, reduced-motion respected. Tapping any figure opens it full screen.

TECHNICAL
* One self-contained HTML file: inline CSS/JS, images as compressed WebP data URIs, external scripts only from cdnjs (three.js lazy-loaded). Aim under ~2 MB.
* Progress in localStorage inside try/catch.
* Source split into parts with a build script (content per module, engine files, figure-label JSON, image-prep script) and committed to the repo so later edits are small and safe.
* Every update republishes to the same link.

QA BEFORE EVERY PUBLISH
* Headless browser script: click through every step of every module and complete every interactive automatically, open every tool, at 360 px in both themes: no console errors, no horizontal overflow, every interactive mounts and completes, audio at a sane level. (If cdnjs is blocked in your sandbox, route three.js from a local npm copy for testing.)
* Automated coverage audit: a script checks every Phase 1 inventory item (terms, numbers, list items, table rows, figure labels) against the built file and must reach 100%; list anything missing and fix it before publishing.
* Look at screenshots of every new interactive before publishing.
* Then a short summary: what's inside (counts), what changed, what's flagged.

CONTINUITY
At the end of each phase give a short handoff note: what's built, the artifact link, repo branch/files, key decisions, what's next. If the chat gets long I'll start a new one with the note and the link; read the published artifact and the repo back in and continue.

Wait for my files and my GO.
