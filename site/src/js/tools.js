/* ===== tools: exam builder, numbers drill, cheat sheet, entity hub, visual lab ===== */
const IMG_TITLES = {
  urinary_system: 'Urinary system', kidney_regions: 'Kidney: three regions', kidney_map: 'Kidney map & urine route', nephron: 'Nephron', male_gu: 'Male GU system', male_sagittal: 'Male urethra & bulbourethral gland',
  quadrants: 'Four abdominal quadrants', regions: 'Nine abdominal segments', hydro: 'Hydronephrosis from a stone', fistula: 'AV fistula', graft: 'Looped graft (AV shunt)',
  stone_photo: 'Kidney stone next to a coin', ivp: 'Stone on contrast X-ray', uremic_frost: 'Uremic frost', ecg_peaked: '12-lead: peaked T waves', ecg_wide: '12-lead: wide QRS', strip: 'Case rhythm strip (lead II)',
  hd_photo: 'Hemodialysis', pd_machine: 'Home dialysis machine', torsion_ill: 'Testicular torsion', phimosis: 'Phimosis', paraphimosis: 'Paraphimosis', table21_2: 'Table 21-2 (original)', table21_3: 'Table 21-3 (original)',
};
const IMG_MOD = { urinary_system: 'm1', kidney_regions: 'm1', kidney_map: 'm1', nephron: 'm1', male_gu: 'm1', male_sagittal: 'm1', quadrants: 'm2', regions: 'm2', hydro: 'm4', stone_photo: 'm4', ivp: 'm4', table21_2: 'm5', uremic_frost: 'm6', ecg_peaked: 'm6', ecg_wide: 'm6', strip: 'm6', fistula: 'm7', graft: 'm7', hd_photo: 'm7', pd_machine: 'm7', table21_3: 'm7', torsion_ill: 'm8', phimosis: 'm8', paraphimosis: 'm8' };
const IX_NAMES = { label: 'Tap-to-label', order: 'Route builder', sort: 'Sort game', match: 'Match game', kidney3d: '3D model', torsion3d: '3D model', ecg: 'ECG simulator', aki: 'Flow simulator', foley: 'Catheter simulator', dialysis: 'Dialysis circuit', triage: 'Clinical case', regions: 'Tap the region', compare: 'Picture compare', uo: 'Urine output checker' };

function allQs(mids, withSA) {
  const out = [];
  MODULES.forEach(m => { if (!ready(m.id) || (mids && !mids.includes(m.id))) return; CONTENT[m.id].steps.forEach(s => { if (s.t === 'q' && (withSA || s.q.type !== 'sa')) out.push({ q: s.q, mid: m.id }); }); });
  return out;
}
function modStats(mid) {
  const qs = allQs([mid], true); let r = 0, t = 0;
  qs.forEach(({ q }) => { const x = S.qs[q.id]; if (x) { t++; if (x.ok) r++; } });
  return { r, t, p: t ? r / t : null };
}

