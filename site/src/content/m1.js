/* ===== Module 1 · Foundations ===== */
CONTENT.m1 = {
  intro: 'Everything later in this chapter (stones, AKI, dialysis, torsion) is a problem somewhere along one route: blood in, urine out. Learn the route once here and every later module will make sense.',
  steps: [
    /* --- 1. What the system does --- */
    { t: 'card', id: 'm1c1', title: 'Four jobs of the urinary system', src: 'A2, B2',
      predict: { q: 'The urinary system has four jobs. How many can you name before reading?', a: 'Filter wastes · electrolytes · acid-base · fluid volume & blood pressure' },
      body: ['The urinary system is the body’s <k>filter and balancer</k>. It does four jobs: it <k>filters blood and removes metabolic wastes</k>, <k>manages electrolyte concentrations</k>, <k>maintains acid-base balance</k> in the bloodstream, and <k>regulates fluid volume and blood pressure</k>.',
        'Why this matters on a call: when the kidneys fail, all four jobs fail together. That is why an untreated acute kidney injury leads to <k>volume overload</k>, <k>hyperkalemia</k>, <k>uremia</k> and <k>metabolic acidosis</k>.'],
      viz: 'jobs' },
    { t: 'ix', id: 'm1x1', kind: 'match', title: 'What breaks when each job fails?',
      intro: 'Match each kidney job with the AKI complication that appears when that job fails.',
      spec: { prompt: 'Tap a job, then the complication it prevents', pairs: [
        ['Filters blood, removes metabolic wastes', 'Nitrogenous wastes build up (uremia)'],
        ['Manages electrolyte concentrations', 'Potassium climbs (hyperkalemia)'],
        ['Maintains acid-base balance', 'Acid builds up (metabolic acidosis)'],
        ['Regulates fluid volume and blood pressure', 'Fluid is retained (volume overload, edema)'],
      ] } },
    { t: 'q', q: { id: 'm1q1', lv: 'R', src: 'A2, B2', stem: 'Which of the following is <b>NOT</b> a function of the urinary system in your notes?',
      opts: ['Storing bile for fat digestion', 'Maintaining acid-base balance in the blood', 'Regulating fluid volume and blood pressure', 'Managing concentrations of electrolytes'],
      why: 'Bile storage belongs to the gallbladder. The urinary system’s four jobs are: filter blood and remove metabolic wastes, manage electrolytes, maintain acid-base balance, and regulate fluid volume and blood pressure.',
      trap: [2, 'Blood pressure sounds like a heart job, but your notes list “regulates fluid volume and blood pressure” as a urinary function.'] } },
    { t: 'q', q: { id: 'm1q2', lv: 'A', src: 'A2, A39', stem: 'A patient with untreated acute kidney injury now has a dangerously high potassium level. Which kidney job has failed?',
      opts: ['Managing electrolyte concentrations', 'Maintaining acid-base balance', 'Regulating fluid volume', 'Removing metabolic wastes'],
      why: 'Potassium is an electrolyte. Hyperkalemia means the kidney can no longer manage electrolyte concentrations.',
      trap: [1, 'Acid-base failure causes metabolic acidosis. It often appears alongside hyperkalemia in AKI, but it is a different job.'] } },

    /* --- 2. Disorders and numbers --- */
    { t: 'card', id: 'm1c2', title: 'Four kinds of renal disorder', src: 'A3, B3',
      body: ['Your notes list four types of renal disorder: <k>kidney failure</k> (the most common), <k>nephrolithiasis</k>, <k>urinary tract infections (UTIs)</k>, and <k>noncancerous enlargement of the prostate</k>.',
        'Nephrolithiasis has three names you must recognise: <em>nephrolithiasis = kidney stones = renal calculi</em>. UTIs affect about <n>50%</n> of all women. The prostate problem is <k>benign prostatic hypertrophy (BPH)</k>, covered in Module 8.'],
      flag: 'File A says “kidney failure (most common)”. File B says “kidney disease” and adds “UTIs 50% of all women”. Both are kept here.' },
    { t: 'card', id: 'm1c3', title: 'Chronic kidney disease in numbers', src: 'B4',
      predict: { q: 'Guess: what share of adults over 70 have CKD?', a: 'More than half.' },
      body: ['CKD affects more than <n>5–10%</n> of the world’s population and <k>more than half of adults older than 70</k>. In <k>Saudi Arabia</k> the figure is <n>6.5%</n>.',
        'What this means in the field: an older patient you see for a fall or chest pain may also have CKD, and that shapes how you think about their fluids, potassium and heart. CKD itself is Module 6.'],
      viz: 'ckd' },
    { t: 'q', q: { id: 'm1q3', lv: 'R', src: 'A3, B3', stem: '“Nephrolithiasis” is another name for:',
      opts: ['Kidney stones', 'A kidney infection', 'Kidney failure', 'Kidney swelling from backed-up urine'],
      why: 'Nephrolithiasis = kidney stones = renal calculi. “Lith” means stone.',
      trap: [3, 'That is hydronephrosis: swelling caused when a stone blocks urine flow. It is a result of the stone, not the stone itself.'] } },
    { t: 'q', q: { id: 'm1q4', lv: 'R', src: 'A3', stem: 'According to your notes, which renal disorder is the <b>most common</b>?',
      opts: ['Kidney failure', 'Urinary tract infection', 'Kidney stones', 'Enlarged prostate'],
      why: 'File A labels kidney failure as the most common type of renal disorder.',
      trap: [1, 'UTIs are very common (about 50% of women), but the notes name kidney failure as the most common renal disorder.'] } },
    { t: 'q', q: { id: 'm1q5', lv: 'R', src: 'B4', stem: 'The prevalence of chronic kidney disease in Saudi Arabia given in your notes is:',
      opts: ['6.5%', '5–10%', '20%', '50%'],
      why: 'Your notes give 6.5% for Saudi Arabia.',
      trap: [1, '“More than 5–10%” is the worldwide figure, not the Saudi one.'] } },
    { t: 'q', q: { id: 'm1q6', lv: 'R', src: 'B3, B4', stem: 'Which pairing of number and fact is correct?',
      opts: ['UTIs: about 50% of all women', 'CKD: about 50% of Saudi adults', 'UTIs: about 6.5% of all women', 'CKD: about 20% of adults over 70'],
      why: 'UTIs affect about 50% of all women. CKD affects more than half of adults over 70, and 6.5% in Saudi Arabia.',
      trap: [3, 'The over-70 figure is “more than half”, not 20%.'] } },

    /* --- 3. Four organs --- */
    { t: 'card', id: 'm1c4', title: 'The four organs, in line', src: 'A4, B5', fig: 'urinary_system',
      cap: 'Follow the ureters: two of them, one from each kidney, both ending in the single bladder. The urethra is the only exit.',
      body: ['Urine is made and moved by four organs in a line: <k>kidneys</k> → <k>ureters</k> → <k>urinary bladder</k> → <k>urethra</k>. The kidneys filter blood and make urine, the ureters carry it down, the bladder stores it, and the urethra carries it out.',
        'One detail from your notes: the <k>urethra is shorter in females than in males</k>.'],
      beyond: 'A shorter urethra gives bacteria a shorter trip to the bladder. This helps explain why UTIs are more common in women.' },
    { t: 'ix', id: 'm1x2', kind: 'label', title: 'Label the urinary system', intro: 'Tap the dot that matches each name.', spec: { fig: 'urinary_system' } },
    { t: 'q', q: { id: 'm1q7', lv: 'R', src: 'A4, B5', stem: 'Which structure carries urine from each kidney to the urinary bladder?',
      opts: ['Ureter', 'Urethra', 'Renal pelvis', 'Collecting duct'],
      why: 'There are two ureters, one from each kidney, and both drain into the bladder.',
      trap: [1, 'The urethra carries urine OUT of the bladder. Ureters come in a pair; the urethra is the single exit.'] } },
    { t: 'q', q: { id: 'm1q8', lv: 'R', src: 'A4', stem: 'Which statement about the urethra appears in your notes?',
      opts: ['It is shorter in females than in males', 'It is longer in females than in males', 'It carries urine from the kidneys to the bladder', 'In males it carries only urine'],
      why: 'The notes say the urethra is shorter in females than in males.',
      trap: [3, 'In males the urethra is shared: it carries urine, semen and other secretions.'] } },

    /* --- 4. Kidney regions --- */
    { t: 'card', id: 'm1c5', title: 'Inside the kidney: three regions', src: 'A5, B6', fig: 'kidney_regions',
      cap: 'Outer pink rim = cortex. Striped cones = medulla. Grey branching funnel = calyces draining into the pelvis.',
      predict: { q: 'The kidney’s inside is divided into three regions. Name them from outside to inside.', a: 'Cortex → medulla → renal pelvis.' },
      body: ['Cut a kidney in half and you see <k>three regions</k>: the outer <k>cortex</k>, the middle <k>medulla</k>, and the inner <k>renal pelvis</k>.',
        'Urine drips from the medulla into small cups called <k>minor calyces</k>. These merge into <k>major calyces</k>, which empty into the pelvis. The pelvis funnels urine into the ureter. Remember the pelvis: <k>kidney stones originate in the renal pelvis</k> (Module 4).'] },
    { t: 'ix', id: 'm1x3', kind: 'label', title: 'Label the kidney regions', intro: 'Find each region and cup on the cut kidney.', spec: { fig: 'kidney_regions' } },
    { t: 'q', q: { id: 'm1q9', lv: 'R', src: 'A5, B6', stem: 'The three internal regions of the kidney are the:',
      opts: ['Cortex, medulla and pelvis', 'Cortex, medulla and hilum', 'Capsule, cortex and medulla', 'Cortex, pyramid and calyx'],
      why: 'Your notes: internal anatomy is divided into three regions: cortex, medulla and (renal) pelvis.',
      trap: [2, 'The capsule is the outer covering, not one of the three internal regions.'] } },
    { t: 'q', q: { id: 'm1q10', lv: 'R', src: 'A30, B33', stem: 'Kidney stones originate in the:',
      opts: ['Renal pelvis', 'Renal cortex', 'Urinary bladder', 'Ureter'],
      why: 'The notes say stones originate in the renal pelvis, where urine collects before entering the ureter.',
      trap: [3, 'Stones often get stuck in the ureter and cause pain there, but they originate in the renal pelvis.'] } },

    /* --- 5. Detailed kidney map --- */
    { t: 'card', id: 'm1c6', title: 'The detailed kidney map', src: 'B9', fig: 'kidney_map',
      cap: 'Notice the vessels and the ureter all leave through one notch (the hilum), and that each striped pyramid points its tip (papilla) at a calyx.',
      body: ['The instructor’s slide names more parts. The <k>renal capsule</k> wraps the kidney. The medulla is built from cone-shaped <k>renal pyramids</k>, with strips of cortex called <k>renal columns</k> between them. Each pyramid’s tip is a <k>renal papilla</k>.',
        'The <k>renal hilum</k> is the notch where the <k>renal artery</k>, <k>renal vein</k> and ureter enter or leave. The central <k>renal sinus</k> holds the pelvis and calyces. One pyramid plus the cortex over it is a <k>renal lobe</k>.'],
      beyond: 'Your slide labels these parts but does not define them. The one-line roles here are standard anatomy.' },
    { t: 'ix', id: 'm1x4', kind: 'label', title: 'Label the kidney map', intro: '12 structures. Use the zoom button if the dots feel small.', spec: { fig: 'kidney_map' } },
    { t: 'ix', id: 'm1x11', kind: 'kidney3d', title: '3D kidney: cut it open', intro: 'Drag to rotate, pinch to zoom, and slide “Cut open” to slice the kidney. Then tap each part as it is named.', spec: {} },
    { t: 'q', q: { id: 'm1q11', lv: 'U', src: 'B9 (figure)', stem: 'On the kidney figure, the renal artery, renal vein and ureter all pass through the:',
      opts: ['Renal hilum', 'Renal sinus', 'Renal papilla', 'Renal column'],
      why: 'The hilum is the notch on the kidney’s inner border where vessels and the ureter enter and leave.',
      trap: [1, 'The renal sinus is the space inside the kidney behind the hilum; the hilum is the opening itself.'] } },

    /* --- 6. Nephron --- */
    { t: 'card', id: 'm1c7', title: 'The nephron: where urine is made', src: 'A6, B7', fig: 'nephron',
      cap: 'The pale band at the top is cortex and the orange band is medulla. See how the loop of Henle dives down into the medulla.',
      body: ['The <k>nephron</k> is the <k>structural and functional unit</k> of the kidney. It is the part that actually <k>forms urine</k>. Your notes place the nephrons <k>in the cortex</k>.',
        'Look at the figure, though: the filter and the twisted tubules sit in the cortex, while the loop of Henle dips into the medulla. On the exam, answer “cortex”, as your notes say.'],
      flag: 'Standard anatomy: nephrons span the cortex and the medulla, because the loop of Henle reaches into the medulla. Your notes say “in the cortex”. Use the notes’ wording on the exam.' },
    { t: 'card', id: 'm1c8', title: 'Five nephron parts, in order', src: 'A7, B8', fig: 'nephron', figLabels: ['glomerulus', 'bowman', 'pct', 'loop', 'dct', 'cd'],
      cap: 'Trace it with your finger: knot → cup → first coil → U-shaped loop → second coil → the long collecting duct.',
      predict: { q: 'Name the five nephron parts in the order fluid passes through them.', a: 'Glomerulus → Bowman capsule → PCT → loop of Henle → DCT.' },
      body: ['Your notes list five parts, in the order fluid passes through them: <k>glomerulus</k> → <k>glomerular (Bowman) capsule</k> → <k>proximal convoluted tubule (PCT)</k> → <k>loop of Henle</k> → <k>distal convoluted tubule (DCT)</k>.',
        'After the DCT, fluid drains into a <k>collecting duct</k>. “Proximal” means near the capsule and “distal” means far from it, so the PCT always comes first.'],
      hook: '<b>G</b>ood <b>B</b>oys <b>P</b>ee <b>L</b>ots <b>D</b>aily: Glomerulus, Bowman, PCT, Loop, DCT.' },
    { t: 'ix', id: 'm1x5', kind: 'order', title: 'Follow the filtrate', intro: 'Tap the parts in the order fluid passes through them. The drop shows where the fluid is.',
      spec: { fig: 'nephron', path: 'filtrate', items: ['glomerulus', 'bowman', 'pct', 'loop', 'dct', 'cd'], promptSmall: 'Filtrate route', prompt: 'Where does the fluid go next?', endText: 'From the collecting duct the fluid leaves as urine, heading for the papilla and the calyces.' } },
    { t: 'card', id: 'm1c9', title: 'The blood side of the nephron', src: 'A6, B10–B12 (figures)', fig: 'nephron', figLabels: ['afferent', 'efferent', 'vasa', 'macula', 'desc', 'asc', 'cmj'],
      cap: 'Red = blood arriving, blue = blood leaving. The vasa recta hug the loop of Henle like a ladder.',
      body: ['Blood reaches the glomerulus through the <k>afferent arteriole</k> and leaves through the <k>efferent arteriole</k>. Long capillaries called <k>vasa recta</k> run beside the loop of Henle.',
        'The loop has a <k>descending limb</k> going down and an <k>ascending limb</k> coming back up. Where the DCT touches the arterioles sits the <k>macula densa</k>.'],
      hook: '<b>A</b>fferent <b>A</b>rrives, <b>E</b>fferent <b>E</b>xits.',
      beyond: 'These structures are labelled on your slides but not described. The short roles given here are standard anatomy.' },
    { t: 'ix', id: 'm1x6', kind: 'label', title: 'Label the nephron', intro: 'Find each part on the nephron and its blood supply.', spec: { fig: 'nephron' } },
    { t: 'q', q: { id: 'm1q12', lv: 'R', src: 'A6, B7', stem: 'The structural and functional unit of the kidney that forms urine is the:',
      opts: ['Nephron', 'Renal pyramid', 'Renal lobe', 'Glomerulus'],
      why: 'Your notes: nephrons are the structural and functional units that form urine.',
      trap: [3, 'The glomerulus is only one part of the nephron: the filter at its start.'] } },
    { t: 'q', q: { id: 'm1q13', lv: 'R', src: 'A6, B7', stem: 'According to your notes, the nephrons are located in the:',
      opts: ['Cortex', 'Medulla', 'Renal pelvis', 'Renal sinus'],
      why: 'Your notes state: “Nephrons: in the cortex”.',
      trap: [1, 'The loop of Henle does dip into the medulla, but the notes’ answer is “cortex”.'],
      flag: 'Standard anatomy says nephrons span cortex and medulla. The notes’ wording is used here.' } },
    { t: 'q', q: { id: 'm1q14', lv: 'U', src: 'A7, B8', stem: 'Which sequence lists the nephron parts in the order fluid passes through them?',
      opts: ['Glomerulus → Bowman capsule → PCT → loop of Henle → DCT', 'Bowman capsule → glomerulus → PCT → DCT → loop of Henle', 'Glomerulus → PCT → Bowman capsule → loop of Henle → DCT', 'Glomerulus → Bowman capsule → DCT → loop of Henle → PCT'],
      why: 'Blood is filtered in the glomerulus, the filtrate is caught by Bowman capsule, then passes the PCT, the loop of Henle and the DCT.',
      trap: [3, 'Proximal (near) comes before distal (far). The PCT is first, the DCT is last.'] } },
    { t: 'q', q: { id: 'm1q15', lv: 'U', src: 'A7, B8', stem: 'Fluid filtered out of the glomerulus is first caught by the:',
      opts: ['Glomerular (Bowman) capsule', 'Proximal convoluted tubule', 'Loop of Henle', 'Collecting duct'],
      why: 'Bowman capsule is the cup wrapped around the glomerulus; it is the second part in the list.',
      trap: [1, 'The PCT comes next, after the capsule.'] } },
    { t: 'q', q: { id: 'm1q16', lv: 'R', src: 'A6, B10 (figures)', stem: 'Which vessel carries blood <b>into</b> the glomerulus?',
      opts: ['Afferent arteriole', 'Efferent arteriole', 'Vasa recta', 'Renal vein'],
      why: 'Afferent arrives, efferent exits.',
      trap: [1, 'The efferent arteriole carries blood out of the glomerulus.'] } },
    { t: 'q', q: { id: 'm1q17', lv: 'R', src: 'A7, B8', stem: 'Which of these is <b>NOT</b> one of the five nephron parts listed in your notes?',
      opts: ['Renal papilla', 'Loop of Henle', 'Distal convoluted tubule', 'Glomerular (Bowman) capsule'],
      why: 'The five parts are the glomerulus, Bowman capsule, PCT, loop of Henle and DCT. The renal papilla is the tip of a pyramid.',
      trap: [1, 'The loop of Henle reaches into the medulla, which tempts some students to drop it, but it is one of the five parts.'] } },

    /* --- 7. Urine drainage path --- */
    { t: 'card', id: 'm1c10', title: 'The urine drainage route', src: 'B9', fig: 'kidney_map', figLabels: ['p_cd', 'p_pd', 'p_mi', 'p_ma', 'p_pe', 'p_ur', 'p_bl'],
      cap: 'The column on the right is the route in order, top to bottom. Each arrow is one step downstream.',
      predict: { q: 'Urine has just left the collecting duct. Where does it go next, all the way to the bladder?', a: 'Papillary duct → minor calyx → major calyx → renal pelvis → ureter → bladder.' },
      body: ['Once urine leaves the nephron it follows a fixed route: <k>collecting duct</k> → <k>papillary duct</k> → <k>minor calyx</k> → <k>major calyx</k> → <k>renal pelvis</k> → <k>ureter</k> → <k>urinary bladder</k>.',
        'Why it matters: a blockage anywhere on this route backs urine up behind it. That is the idea behind a stone causing <k>hydronephrosis</k> (Module 4) and <k>postrenal AKI</k> (Module 5).'],
      hook: '“<b>C</b>an <b>P</b>eople <b>M</b>ind <b>M</b>y <b>P</b>rivate <b>U</b>rinary <b>B</b>usiness?” Collecting, Papillary, Minor, Major, Pelvis, Ureter, Bladder.' },
    { t: 'ix', id: 'm1x7', kind: 'order', title: 'Drip the drop to the bladder', intro: 'Tap each station in order. The drop travels the real route on the kidney.',
      spec: { fig: 'kidney_map', path: 'urine', items: ['p_cd', 'p_pd', 'p_mi', 'p_ma', 'p_pe', 'p_ur', 'p_bl'], promptSmall: 'Urine drainage', prompt: 'Next station?', endText: 'From the bladder, urine leaves through the urethra.' } },
    { t: 'q', q: { id: 'm1q18', lv: 'U', src: 'B9', stem: 'On the drainage route, urine leaving a <b>minor calyx</b> flows next into the:',
      opts: ['Major calyx', 'Renal pelvis', 'Papillary duct', 'Ureter'],
      why: 'Minor calyces merge into a major calyx; major calyces empty into the pelvis.',
      trap: [1, 'The pelvis comes one step later, after the major calyx.'] } },
    { t: 'q', q: { id: 'm1q19', lv: 'A', src: 'B9, A33', stem: 'A stone is stuck in the left ureter. Based on the drainage route, where does urine back up?',
      opts: ['Into the left renal pelvis and calyces', 'Into the urinary bladder', 'Into the right kidney', 'Into the urethra'],
      why: 'Urine backs up upstream of the block: the ureter above the stone, the pelvis and the calyces. Your stone figure shows this as hydronephrosis and hydroureter.',
      trap: [1, 'The bladder is downstream of the stone, so it receives less urine from that side, not more.'] } },

    /* --- 8. Male GU --- */
    { t: 'card', id: 'm1c11', title: 'The male system shares the urethra', src: 'A8–A9, B14–B15', fig: 'male_gu',
      cap: 'Find the prostate: it sits right under the bladder and wraps around the urethra. Anything that enlarges it squeezes the urine outflow.',
      body: ['The male genital system is <k>closely related to the urinary system</k> because they <k>share the urethra</k>: the conduit for <k>urine, semen and other secretions</k>.',
        'The <k>prostate gland surrounds the urethra</k>. Together with the <k>seminal vesicles</k> it secretes fluid into the urethra. The <k>testes</k>, in the <k>scrotum</k>, create <k>spermatozoa</k>. Clinical link: an enlarged prostate (BPH) squeezes the urethra and causes difficulty starting urine flow and retention (Module 8).'] },
    { t: 'ix', id: 'm1x8', kind: 'label', title: 'Label the male GU system', intro: '13 structures on the side view.', spec: { fig: 'male_gu' } },
    { t: 'card', id: 'm1c12', title: 'The sperm route and semen', src: 'A10, B16–B17', fig: 'male_sagittal',
      cap: 'This slide labels the urethra, the bulbourethral gland and duct, and the bulb of penis. The bulbourethral gland sits just behind the bulb of penis and empties into the urethra.',
      body: ['During ejaculation, sperm travel from the <k>epididymis</k> into the <k>vas deferens</k>, through the <k>ejaculatory ducts</k>, and enter the <k>urethra</k> to exit the body.',
        'On the way, sperm mix with fluid from three sources to form <k>semen</k>: the <k>seminal vesicles</k>, the <k>bulbourethral (Cowper) glands</k> and the <k>prostate</k>.'],
      hook: 'Route: “<b>E</b>very <b>V</b>essel <b>E</b>nds in the <b>U</b>rethra”: Epididymis, Vas deferens, Ejaculatory duct, Urethra. Fluid: <b>S</b>eminal vesicles, <b>P</b>rostate, <b>C</b>owper = “SPC”.' },
    { t: 'ix', id: 'm1x9', kind: 'order', title: 'Trace the sperm route', intro: 'Tap the structures in the order sperm pass through them.',
      spec: { fig: 'male_gu', path: 'sperm', items: ['epididymis', 'vas', 'ejac', 'urethra'], promptSmall: 'During ejaculation', prompt: 'Where do sperm go next?', endText: 'Sperm leave the body through the urethra, the same tube urine uses.' } },
    { t: 'ix', id: 'm1x10', kind: 'sort', title: 'Makes, adds or carries?', intro: 'Sort each structure by its role in your notes.',
      spec: { prompt: 'Tap a structure, then its role', bins: [
        { id: 'make', title: 'Makes sperm', sub: 'creates spermatozoa' },
        { id: 'fluid', title: 'Adds fluid to semen', sub: 'secretes into the urethra' },
        { id: 'route', title: 'Carries sperm', sub: 'part of the route out' }],
        items: [
          { t: 'Testes', bin: 'make' },
          { t: 'Seminal vesicles', bin: 'fluid' }, { t: 'Prostate', bin: 'fluid' }, { t: 'Bulbourethral (Cowper) glands', bin: 'fluid' },
          { t: 'Epididymis', bin: 'route', why: 'The epididymis is where sperm start their trip: it carries them.' },
          { t: 'Vas deferens', bin: 'route' }, { t: 'Ejaculatory ducts', bin: 'route' }, { t: 'Urethra', bin: 'route' }] } },
    { t: 'q', q: { id: 'm1q20', lv: 'R', src: 'A8, B14', stem: 'The male genital system is closely related to the urinary system because both use the:',
      opts: ['Urethra', 'Ureters', 'Urinary bladder', 'Renal pelvis'],
      why: 'The urethra is the shared conduit for urine, semen and other secretions.',
      trap: [2, 'The bladder sits next to the prostate but only stores urine; the urethra is the shared tube.'] } },
    { t: 'q', q: { id: 'm1q21', lv: 'A', src: 'A9, A61', stem: 'A 72-year-old man struggles to start his urine stream and never feels his bladder empty. Enlargement of which structure best explains this?',
      opts: ['The prostate, which surrounds the urethra', 'The seminal vesicles, which add fluid to semen', 'The testes, which lie in the scrotum', 'The epididymis, behind the testis'],
      why: 'The prostate surrounds the urethra, so an enlarged prostate (BPH) narrows the outflow: difficulty starting flow, incomplete emptying and retention.',
      trap: [1, 'The seminal vesicles also secrete into the urethra, but they do not surround it, so they cannot squeeze it shut.'] } },
    { t: 'q', q: { id: 'm1q22', lv: 'U', src: 'A10, B16', stem: 'During ejaculation, sperm travel in which order?',
      opts: ['Epididymis → vas deferens → ejaculatory ducts → urethra', 'Vas deferens → epididymis → ejaculatory ducts → urethra', 'Epididymis → ejaculatory ducts → vas deferens → urethra', 'Testis → urethra → vas deferens → ejaculatory ducts'],
      why: 'Your notes: sperm travel from the epididymis into the vas deferens and through the ejaculatory ducts, then enter the urethra.',
      trap: [1, 'The epididymis comes first; the vas deferens starts from it.'] } },
    { t: 'q', q: { id: 'm1q23', lv: 'R', src: 'A10, B16', stem: 'Semen is formed by mixing sperm with fluid from all of the following <b>EXCEPT</b> the:',
      opts: ['Urinary bladder', 'Seminal vesicles', 'Bulbourethral (Cowper) glands', 'Prostate'],
      why: 'The three fluid sources are the seminal vesicles, the bulbourethral (Cowper) glands and the prostate. The bladder holds urine.',
      trap: [2, 'The Cowper glands are the bulbourethral glands, and they do add fluid.'] } },
    { t: 'q', q: { id: 'm1q24', lv: 'R', src: 'A9, B15', stem: 'Where are spermatozoa created?',
      opts: ['In the testes', 'In the epididymis', 'In the seminal vesicles', 'In the prostate'],
      why: 'Your notes: the testes, located in the scrotum, create spermatozoa.',
      trap: [1, 'Sperm begin their route in the epididymis, but they are created in the testes.'] } },

    /* --- short answers (exam includes short-answer items) --- */
    { t: 'q', q: { id: 'm1s1', type: 'sa', src: 'A2, B2', stem: 'List the four functions of the urinary system.',
      model: 'Filters blood and removes metabolic wastes; manages electrolyte concentrations; maintains acid-base balance in the bloodstream; regulates fluid volume and blood pressure.',
      points: ['Filters blood / removes metabolic wastes', 'Manages electrolyte concentrations', 'Maintains acid-base balance', 'Regulates fluid volume and blood pressure'] } },
    { t: 'q', q: { id: 'm1s2', type: 'sa', src: 'B9', stem: 'Trace the path of urine drainage from the collecting duct to the urinary bladder.',
      model: 'Collecting duct → papillary duct → minor calyx → major calyx → renal pelvis → ureter → urinary bladder.',
      points: ['Collecting duct', 'Papillary duct', 'Minor calyx', 'Major calyx', 'Renal pelvis', 'Ureter', 'Urinary bladder (in the right order)'] } },
    { t: 'q', q: { id: 'm1s3', type: 'sa', src: 'A10, B16', stem: 'Name the three sources of fluid that mix with sperm to form semen.',
      model: 'Seminal vesicles, bulbourethral (Cowper) glands and prostate.',
      points: ['Seminal vesicles', 'Bulbourethral (Cowper) glands', 'Prostate'] } },
  ],

  recall: [
    { p: 'The four functions of the urinary system', a: 'Filter blood & remove metabolic wastes · manage electrolytes · maintain acid-base balance · regulate fluid volume & blood pressure', fc: 'm1f1' },
    { p: 'The three internal regions of the kidney', a: 'Cortex · medulla · renal pelvis', fc: 'm1f11' },
    { p: 'The five nephron parts, in order', a: 'Glomerulus → Bowman capsule → PCT → loop of Henle → DCT', fc: 'm1f14' },
    { p: 'The urine drainage route (7 stations)', a: 'Collecting duct → papillary duct → minor calyx → major calyx → renal pelvis → ureter → urinary bladder', fc: 'm1f16' },
    { p: 'The sperm route during ejaculation', a: 'Epididymis → vas deferens → ejaculatory ducts → urethra', fc: 'm1f23' },
    { p: 'The three fluid sources of semen', a: 'Seminal vesicles · bulbourethral (Cowper) glands · prostate', fc: 'm1f24' },
    { p: 'The numbers: CKD worldwide, CKD over 70, CKD in Saudi Arabia, UTIs in women', a: '>5–10% · more than half · 6.5% · about 50%', fc: 'm1f8' },
  ],

  hooks: [
    { ic: 'GB', t: 'Good Boys Pee Lots Daily', d: 'Nephron order: Glomerulus → Bowman capsule → PCT → Loop of Henle → DCT.' },
    { ic: 'AE', t: 'Afferent Arrives, Efferent Exits', d: 'Afferent arteriole brings blood into the glomerulus; efferent carries it out.' },
    { ic: 'CP', t: 'Can People Mind My Private Urinary Business?', d: 'Collecting duct → Papillary duct → Minor calyx → Major calyx → Pelvis → Ureter → Bladder.' },
    { ic: '2:1', t: 'Two ureters, one urethra', d: 'Ureters come in a pair (one per kidney) and end in the bladder. The urethra is the single exit.' },
    { ic: 'EV', t: 'Every Vessel Ends in the Urethra', d: 'Sperm route: Epididymis → Vas deferens → Ejaculatory duct → Urethra.' },
    { ic: 'SPC', t: 'Semen’s SPC', d: 'Fluid from Seminal vesicles, Prostate and Cowper (bulbourethral) glands.' },
    { ic: '3=1', t: 'Three names, one stone', d: 'Nephrolithiasis = kidney stones = renal calculi.' },
    { ic: '%', t: '6.5 · half · 5–10 · 50', d: 'CKD: 6.5% in Saudi Arabia, over half of adults >70, over 5–10% worldwide. UTIs: about 50% of women.' },
  ],

  flash: [
    { id: 'm1f1', f: 'The four functions of the urinary system?', b: 'Filters blood and removes metabolic wastes · manages electrolyte concentrations · maintains acid-base balance · regulates fluid volume and blood pressure.' },
    { id: 'm1f2', f: 'The four types of renal disorder in your notes?', b: 'Kidney failure (most common) · nephrolithiasis · UTIs · noncancerous enlargement of the prostate.' },
    { id: 'm1f3', f: 'Most common renal disorder (file A)?', b: 'Kidney failure.' },
    { id: 'm1f4', f: 'Nephrolithiasis = ?', b: 'Kidney stones = renal calculi.' },
    { id: 'm1f5', f: 'UTIs affect about what share of women?', b: 'About 50% of all women.' },
    { id: 'm1f6', f: 'CKD prevalence worldwide?', b: 'More than 5–10% of the world’s population.' },
    { id: 'm1f7', f: 'CKD among adults older than 70?', b: 'More than half.' },
    { id: 'm1f8', f: 'CKD prevalence in Saudi Arabia?', b: '6.5%.' },
    { id: 'm1f9', f: 'The four urinary organs, in order of flow?', b: 'Kidneys → ureters → urinary bladder → urethra.' },
    { id: 'm1f10', f: 'Urethra: which sex has the shorter one?', b: 'Females (shorter in females than males).' },
    { id: 'm1f11', f: 'Three internal regions of the kidney?', b: 'Cortex · medulla · renal pelvis.' },
    { id: 'm1f12', f: 'Where do kidney stones originate?', b: 'In the renal pelvis.' },
    { id: 'm1f13', f: 'Nephron: definition and location (per notes)?', b: 'The structural and functional unit that forms urine; located in the cortex. ⚑ Loop of Henle reaches the medulla.' },
    { id: 'm1f14', f: 'Five nephron parts in order?', b: 'Glomerulus → glomerular (Bowman) capsule → PCT → loop of Henle → DCT.' },
    { id: 'm1f15', f: 'Afferent vs efferent arteriole?', b: 'Afferent brings blood INTO the glomerulus; efferent carries it OUT.' },
    { id: 'm1f16', f: 'Urine drainage route, collecting duct to bladder?', b: 'Collecting duct → papillary duct → minor calyx → major calyx → renal pelvis → ureter → urinary bladder.' },
    { id: 'm1f17', f: 'Renal hilum?', b: 'The notch where the renal artery, renal vein and ureter enter or leave the kidney.' },
    { id: 'm1f18', f: 'Renal papilla?', b: 'The tip of a renal pyramid; urine drips from it into a minor calyx.' },
    { id: 'm1f19', f: 'Why is the male genital system closely related to the urinary system?', b: 'They share the urethra: the conduit for urine, semen and other secretions.' },
    { id: 'm1f20', f: 'Which gland surrounds the urethra?', b: 'The prostate gland.' },
    { id: 'm1f21', f: 'Which two structures secrete fluid into the urethra (A9)?', b: 'The prostate and the seminal vesicles.' },
    { id: 'm1f22', f: 'Testes: location and job?', b: 'In the scrotum; they create spermatozoa.' },
    { id: 'm1f23', f: 'Sperm route during ejaculation?', b: 'Epididymis → vas deferens → ejaculatory ducts → urethra → out.' },
    { id: 'm1f24', f: 'Three fluid sources of semen?', b: 'Seminal vesicles · bulbourethral (Cowper) glands · prostate.' },
    { id: 'm1f25', f: 'Cowper gland = ?', b: 'The bulbourethral gland.' },
  ],

  arabic: `
<div class="blk"><h3>الفكرة الكبيرة</h3><p>كل أمراض هذا الفصل هي مشكلة في مكان ما على طريق واحد: الدم يدخل الكلية، والبول يخرج. إذا حفظت الطريق، فهمت كل شيء بعده.</p></div>
<div class="blk"><h3>وظائف الجهاز البولي (٤)</h3><ul>
<li>ينقّي الدم ويزيل الفضلات الأيضية <span class="en">filters blood, removes metabolic wastes</span></li>
<li>ينظّم تركيز الأملاح <span class="en">electrolytes</span></li>
<li>يحافظ على التوازن الحمضي القاعدي <span class="en">acid-base balance</span></li>
<li>ينظّم حجم السوائل وضغط الدم <span class="en">fluid volume & blood pressure</span></li></ul>
<p>إذا فشلت الكلية تفشل الأربع معاً، ولهذا تسبب <span class="en">AKI</span> غير المعالجة: <span class="en">volume overload, hyperkalemia, uremia, metabolic acidosis</span>.</p></div>
<div class="blk"><h3>أنواع الاضطرابات الكلوية</h3><ul>
<li><span class="en">Kidney failure</span>: الأكثر شيوعاً (الملف A)</li>
<li><span class="en">Nephrolithiasis</span> = <span class="en">kidney stones</span> = <span class="en">renal calculi</span> (ثلاثة أسماء لمرض واحد)</li>
<li><span class="en">UTIs</span>: تصيب حوالي ٥٠٪ من النساء</li>
<li>تضخم البروستاتا غير السرطاني <span class="en">BPH</span></li></ul></div>
<div class="blk"><h3>أرقام المرض الكلوي المزمن CKD</h3><ul>
<li>أكثر من ٥–١٠٪ من سكان العالم</li><li>أكثر من نصف البالغين فوق ٧٠ سنة</li><li>٦٫٥٪ في السعودية</li></ul></div>
<div class="blk"><h3>التشريح</h3><ul>
<li>الأعضاء الأربعة بالترتيب: <span class="en">kidneys → ureters → urinary bladder → urethra</span></li>
<li>الإحليل <span class="en">urethra</span> أقصر عند الإناث</li>
<li>مناطق الكلية الثلاث من الخارج للداخل: <span class="en">cortex → medulla → renal pelvis</span></li>
<li>حصى الكلى تبدأ في <span class="en">renal pelvis</span></li>
<li><span class="en">Renal hilum</span>: السُرّة التي يدخل ويخرج منها الشريان والوريد والحالب</li></ul></div>
<div class="blk"><h3>النفرون <span class="en">Nephron</span></h3>
<p>الوحدة التركيبية والوظيفية التي تصنع البول، وحسب ملفاتك يقع في <span class="en">cortex</span> (⚑ عروة هنلي تنزل إلى <span class="en">medulla</span>).</p>
<p>الأجزاء الخمسة بالترتيب: <span class="en">Glomerulus → Bowman capsule → PCT → Loop of Henle → DCT</span> ثم <span class="en">collecting duct</span>. للحفظ: <span class="en">Good Boys Pee Lots Daily</span>.</p>
<p><span class="en">Afferent</span> يدخل الدم للكبيبة و<span class="en">efferent</span> يخرجه.</p></div>
<div class="blk"><h3>طريق تصريف البول</h3>
<p><span class="en">Collecting duct → papillary duct → minor calyx → major calyx → renal pelvis → ureter → urinary bladder</span></p>
<p>أي انسداد على هذا الطريق يرجّع البول خلفه، وهذه فكرة <span class="en">hydronephrosis</span> و<span class="en">postrenal AKI</span>.</p></div>
<div class="blk"><h3>الجهاز التناسلي الذكري</h3><ul>
<li>يشترك مع الجهاز البولي في <span class="en">urethra</span> (للبول والمني والإفرازات)</li>
<li><span class="en">Prostate</span> تحيط بالإحليل وتفرز سائلاً مع <span class="en">seminal vesicles</span></li>
<li><span class="en">Testes</span> في <span class="en">scrotum</span> وتصنع الحيوانات المنوية</li>
<li>طريق الحيوانات المنوية: <span class="en">epididymis → vas deferens → ejaculatory ducts → urethra</span></li>
<li>مصادر سائل المني: <span class="en">seminal vesicles, bulbourethral (Cowper) glands, prostate</span></li></ul></div>`,
};