/* ---------- exam builder ---------- */
VIEWS.exam = (app) => {
  app.appendChild(topBar('Exam builder', 'Timed, mixed, weakest-first', { back: true }));
  const m = mainEl(); app.appendChild(m);
  const cfg = S.examCfg || (S.examCfg = { mods: MODULES.map(x => x.id), len: 20, timer: 0, fb: 'end', sa: false });
  const ui = el(`<div class="list">
    <div class="set"><h3>Modules</h3><div class="pickmods">${MODULES.map(x => `<label><input type="checkbox" value="${x.id}" ${cfg.mods.includes(x.id) ? 'checked' : ''}> ${x.n}. ${esc(x.title)}</label>`).join('')}</div></div>
    <div class="set"><h3>Length</h3><div class="seg" data-k="len">${[10, 20, 40, 0].map(v => `<button data-v="${v}" aria-pressed="${cfg.len === v}">${v || 'All'}</button>`).join('')}</div></div>
    <div class="set"><h3>Timer</h3><div class="seg" data-k="timer">${[0, 10, 20, 30].map(v => `<button data-v="${v}" aria-pressed="${cfg.timer === v}">${v ? v + ' min' : 'Off'}</button>`).join('')}</div></div>
    <div class="set"><h3>Feedback</h3><div class="seg" data-k="fb"><button data-v="instant" aria-pressed="${cfg.fb === 'instant'}">After each question</button><button data-v="end" aria-pressed="${cfg.fb === 'end'}">At the end</button></div></div>
    <div class="set"><h3>Short answers</h3><p>Include typed short-answer questions (graded by Claude or by you).</p><div class="seg" data-k="sa"><button data-v="false" aria-pressed="${!cfg.sa}">MCQ only</button><button data-v="true" aria-pressed="${cfg.sa}">Include</button></div></div>
    <button class="btn primary block" data-go>Start exam ${I.next}</button>
    <button class="btn block" data-mix>${I.spark} Mixed review: 20 questions, weakest areas first</button>
  </div>`);
  m.appendChild(ui);
  $$('.seg', ui).forEach(sg => $$('button', sg).forEach(b => b.onclick = () => {
    let v = b.dataset.v; if (sg.dataset.k === 'len' || sg.dataset.k === 'timer') v = +v; if (v === 'true') v = true; if (v === 'false') v = false;
    cfg[sg.dataset.k] = v; save(); $$('button', sg).forEach(x => x.setAttribute('aria-pressed', x === b));
  }));
  $$('input[type=checkbox]', ui).forEach(c => c.onchange = () => { cfg.mods = $$('input[type=checkbox]', ui).filter(x => x.checked).map(x => x.value); save(); });
  $('[data-go]', ui).onclick = () => {
    if (!cfg.mods.length) { toast('Pick at least one module'); return; }
    let pool = shuffle(allQs(cfg.mods, cfg.sa));
    if (cfg.len) pool = pool.slice(0, cfg.len);
    m.innerHTML = ''; runExam(m, pool, cfg);
  };
  $('[data-mix]', ui).onclick = () => { m.innerHTML = ''; runExam(m, mixedPool(20), { timer: 0, fb: 'instant', mixed: true }); };
};
function mixedPool(n) {
  const all = allQs(null, false);
  const score = ({ q, mid }) => {
    const x = S.qs[q.id], st = modStats(mid);
    let w = Math.random();
    if (S.mist[q.id]) w += 3;
    if (!x) w += 1.2;
    if (st.p != null) w += (1 - st.p) * 2;
    return w;
  };
  const picked = all.map(o => ({ o, w: score(o) })).sort((a, b) => b.w - a.w).slice(0, n).map(x => x.o);
  // interleave: avoid two in a row from the same module
  const out = []; const rest = shuffle(picked);
  while (rest.length) { const i = rest.findIndex(x => !out.length || x.mid !== out[out.length - 1].mid); out.push(rest.splice(i < 0 ? 0 : i, 1)[0]); }
  return out;
}
function runExam(m, pool, cfg) {
  if (!pool.length) { m.appendChild(el('<div class="empty"><b>No questions in that selection.</b></div>')); return; }
  const res = [];
  let i = 0, left = cfg.timer * 60, tick = null;
  const head = el(`<div class="prompt" style="margin-bottom:14px"><div class="find"><small>${cfg.mixed ? 'Mixed review' : 'Exam'}</small><span data-n></span></div><span class="timer" data-t></span></div>`);
  const host = el('<div></div>');
  m.append(head, host);
  const start = Date.now();
  if (cfg.timer) {
    tick = setInterval(() => {
      if (!head.isConnected) return clearInterval(tick);
      left--; $('[data-t]', head).textContent = fmt(left);
      if (left <= 0) { clearInterval(tick); toast('Time is up'); finish(); }
    }, 1000);
    $('[data-t]', head).textContent = fmt(left);
  }
  function fmt(s) { s = Math.max(0, s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  function show() {
    host.innerHTML = '';
    if (i >= pool.length) return finish();
    $('[data-n]', head).textContent = `Question ${i + 1} of ${pool.length}`;
    const { q, mid } = pool[i];
    host.appendChild(el(`<p class="eyebrow" style="margin-bottom:8px">Module ${modById(mid).n} · ${esc(modById(mid).title)}</p>`));
    renderQ(q, host, {
      quiet: cfg.fb === 'end' && q.type !== 'sa',
      onAnswer: (ok, pick) => {
        res.push({ q, mid, ok, pick });
        const nb = el(`<button class="btn primary" style="margin-top:14px">${i + 1 < pool.length ? 'Next' : 'Finish'} ${I.next}</button>`);
        nb.onclick = () => { i++; show(); window.scrollTo(0, 0); };
        host.appendChild(nb);
        if (cfg.fb === 'end' && q.type !== 'sa') setTimeout(() => nb.isConnected && nb.click(), 350);
      }
    });
  }
  function finish() {
    if (tick) clearInterval(tick);
    host.innerHTML = ''; head.remove();
    const right = res.filter(r => r.ok).length;
    const secs = Math.round((Date.now() - start) / 1000);
    host.appendChild(el(`<div class="done"><span class="tag teach">${cfg.mixed ? 'Mixed review' : 'Exam'} complete</span><div class="big">${pct(right, res.length)}%</div><p class="muted">${right} of ${res.length} correct${res.length < pool.length ? ` · ${pool.length - res.length} unanswered` : ''} · ${Math.floor(secs / 60)} min ${secs % 60} s</p></div>`));
    const by = {};
    res.forEach(r => { (by[r.mid] = by[r.mid] || { r: 0, t: 0 }); by[r.mid].t++; if (r.ok) by[r.mid].r++; });
    const rows = Object.entries(by).map(([mid, v]) => ({ mid, ...v, p: v.r / v.t })).sort((a, b) => a.p - b.p);
    const sec = el(`<section class="sect"><header><h2>Weakest first</h2></header><div class="bars"></div></section>`);
    rows.forEach(r => {
      const mod = modById(r.mid), col = r.p >= 0.8 ? 'var(--teal)' : r.p >= 0.5 ? 'var(--amber)' : 'var(--coral)';
      const b = el(`<div class="bar"><span><b>${mod.n}. ${esc(mod.title)}</b></span><span class="mono">${r.r}/${r.t}</span><div class="track"><i style="width:${r.p * 100}%;background:${col}"></i></div><button class="btn small" style="grid-column:1/-1;justify-self:start">Drill module ${mod.n}</button></div>`);
      $('button', b).onclick = () => { m.innerHTML = ''; runExam(m, shuffle(allQs([r.mid], false)).slice(0, 12), { timer: 0, fb: 'instant' }); };
      $('.bars', sec).appendChild(b);
    });
    host.appendChild(sec);
    const wrong = res.filter(r => !r.ok && r.q.type !== 'sa');
    if (wrong.length) {
      const rv = el(`<section class="sect"><header><h2>Review your misses</h2></header><div class="list"></div></section>`);
      wrong.forEach(r => rv.querySelector('.list').appendChild(el(`<div class="set"><p class="eyebrow">Module ${modById(r.mid).n}</p><b style="font-size:15px">${r.q.stem}</b><p style="color:var(--coral);font-size:14px">Your answer: ${r.pick != null ? r.q.opts[r.pick] : '—'}</p><p style="color:var(--teal);font-size:14px">Correct: ${r.q.opts[0]}</p><p style="font-size:14px;color:var(--text2)">${r.q.why}</p>${r.q.trap && r.q.trap[0] > 0 ? `<p style="font-size:13.5px;color:var(--muted)">Tempting wrong answer “${strip(r.q.opts[r.q.trap[0]])}”: ${r.q.trap[1]}</p>` : ''}</div>`)));
      host.appendChild(rv);
    }
    const again = el(`<button class="btn block" style="margin-top:16px">New exam</button>`); again.onclick = () => go('exam', {}, true);
    host.appendChild(again);
  }
  show();
}

/* ---------- numbers drill ---------- */
VIEWS.numbers = (app) => {
  app.appendChild(topBar('Numbers drill', `${NUMBERS.length} values from both files`, { back: true }));
  const m = mainEl(); app.appendChild(m);
  const list = shuffle(NUMBERS);
  let i = 0, right = 0, streak = 0, best = 0;
  const head = el(`<div class="stats" style="margin-bottom:14px"><div><b data-s>0</b><span>streak</span></div><div><b data-r>0/0</b><span>correct</span></div><div><b data-b>0</b><span>best streak</span></div></div>`);
  const host = el('<div></div>');
  m.append(head, host);
  function show() {
    host.innerHTML = '';
    if (i >= list.length) {
      sfx.win();
      host.appendChild(el(`<div class="done"><span class="tag teach">All numbers done</span><div class="big">${right}/${list.length}</div></div>`));
      const b = el(`<button class="btn block" style="margin-top:12px">Go again</button>`); b.onclick = () => go('numbers', {}, true); host.appendChild(b);
      const t = el(`<section class="sect"><header><h2>All values</h2></header><div class="tbl"><table><thead><tr><th>Value</th><th>Answer</th><th>Source</th></tr></thead><tbody>${NUMBERS.map(n => `<tr><td>${esc(n.q)}</td><td class="mono">${esc(n.a)}</td><td class="mono">${esc(n.src)}</td></tr>`).join('')}</tbody></table></div></section>`);
      host.appendChild(t); return;
    }
    const n = list[i];
    host.appendChild(el(`<p class="eyebrow">Module ${modById(n.mid).n} · ${n.src}</p>`));
    host.appendChild(el(`<p class="stem" style="font:700 20px/1.35 var(--f-display);margin:8px 0 14px">${esc(n.q)}</p>`));
    const opts = el('<div class="opts"></div>'); host.appendChild(opts);
    shuffle([n.a, ...n.d]).forEach((t, pos) => {
      const b = el(`<button class="opt"><span class="L">${'ABCD'[pos]}</span><span class="mono" style="font-size:16px">${esc(t)}</span></button>`);
      b.onclick = () => {
        const ok = t === n.a;
        $$('.opt', opts).forEach(x => { x.disabled = true; if (x.textContent.slice(1) === n.a) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        ok ? (sfx.ok(), right++, streak++) : (sfx.bad(), streak = 0);
        best = Math.max(best, streak);
        $('[data-s]', head).textContent = streak; $('[data-r]', head).textContent = `${right}/${i + 1}`; $('[data-b]', head).textContent = best;
        const nb = el(`<button class="btn primary" style="margin-top:12px">Next ${I.next}</button>`); nb.onclick = () => { i++; show(); };
        host.appendChild(nb);
      };
      opts.appendChild(b);
    });
  }
  show();
};

/* ---------- cheat sheet ---------- */
VIEWS.cheat = (app) => {
  app.appendChild(topBar('Cheat sheet', 'Every list, table and value', { back: true }));
  const m = mainEl(); app.appendChild(m);
  const box = el(`<div class="search"><div style="position:relative">${I.search}<input id="q-cheat" type="search" placeholder="Filter: “dialysis”, “50 mL”, “struvite”" aria-label="Filter the cheat sheet"></div></div>`);
  m.appendChild(box);
  const wrap = el('<div class="cs" style="margin-top:14px"></div>'); m.appendChild(wrap);
  MODULES.forEach(x => {
    const c = CONTENT[x.id]; if (!c) return;
    const blk = el(`<div class="blk" data-mod="${x.id}"><h3>${x.n}. ${esc(x.title)}</h3><ul>${c.flash.map(f => `<li data-t="${esc((strip(f.f) + ' ' + strip(f.b)).toLowerCase())}"><b>${f.f.replace(/\?$/, '')}:</b> ${f.b}</li>`).join('')}</ul></div>`);
    if (x.id === 'm5') blk.appendChild(el(`<div data-t="table 21-2 prerenal intrarenal postrenal hypotension tachycardia dizziness thirst flank joint oliguria hypertension headache confusion seizure distended bladder hematuria peripheral edema">${T212}</div>`));
    if (x.id === 'm7') blk.appendChild(el(`<div data-t="table 21-3 hypotension 50 ml saline hemorrhage fistula shunt clamp potassium atropine calcium bicarbonate disequilibrium air embolism left lateral 10 head-down machine heart failure diuretic myocardial infarction dysrhythmias hypertension pericardial tamponade uremic pericarditis">${T213}</div>`));
    wrap.appendChild(blk);
  });
  const inp = $('input', box);
  inp.oninput = () => {
    const q = inp.value.trim().toLowerCase();
    $$('.blk', wrap).forEach(b => {
      let any = false;
      $$('[data-t]', b).forEach(li => { const hit = !q || li.dataset.t.includes(q); li.hidden = !hit; any = any || hit; });
      b.hidden = !any;
    });
  };
};

/* ---------- entity hub ---------- */
VIEWS.hub = (app) => {
  app.appendChild(topBar('Entity hub', `${ENTITIES.length} conditions, drugs and procedures`, { back: true }));
  const m = mainEl(); app.appendChild(m);
  let type = 'All', sel = [];
  const top = el(`<div style="display:grid;gap:10px">
    <button class="btn primary block" data-quiz>${I.spark} Which one is it? (10 rounds)</button>
    <div class="filters">${['All', 'Condition', 'Drug', 'Procedure'].map(t => `<button data-ty="${t}" aria-pressed="${t === 'All'}">${t === 'Drug' ? 'Drugs & treatments' : t === 'Procedure' ? 'Procedures & devices' : t === 'Condition' ? 'Conditions' : 'All'}</button>`).join('')}</div>
    <p class="muted" style="font-size:13.5px">Tap two cards to compare them side by side.</p>
    <div class="cmpbox"></div></div>`);
  m.appendChild(top);
  const grid = el('<div class="list"></div>'); m.appendChild(grid);
  function card(e, full) {
    return `<span class="ty">${e.ty} · Module ${modById(e.mid).n}</span><b>${esc(e.n)}</b><span class="ar" style="font-size:13px;text-align:left">${esc(e.ar)}</span>
      <dl><dt>What it is</dt><dd>${e.def}</dd>${e.find ? `<dt>${e.ty === 'Condition' ? 'Findings' : 'Notes'}</dt><dd>${e.find}</dd>` : ''}${e.care ? `<dt>${e.ty === 'Condition' ? 'Care' : 'Use / caution'}</dt><dd>${e.care}</dd>` : ''}</dl>`;
  }
  function draw() {
    grid.innerHTML = '';
    ENTITIES.filter(e => type === 'All' || e.ty === type).forEach(e => {
      const b = el(`<button class="ent ${sel.includes(e.id) ? 'sel' : ''}">${card(e)}</button>`);
      if (e.img) { const f = figureEl(e.img, { labels: false }); f.style.maxWidth = '220px'; b.appendChild(f); }
      b.onclick = () => { sel = sel.includes(e.id) ? sel.filter(x => x !== e.id) : [...sel, e.id].slice(-2); sfx.tap(); draw(); cmp(); };
      grid.appendChild(b);
    });
  }
  function cmp() {
    const box = $('.cmpbox', top); box.innerHTML = '';
    if (sel.length < 2) return;
    const [a, b] = sel.map(id => ENTITIES.find(e => e.id === id));
    const c = el(`<div><p class="eyebrow" style="margin-bottom:8px">Side by side</p><div class="cmp"><div class="ent">${card(a)}</div><div class="ent">${card(b)}</div></div><button class="btn small" style="margin-top:8px" data-clr>Clear</button></div>`);
    $('[data-clr]', c).onclick = () => { sel = []; draw(); cmp(); };
    box.appendChild(c);
  }
  $$('[data-ty]', top).forEach(b => b.onclick = () => { type = b.dataset.ty; $$('[data-ty]', top).forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
  $('[data-quiz]', top).onclick = () => { m.innerHTML = ''; whichOne(m); };
  draw();
};
function whichOne(m) {
  let i = 0, right = 0;
  const rounds = shuffle(ENTITIES.filter(e => e.def && e.ty === 'Condition' || (e.def && Math.random() < 0.35))).slice(0, 10);
  const host = el('<div></div>'); m.appendChild(host);
  function show() {
    host.innerHTML = '';
    if (i >= rounds.length) {
      sfx.win();
      host.appendChild(el(`<div class="done"><span class="tag teach">Which one is it?</span><div class="big">${right}/${rounds.length}</div></div>`));
      const b = el(`<button class="btn block" style="margin-top:12px">Back to the hub</button>`); b.onclick = () => go('hub', {}, true); host.appendChild(b); return;
    }
    const e = rounds[i];
    const same = shuffle(ENTITIES.filter(x => x.ty === e.ty && x.id !== e.id)).slice(0, 3);
    const clue = Math.random() < 0.5 && e.find ? e.find : e.def;
    host.appendChild(el(`<p class="eyebrow">Round ${i + 1} of ${rounds.length} · ${e.ty}</p>`));
    host.appendChild(el(`<div class="alarm-card" style="margin:10px 0"><div class="ah"><span class="dot"></span>Clue</div><p style="font-size:16px">${clue}</p></div>`));
    const opts = el('<div class="opts"></div>'); host.appendChild(opts);
    shuffle([e, ...same]).forEach((o, pos) => {
      const b = el(`<button class="opt"><span class="L">${'ABCD'[pos]}</span><span>${esc(o.n)}</span></button>`);
      b.onclick = () => {
        const ok = o.id === e.id;
        $$('.opt', opts).forEach(x => x.disabled = true);
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) $$('.opt', opts).find(x => x.textContent.slice(1) === e.n)?.classList.add('right');
        ok ? (sfx.ok(), right++) : sfx.bad();
        host.appendChild(el(`<div class="callout why" style="margin-top:10px"><span class="h">${esc(e.n)}</span><div>${e.def}${e.care ? ' <b>Care:</b> ' + e.care : ''}</div></div>`));
        const nb = el(`<button class="btn primary small" style="margin-top:10px">Next ${I.next}</button>`); nb.onclick = () => { i++; show(); }; host.appendChild(nb);
      };
      opts.appendChild(b);
    });
  }
  show();
}

/* ---------- visual lab ---------- */
VIEWS.lab = (app, params) => {
  app.appendChild(topBar('Visual lab', 'Figures, photos, ECGs and every interactive', { back: true }));
  const m = mainEl(); app.appendChild(m);
  let tab = params.tab || 'figs';
  const tabs = el(`<div class="filters">${[['figs', 'Figures & photos'], ['ix', 'Interactives'], ['quiz', 'Picture quiz']].map(([k, t]) => `<button data-k="${k}" aria-pressed="${k === tab}">${t}</button>`).join('')}</div>`);
  const body = el('<div></div>');
  m.append(tabs, body);
  $$('button', tabs).forEach(b => b.onclick = () => { tab = b.dataset.k; R.params.tab = tab; $$('button', tabs).forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
  function draw() {
    body.innerHTML = '';
    if (tab === 'figs') {
      const g = el('<div class="gallery"></div>');
      Object.keys(IMG).forEach(k => {
        const b = el(`<button><div class="th"><img src="${IMG[k]}" alt="" loading="lazy"></div><b>${esc(IMG_TITLES[k] || k)}</b><span class="src" style="padding:0 4px 4px">Module ${modById(IMG_MOD[k] || 'm1').n}</span></button>`);
        b.onclick = () => openLightbox(k, { title: IMG_TITLES[k] || k });
        g.appendChild(b);
      });
      body.appendChild(g);
    }
    if (tab === 'ix') {
      const g = el('<div class="gallery"></div>');
      MODULES.forEach(x => { const c = CONTENT[x.id]; if (!c) return; const flow = flowOf(x.id);
        c.steps.forEach((s, i) => { if (s.t !== 'ix') return;
          const ic = s.kind.includes('3d') ? I.hub : s.kind === 'ecg' ? I.drill : s.kind === 'triage' ? I.mistake : I.spark;
          const thumb = s.spec && s.spec.fig && IMG[s.spec.fig] ? `<div class="th"><img src="${IMG[s.spec.fig]}" alt="" loading="lazy"></div>` : s.spec && s.spec.a ? `<div class="th"><img src="${IMG[s.spec.a.img]}" alt="" loading="lazy"></div>` : `<div class="th ix">${ic}</div>`;
          const b = el(`<button>${thumb}<b>${esc(s.title)}</b><span class="src" style="padding:0 4px 4px">${esc(IX_NAMES[s.kind] || s.kind)} · M${x.n}</span></button>`);
          b.onclick = () => openModule(x.id, flow.findIndex(f => f._i === i));
          g.appendChild(b);
        }); });
      body.appendChild(g);
    }
    if (tab === 'quiz') picQuiz(body);
  }
  draw();
};
function picQuiz(host) {
  const rounds = shuffle(PICQ).slice(0, 10);
  let i = 0, right = 0;
  function show() {
    host.innerHTML = '';
    if (i >= rounds.length) {
      sfx.win();
      host.appendChild(el(`<div class="done"><span class="tag teach">Picture quiz</span><div class="big">${right}/${rounds.length}</div></div>`));
      const b = el(`<button class="btn block" style="margin-top:12px">Play again</button>`); b.onclick = () => { i = 0; right = 0; rounds.sort(() => Math.random() - .5); show(); }; host.appendChild(b); return;
    }
    const r = rounds[i];
    host.appendChild(el(`<p class="eyebrow" style="margin-bottom:8px">Picture ${i + 1} of ${rounds.length} · What is this?</p>`));
    const f = figureEl(r.img, { labels: false }); f.style.maxWidth = '520px'; f.style.marginInline = 'auto'; f.onclick = () => openLightbox(r.img, { title: 'What is this?', labels: false });
    host.appendChild(f);
    const opts = el('<div class="opts" style="margin-top:12px"></div>'); host.appendChild(opts);
    shuffle([r.a, ...r.d]).forEach((t, pos) => {
      const b = el(`<button class="opt"><span class="L">${'ABCD'[pos]}</span><span>${esc(t)}</span></button>`);
      b.onclick = () => {
        const ok = t === r.a;
        $$('.opt', opts).forEach(x => { x.disabled = true; if (x.textContent.slice(1) === r.a) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        ok ? (sfx.ok(), right++) : sfx.bad();
        const nb = el(`<button class="btn primary small" style="margin-top:10px">Next ${I.next}</button>`); nb.onclick = () => { i++; show(); }; host.appendChild(nb);
      };
      opts.appendChild(b);
    });
  }
  show();
}
