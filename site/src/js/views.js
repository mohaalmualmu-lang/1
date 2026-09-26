/* ===== views ===== */
const DAY = 86400000;
const INTV = [1, 3, 7, 16, 35];
const SESSION = { miss: {} };

/* ---------- derived data ---------- */
const QINDEX = {}, FINDEX = {};
function indexContent() {
  MODULES.forEach(m => {
    const c = CONTENT[m.id]; if (!c) return;
    c.steps.forEach((s, i) => { if (s.t === 'q') QINDEX[s.q.id] = { q: s.q, mid: m.id, i }; });
    (c.flash || []).forEach(f => FINDEX[f.id] = Object.assign({ mid: m.id }, f));
  });
}
function ready(mid) { return !!CONTENT[mid]; }
function modById(mid) { return MODULES.find(m => m.id === mid); }

function flowOf(mid) {
  const c = CONTENT[mid];
  let st = c.steps.map((s, i) => Object.assign({ _i: i }, s));
  if (S.set.qmode === 'end') {
    const qs = st.filter(s => s.t === 'q');
    st = st.filter(s => s.t !== 'q');
    if (qs.length) st.push({ t: 'qhead', _i: -1 }, ...qs);
  }
  return [{ t: 'intro', _i: -1 }, ...st, { t: 'lockin', _i: -1 }, { t: 'recall', _i: -1 }, { t: 'hooks', _i: -1 }, { t: 'done', _i: -1 }];
}
function stepKey(s) { return s.t === 'q' ? s.q.id : s.id; }
function prog(mid) { return S.prog[mid] || (S.prog[mid] = { at: 0, seen: {}, ix: {}, done: false }); }
function modPct(mid) {
  if (!ready(mid)) return 0;
  const c = CONTENT[mid], p = S.prog[mid];
  if (!p) return 0;
  const keys = c.steps.map(stepKey);
  return pct(keys.filter(k => p.seen[k]).length, keys.length);
}
function accuracy() {
  let r = 0, t = 0;
  Object.values(S.qs).forEach(x => { t++; if (x.ok) r++; });
  return t ? pct(r, t) : null;
}

/* ---------- SRS ---------- */
function availableCards() {
  const out = [];
  MODULES.forEach(m => { if (S.started[m.id] && CONTENT[m.id]) (CONTENT[m.id].flash || []).forEach(f => out.push(FINDEX[f.id])); });
  return out;
}
function dueQueue() {
  const now = Date.now();
  const cards = availableCards();
  const lapsed = [], due = [], fresh = [];
  cards.forEach(c => {
    const s = S.srs[c.id];
    if (!s) fresh.push(c);
    else if (s.b === -1) lapsed.push(c);
    else if (s.due <= now) due.push(c);
  });
  due.sort((a, b) => S.srs[a.id].due - S.srs[b.id].due);
  return [...lapsed, ...due, ...fresh];
}
function gradeCard(id, ok) {
  const s = S.srs[id];
  if (ok) {
    const b = !s || s.b < 0 ? 0 : Math.min(s.b + 1, 4);
    S.srs[id] = { b, due: Date.now() + INTV[b] * DAY };
  } else {
    S.srs[id] = { b: -1, due: Date.now(), lapsed: true };
  }
  save();
}
function nextDueText() {
  const future = availableCards().map(c => S.srs[c.id]).filter(s => s && s.b >= 0).map(s => s.due);
  if (!future.length) return '';
  const d = Math.min(...future) - Date.now();
  if (d <= 0) return 'now';
  const h = Math.round(d / 3600000);
  return h < 24 ? `in ${Math.max(1, h)} h` : `in ${Math.round(d / DAY)} day${Math.round(d / DAY) > 1 ? 's' : ''}`;
}

/* ---------- router ---------- */
const R = { view: 'home', params: {}, stack: [] };
function go(view, params = {}, replace = false) {
  if (!replace) R.stack.push({ view: R.view, params: R.params });
  R.view = view; R.params = params;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
function back() {
  const p = R.stack.pop();
  if (p) { R.view = p.view; R.params = p.params; } else { R.view = 'home'; R.params = {}; }
  render();
  window.scrollTo(0, 0);
}
const NAV = [['home', 'Home', 'home'], ['learn', 'Learn', 'learn'], ['cards', 'Cards', 'cards'], ['search', 'Search', 'search'], ['more', 'More', 'more']];
const NAVOF = { home: 'home', learn: 'learn', module: 'learn', cards: 'cards', search: 'search', more: 'more', mistakes: 'more', settings: 'more', arabic: 'more', soon: 'more' };

function render() {
  const app = $('#app');
  app.innerHTML = '';
  const view = VIEWS[R.view] || VIEWS.home;
  view(app, R.params);
  if (R.view !== 'module') {
    const due = dueQueue().length;
    const nav = el(`<nav class="bottom" aria-label="Main"><div class="row">${NAV.map(([v, label, ic]) =>
      `<button data-v="${v}" ${NAVOF[R.view] === v ? 'aria-current="page"' : ''}>${I[ic]}<span>${label}</span>${v === 'cards' && due ? `<span class="badge">${due > 99 ? '99+' : due}</span>` : ''}</button>`).join('')}</div></nav>`);
    $$('button', nav).forEach(b => b.onclick = () => { R.stack = []; go(b.dataset.v, {}, true); });
    app.appendChild(nav);
  }
  $$('[data-needs-claude]').forEach(n => n.hidden = !SAMPLE);
}
function topBar(title, sub, opts = {}) {
  const t = el(`<header class="top">
    ${opts.back ? `<button class="ibtn" data-back aria-label="Back">${opts.close ? I.close : I.back}</button>` : '<span style="width:6px"></span>'}
    <div class="ttl"><b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>
    <div class="acts"></div>
    <button class="ibtn" data-theme aria-label="Switch theme">${isDark() ? I.sun : I.moon}</button>
    ${opts.progress != null ? `<div class="progress"><i style="width:${opts.progress}%"></i></div>` : ''}</header>`);
  if (opts.back) $('[data-back]', t).onclick = opts.onBack || back;
  $('[data-theme]', t).onclick = () => { S.set.theme = isDark() ? 'light' : 'dark'; save(); applyTheme(); render(); };
  return t;
}
function isDark() {
  const a = document.documentElement.getAttribute('data-theme');
  if (a) return a === 'dark';
  return !(window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches);
}
function mainEl() { return el('<main class="view"></main>'); }

/* ---------- visual blocks used inside cards ---------- */
const VIZ = {
  jobs: () => `<div class="viz"><div class="jobs">
    <div class="job"><svg viewBox="0 0 40 40" fill="none" stroke="var(--teal)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h28l-10 13v9l-8 4V21z"/><circle cx="14" cy="4" r="1.4" fill="var(--amber)" stroke="none"/><circle cx="22" cy="3" r="1.4" fill="var(--amber)" stroke="none"/></svg><b>Filter wastes</b><span>Removes metabolic wastes from the blood</span></div>
    <div class="job"><svg viewBox="0 0 40 40"><text x="3" y="18" font-family="IBM Plex Mono,monospace" font-weight="700" font-size="12" fill="var(--amber)">K⁺</text><text x="18" y="18" font-family="IBM Plex Mono,monospace" font-weight="700" font-size="12" fill="var(--cyan)">Na⁺</text><path d="M4 28h32M20 22v12" stroke="var(--teal)" stroke-width="2.2" stroke-linecap="round"/><path d="M8 34l-4-6 4-6M32 34l4-6-4-6" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linejoin="round"/></svg><b>Electrolytes</b><span>Keeps concentrations in range</span></div>
    <div class="job"><svg viewBox="0 0 40 40" fill="none" stroke-linecap="round"><rect x="4" y="15" width="32" height="10" rx="5" stroke="var(--line2)" stroke-width="2"/><rect x="4" y="15" width="12" height="10" rx="5" fill="var(--coral)" opacity=".7"/><rect x="24" y="15" width="12" height="10" rx="5" fill="var(--cyan)" opacity=".7"/><path d="M20 10v20" stroke="var(--teal)" stroke-width="2.6"/><text x="15" y="8" font-family="IBM Plex Mono,monospace" font-size="7" font-weight="700" fill="var(--teal)">pH</text></svg><b>Acid-base</b><span>Keeps blood pH balanced</span></div>
    <div class="job"><svg viewBox="0 0 40 40" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6c5 7 8 11 8 16a8 8 0 0 1-16 0c0-5 3-9 8-16z" fill="var(--cyan-soft)" stroke="var(--cyan)" stroke-width="2"/><path d="M26 30a8 8 0 1 1 11-7" stroke="var(--teal)" stroke-width="2.2"/><path d="M31 25l3-5" stroke="var(--amber)" stroke-width="2.4"/></svg><b>Fluid & BP</b><span>Regulates fluid volume and blood pressure</span></div>
  </div></div>`,
  ckd: () => `<div class="viz"><div class="statrow">
    <div class="stat"><b>&gt;5–10%</b><span>of the world’s population has CKD</span></div>
    <div class="stat"><b>&gt;½</b><span>of adults older than 70</span></div>
    <div class="stat"><b>6.5%</b><span>in Saudi Arabia</span></div></div></div>`,
};

/* ---------- ECG strip for the home monitor ---------- */
function ecgPath(w = 600, h = 46, beats = 5) {
  const base = h * 0.62, seg = w / beats;
  let d = `M0 ${base}`;
  for (let i = 0; i < beats; i++) {
    const x = i * seg;
    d += ` L${x + seg * .18} ${base} Q${x + seg * .23} ${base - 6} ${x + seg * .28} ${base}`;
    d += ` L${x + seg * .36} ${base} L${x + seg * .39} ${base + 5} L${x + seg * .43} ${base - h * .55} L${x + seg * .47} ${base + 9} L${x + seg * .5} ${base}`;
    d += ` L${x + seg * .6} ${base} Q${x + seg * .69} ${base - 11} ${x + seg * .78} ${base} L${x + seg} ${base}`;
  }
  return d;
}

/* ---------- views ---------- */
const VIEWS = {};

VIEWS.home = (app) => {
  app.appendChild(topBar('Renal & GU Emergencies', 'Chapter 22 · BSc EMS'));
  const m = mainEl(); app.appendChild(m);
  const due = dueQueue().length;
  const done = MODULES.filter(x => S.prog[x.id] && S.prog[x.id].done).length;
  const acc = accuracy();
  m.appendChild(el(`<section class="hero">
    <h1><span class="ch">Chapter 22</span>Blood in, urine out: learn the route, then everything that blocks it.</h1>
    <div class="monitor" role="img" aria-label="Study status: ${due} cards due, ${done} of 8 modules done, accuracy ${acc == null ? 'not yet measured' : acc + '%'}">
      <div class="chs">
        <div class="ch c1"><small>DUE</small><b>${due}</b><span>cards to review</span></div>
        <div class="ch c2"><small>MOD</small><b>${done}/8</b><span>modules done</span></div>
        <div class="ch c3"><small>ACC</small><b>${acc == null ? '--' : acc + '%'}</b><span>question accuracy</span></div>
      </div>
      <svg class="ecg" viewBox="0 0 600 46" preserveAspectRatio="none" aria-hidden="true"><path d="${ecgPath()}" opacity=".18"/><path class="sweep" d="${ecgPath()}"/></svg>
    </div></section>`));
  const last = S.last && ready(S.last.mid) ? S.last : null;
  const resumeMid = last ? last.mid : 'm1';
  const mod = modById(resumeMid);
  const r = el(`<button class="resume"><div class="t"><b>${last ? 'Continue' : 'Start'} · Module ${mod.n}: ${esc(mod.title)}</b><span>${last ? `${modPct(resumeMid)}% done · pick up where you stopped` : 'Begins with what the kidneys do and how urine gets out'}</span></div>${I.next}</button>`);
  r.onclick = () => openModule(resumeMid);
  m.appendChild(r);
  if (due) {
    const c = el(`<button class="btn block" style="margin-top:10px">${I.cards} Review ${due} flashcard${due > 1 ? 's' : ''}</button>`);
    c.onclick = () => go('cards', { start: true });
    m.appendChild(c);
  }
  const sec = el(`<section class="sect"><header><h2>Modules</h2><span class="eyebrow">in teaching order</span></header><div class="mods"></div></section>`);
  MODULES.forEach(x => $('.mods', sec).appendChild(modRow(x)));
  m.appendChild(sec);
  m.appendChild(toolsSection());
};

function modRow(x) {
  const ok = ready(x.id), p = modPct(x.id);
  const circ = 2 * Math.PI * 16;
  const b = el(`<button class="mod ${ok ? 'ready' : ''}" ${ok ? '' : 'disabled'}>
    <span class="num">${x.n}</span>
    <div><h3>${esc(x.title)}</h3><div class="arsub" lang="ar" dir="rtl" style="text-align:left">${esc(x.ar)}</div><div class="sub">${esc(x.blurb)}</div></div>
    ${ok ? `<svg class="ring" viewBox="0 0 40 40" aria-label="${p}% complete"><circle class="bgc" cx="20" cy="20" r="16"/><circle class="fgc" cx="20" cy="20" r="16" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - p / 100)}"/><text x="20" y="23.5" text-anchor="middle">${p}</text></svg>` : '<span class="pill">Phase 4</span>'}
  </button>`);
  if (ok) b.onclick = () => openModule(x.id);
  return b;
}

function toolsSection() {
  const mist = Object.keys(S.mist).length;
  const tools = [
    ['cards', I.cards, 'Flashcards', `Spaced review · ${dueQueue().length} due`],
    ['search', I.search, 'Search', 'Every card, question and label'],
    ['mistakes', I.mistake, 'My mistakes', mist ? `${mist} to fix` : 'Nothing to fix yet'],
    ['arabic', I.arabic, 'ملخص عربي', 'Arabic summary per module'],
    ['soon:exam', I.exam, 'Exam builder', 'Timed mixed exams'],
    ['soon:numbers', I.hash, 'Numbers drill', 'Every value in the chapter'],
    ['soon:cheat', I.sheet, 'Cheat sheet', 'Searchable one-pager'],
    ['soon:hub', I.hub, 'Entity hub', 'Compare conditions side by side'],
    ['soon:lab', I.image, 'Visual lab', 'Every figure + picture quiz'],
    ['settings', I.gear, 'Settings', 'Theme, question placement, sound'],
  ];
  const sec = el(`<section class="sect"><header><h2>Tools</h2></header><div class="tools"></div></section>`);
  tools.forEach(([v, ic, t, d]) => {
    const soon = v.startsWith('soon:');
    const b = el(`<button class="tool" ${soon ? 'data-soon' : ''}>${ic}<b ${t.match(/[؀-ۿ]/) ? 'style="font-family:var(--f-ar)"' : ''}>${esc(t)}</b><span>${esc(d)}</span>${soon ? '<span class="soon">Phase 4</span>' : ''}</button>`);
    b.onclick = () => soon ? go('soon', { what: t }) : go(v);
    $('.tools', sec).appendChild(b);
  });
  return sec;
}

VIEWS.learn = (app) => {
  app.appendChild(topBar('Learn', '8 modules · teaching order'));
  const m = mainEl(); app.appendChild(m);
  m.appendChild(el(`<p class="lede" style="margin-bottom:16px">Each module teaches one idea per card, asks before it tells, drops you into an interactive, then locks in what you missed. Module 1 is ready; the rest arrive in the full build.</p>`));
  const box = el('<div class="mods"></div>');
  MODULES.forEach(x => box.appendChild(modRow(x)));
  m.appendChild(box);
};

/* ---------- module player ---------- */
function openModule(mid, at) {
  if (!ready(mid)) return;
  S.started[mid] = true;
  const p = prog(mid);
  if (at != null) p.at = at;
  save();
  go('module', { mid });
}

VIEWS.module = (app, { mid }) => {
  const mod = modById(mid), c = CONTENT[mid], p = prog(mid);
  const flow = flowOf(mid);
  if (p.at >= flow.length) p.at = flow.length - 1;
  if (p.at < 0) p.at = 0;
  const step = flow[p.at];
  S.last = { mid }; save();
  const counts = { card: 0, ix: 0, q: 0 };
  c.steps.forEach(s => counts[s.t]++);
  const tb = topBar(mod.title, `Module ${mod.n} · ${stepLabel(step, flow, p.at)}`, { back: true, close: true, onBack: () => { R.stack = []; go('home', {}, true); }, progress: Math.round(100 * p.at / (flow.length - 1)) });
  const arb = el(`<button class="ibtn txt" aria-label="Arabic summary">ع</button>`);
  arb.onclick = () => go('arabic', { mid });
  $('.acts', tb).appendChild(arb);
  app.appendChild(tb);
  const m = mainEl(); app.appendChild(m);
  const wrap = el('<section class="step"></section>'); m.appendChild(wrap);

  let canGo = true;
  const bar = el(`<div class="stepbar"><div class="row">
    <button class="btn ghost small" data-prev aria-label="Previous step" ${p.at === 0 ? 'disabled' : ''}>${I.prev}</button>
    <span class="count">${p.at + 1} / ${flow.length}</span>
    <button class="btn primary" data-next>Continue ${I.next}</button></div></div>`);
  const nextBtn = $('[data-next]', bar);
  function setNext(label, enabled = true) { nextBtn.innerHTML = `${label} ${I.next}`; nextBtn.disabled = !enabled; canGo = enabled; }
  $('[data-prev]', bar).onclick = () => { p.at = Math.max(0, p.at - 1); save(); render(); window.scrollTo(0, 0); };
  nextBtn.onclick = () => {
    if (!canGo) return;
    const k = step.t === 'card' || step.t === 'ix' || step.t === 'q' ? stepKey(step) : null;
    if (k) p.seen[k] = 1;
    if (p.at < flow.length - 1) { p.at++; save(); render(); window.scrollTo(0, 0); }
    else { p.done = true; p.at = 0; save(); R.stack = []; go('home', {}, true); }
  };
  app.appendChild(bar);

  const R_ = STEP_RENDER[step.t];
  R_(wrap, step, { mid, mod, c, p, flow, setNext, counts });
};

function stepLabel(step, flow, at) {
  const names = { intro: 'Overview', card: 'Learn', ix: 'Interactive', q: 'Check yourself', qhead: 'Question round', lockin: 'Lock-in round', recall: 'Recall from memory', hooks: 'Memory hooks', done: 'Module complete' };
  return names[step.t] || '';
}

const STEP_RENDER = {};
STEP_RENDER.intro = (w, s, { mod, c, counts, setNext }) => {
  w.appendChild(el(`<div class="kind"><span class="tag teach">Module ${mod.n}</span></div>`));
  w.appendChild(el(`<h2>${esc(mod.title)}</h2>`));
  w.appendChild(el(`<p class="ar" style="font-size:16px;color:var(--text2)">${esc(mod.ar)}</p>`));
  w.appendChild(el(`<p class="lede">${c.intro}</p>`));
  w.appendChild(el(`<div class="stats"><div><b>${counts.card}</b><span>idea cards</span></div><div><b>${counts.ix}</b><span>interactives</span></div><div><b>${counts.q}</b><span>questions</span></div></div>`));
  w.appendChild(el(`<div class="callout hook"><span class="h">How this works</span><div>Some cards ask you to <b>think first</b>: answer in your head, then reveal. Questions ${S.set.qmode === 'inline' ? 'appear right after the idea they test' : 'are grouped at the end (change this in Settings)'}. Anything you miss comes back in the lock-in round and in your flashcards.</div></div>`));
  setNext('Start');
};

STEP_RENDER.card = (w, s, { c, flow, p }) => {
  const n = c.steps.filter(x => x.t === 'card').indexOf(c.steps[s._i]) + 1;
  const total = c.steps.filter(x => x.t === 'card').length;
  w.appendChild(el(`<div class="kind"><span class="tag teach">Idea ${n} of ${total}</span></div>`));
  w.appendChild(el(`<h2>${esc(s.title)}</h2>`));
  const content = el('<div style="display:grid;gap:16px"></div>');
  const body = el(`<div>${s.body.map(b => `<p class="lede">${b}</p>`).join('')}</div>`);
  if (s.predict && !p.seen[s.id]) {
    const pr = el(`<div class="predict"><div class="q">${s.predict.q}</div><button class="btn small">Reveal</button></div>`);
    content.hidden = true;
    $('button', pr).onclick = () => {
      $('button', pr).replaceWith(el(`<div class="a"><b style="color:var(--teal)">Answer:</b> ${s.predict.a}</div>`));
      content.hidden = false; sfx.tap();
    };
    w.appendChild(pr);
  }
  content.appendChild(body);
  if (s.viz) content.appendChild(el(VIZ[s.viz]()));
  if (s.fig) {
    const fg = el('<figure></figure>');
    const f = figureEl(s.fig, { only: s.figLabels });
    f.style.cursor = 'zoom-in';
    const ex = el(`<button class="zoomer" aria-label="Open figure full screen">${I.expand}</button>`);
    f.appendChild(ex);
    f.onclick = () => openLightbox(s.fig, { title: s.title, caption: s.cap ? `<b style="color:#2fd3bf">What to notice:</b> ${s.cap}` : '', only: s.figLabels });
    fg.appendChild(f);
    if (s.cap) fg.appendChild(el(`<figcaption><b>What to notice</b>${s.cap}</figcaption>`));
    content.appendChild(fg);
  }
  if (s.hook) content.appendChild(el(`<div class="callout hook"><span class="h">Memory hook</span><div>${s.hook}</div></div>`));
  if (s.flag) content.appendChild(el(`<div class="callout flag"><span class="h">⚑ Flag: notes vs standard references</span><div>${s.flag}</div></div>`));
  if (s.beyond) content.appendChild(el(`<div class="callout beyond"><span class="h">Beyond your notes</span><div>${s.beyond}</div></div>`));
  if (s.src) content.appendChild(el(`<div class="src">Source slides: ${esc(s.src)}</div>`));
  explainPanel(s, content);
  w.appendChild(content);
};

STEP_RENDER.ix = (w, s, { p, setNext }) => {
  w.appendChild(el(`<div class="kind"><span class="tag play">Interactive</span></div>`));
  w.appendChild(el(`<h2>${esc(s.title)}</h2>`));
  if (s.intro) w.appendChild(el(`<p class="lede" style="font-size:15.5px">${s.intro}</p>`));
  const done = p.ix[s.id];
  setNext(done ? 'Continue' : 'Skip for now');
  IX[s.kind](s.spec, w, res => {
    p.ix[s.id] = { total: res.total, errors: Math.min(res.errors, (p.ix[s.id] || { errors: 1e9 }).errors) };
    save(); setNext('Continue');
  });
};

STEP_RENDER.q = (w, s, { mid, p, setNext }) => {
  const prev = S.qs[s.q.id];
  setNext('Answer to continue', false);
  renderQ(s.q, w, {
    onAnswer: ok => {
      if (!ok) (SESSION.miss[mid] = SESSION.miss[mid] || new Set()).add(s.q.id);
      setNext('Continue');
    }
  });
  if (prev) { const sk = el(`<button class="btn ghost small" style="justify-self:start">Seen before · skip</button>`); sk.onclick = () => setNext('Continue'); w.appendChild(sk); }
};

STEP_RENDER.qhead = (w, s, { c }) => {
  const n = c.steps.filter(x => x.t === 'q').length;
  w.appendChild(el(`<div class="kind"><span class="tag check">Question round</span></div>`));
  w.appendChild(el(`<h2>${n} questions on everything you just learned</h2>`));
  w.appendChild(el(`<p class="lede">You chose to take questions at the end. Answer each one from memory; the explanation shows why the right answer is right and why the most tempting wrong answer is wrong.</p>`));
};

STEP_RENDER.lockin = (w, s, { mid, setNext }) => {
  const ids = new Set([...(SESSION.miss[mid] || [])]);
  Object.keys(S.mist).forEach(id => { if (QINDEX[id] && QINDEX[id].mid === mid) ids.add(id); });
  w.appendChild(el(`<div class="kind"><span class="tag check">Lock-in round</span></div>`));
  if (!ids.size) {
    w.appendChild(el(`<h2>Nothing to lock in</h2>`));
    w.appendChild(el(`<p class="lede">You have no open misses in this module. Next: recall it all from memory.</p>`));
    return;
  }
  const queue = shuffle([...ids]);
  const total = queue.length;
  w.appendChild(el(`<h2>Your misses, once more</h2>`));
  const info = el(`<p class="lede">Each question you missed comes back until you get it right. <span class="mono muted" data-left></span></p>`);
  w.appendChild(info);
  const host = el('<div></div>'); w.appendChild(host);
  setNext('Finish the round first', false);
  const skip = el(`<button class="btn ghost small" style="justify-self:start">Skip the round</button>`);
  skip.onclick = () => setNext('Continue');
  w.appendChild(skip);
  function nextQ() {
    host.innerHTML = '';
    $('[data-left]', info).textContent = `${total - queue.length}/${total} locked`;
    if (!queue.length) {
      sfx.win();
      host.appendChild(winBar('All misses locked in', null));
      SESSION.miss[mid] = new Set();
      setNext('Continue'); skip.remove(); return;
    }
    const id = queue.shift();
    renderQ(QINDEX[id].q, host, {
      onAnswer: ok => {
        if (!ok) queue.push(id);
        const nb = el(`<button class="btn small" style="margin-top:12px">${queue.length ? 'Next question' : 'Finish round'} ${I.next}</button>`);
        nb.onclick = nextQ; host.appendChild(nb);
      }
    });
  }
  nextQ();
};

STEP_RENDER.recall = (w, s, { mid, c }) => {
  w.appendChild(el(`<div class="kind"><span class="tag check">Recall screen</span></div>`));
  w.appendChild(el(`<h2>Say it before you see it</h2>`));
  w.appendChild(el(`<p class="lede">Write or say each list from memory, then reveal and mark yourself honestly. Anything you miss goes back to the front of your flashcards.</p>`));
  const box = el('<div class="recall"></div>');
  c.recall.forEach((r, i) => {
    const rc = el(`<div class="rc"><div class="p">${i + 1}. ${r.p}</div>
      <textarea id="rc-${mid}-${i}" placeholder="From memory…" aria-label="${esc(strip(r.p))}"></textarea>
      <div class="row"><button class="btn small" data-rev>Reveal</button></div></div>`);
    $('[data-rev]', rc).onclick = () => {
      const row = $('.row', rc);
      row.innerHTML = '';
      rc.insertBefore(el(`<div class="ans">${r.a}</div>`), row);
      const got = el(`<button class="btn small got">${I.check} I had it</button>`), miss = el(`<button class="btn small again">${I.x} I missed some</button>`);
      got.onclick = () => { row.innerHTML = '<span class="src" style="color:var(--teal)">Marked: had it</span>'; S.rec[`${mid}:${i}`] = 1; save(); sfx.ok(); };
      miss.onclick = () => { row.innerHTML = '<span class="src" style="color:var(--coral)">Marked: missed. Flashcard moved to the front.</span>'; S.rec[`${mid}:${i}`] = 0; if (r.fc) gradeCard(r.fc, false); save(); sfx.bad(); };
      row.append(got, miss);
    };
    box.appendChild(rc);
  });
  w.appendChild(box);
};

STEP_RENDER.hooks = (w, s, { c }) => {
  w.appendChild(el(`<div class="kind"><span class="tag teach">Memory hooks</span></div>`));
  w.appendChild(el(`<h2>Hooks to carry into the exam</h2>`));
  const box = el('<div class="hooks"></div>');
  c.hooks.forEach(h => box.appendChild(el(`<div class="hk"><span class="ic">${esc(h.ic)}</span><div><b>${esc(h.t)}</b><p>${esc(h.d)}</p></div></div>`)));
  w.appendChild(box);
};

STEP_RENDER.done = (w, s, { mid, mod, c, setNext }) => {
  const qids = c.steps.filter(x => x.t === 'q').map(x => x.q.id);
  const answered = qids.filter(id => S.qs[id]);
  const right = answered.filter(id => S.qs[id].ok).length;
  const ixs = Object.values(prog(mid).ix);
  w.appendChild(el(`<div class="done">
    <span class="tag teach">Module ${mod.n} complete</span>
    <div class="big">${answered.length ? pct(right, answered.length) + '%' : '--'}</div>
    <p class="muted">latest answer correct on ${right} of ${answered.length} questions</p>
    <div class="stats"><div><b>${ixs.length}</b><span>interactives done</span></div><div><b>${Object.keys(S.mist).filter(id => QINDEX[id] && QINDEX[id].mid === mid).length}</b><span>open mistakes</span></div><div><b>${(c.flash || []).length}</b><span>flashcards unlocked</span></div></div>
  </div>`));
  const acts = el(`<div style="display:grid;gap:10px;margin-top:6px">
    <button class="btn block" data-cards>${I.cards} Start flashcards</button>
    <button class="btn block" data-ar><span style="font-family:var(--f-ar)">ملخص عربي للوحدة</span></button></div>`);
  $('[data-cards]', acts).onclick = () => { prog(mid).done = true; save(); go('cards', { start: true }); };
  $('[data-ar]', acts).onclick = () => go('arabic', { mid });
  w.appendChild(acts);
  w.appendChild(el(`<p class="muted" style="font-size:13.5px;text-align:center">Come back tomorrow: the first flashcard reviews fall due in 1 day, then 3, 7, 16 and 35.</p>`));
  setNext('Finish module');
};

/* ---------- flashcards ---------- */
VIEWS.cards = (app, params) => {
  app.appendChild(topBar('Flashcards', 'Spaced repetition · 1 · 3 · 7 · 16 · 35 days'));
  const m = mainEl(); app.appendChild(m);
  const all = availableCards();
  if (!all.length) {
    m.appendChild(el(`<div class="empty">${I.cards.replace('<svg', '<svg style="width:40px;height:40px"')}<b>No cards yet</b><p>Cards unlock when you open a module.</p></div>`));
    const b = el(`<button class="btn primary">Open Module 1</button>`); b.onclick = () => openModule('m1'); $('.empty', m).appendChild(b);
    return;
  }
  if (params.start) return runCards(m, dueQueue());
  const q = dueQueue();
  const counts = [0, 0, 0, 0, 0, 0];
  all.forEach(c => { const s = S.srs[c.id]; if (!s || s.b < 0) counts[0]++; else counts[s.b + 1]++; });
  m.appendChild(el(`<div class="boxes" aria-label="Cards per box">${['NEW', '1D', '3D', '7D', '16D', '35D'].map((l, i) => `<div><b>${counts[i]}</b><span>${l}</span></div>`).join('')}</div>`));
  m.appendChild(el(`<p class="lede" style="margin-top:16px">${q.length ? `<b>${q.length}</b> card${q.length > 1 ? 's' : ''} due now. Missed cards come back first.` : `All caught up. Next review ${nextDueText() || 'soon'}.`}</p>`));
  const row = el('<div style="display:grid;gap:10px;margin-top:14px"></div>');
  if (q.length) { const b = el(`<button class="btn primary block">Review ${q.length} due ${I.next}</button>`); b.onclick = () => go('cards', { start: true }, true); row.appendChild(b); }
  const pr = el(`<button class="btn block">Practice 10 random cards</button>`);
  pr.onclick = () => { R.params = {}; m.innerHTML = ''; runCards(m, shuffle(all).slice(0, 10), true); };
  row.appendChild(pr);
  m.appendChild(row);
};

function runCards(m, queue, practice = false) {
  queue = queue.slice();
  const total = queue.length;
  let done = 0, got = 0;
  const host = el('<div></div>'); m.appendChild(host);
  function show() {
    host.innerHTML = '';
    if (!queue.length) {
      sfx.win();
      host.appendChild(el(`<div class="done"><span class="tag teach">Session done</span><div class="big">${got}/${done}</div><p class="muted">remembered on the first go${practice ? ' (practice does not change your schedule)' : ''}</p></div>`));
      const b = el(`<button class="btn block" style="margin-top:14px">Back to flashcards</button>`); b.onclick = () => go('cards', {}, true);
      host.appendChild(b); return;
    }
    const c = queue[0];
    const mod = modById(c.mid);
    const card = el(`<div class="fc" role="button" tabindex="0" aria-label="Flashcard. Tap to flip.">
      <div class="inner"><div class="face"><span class="eyebrow">Module ${mod.n} · question</span><div class="t">${c.f}</div><div class="meta"><span>tap to flip</span><span>${queue.length} left</span></div></div>
      <div class="face back"><span class="eyebrow">Answer</span><div class="b">${c.b}</div><div class="meta"><span>${esc(mod.title)}</span><span>${boxLabel(c.id)}</span></div></div></div></div>`);
    const flip = () => { card.classList.toggle('flipped'); btns.hidden = false; sfx.tap(); };
    card.onclick = flip; card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
    const btns = el(`<div class="fcbtns" hidden><button class="btn again">${I.x} Again</button><button class="btn got">${I.check} Got it</button></div>`);
    const [again, ok] = $$('button', btns);
    again.onclick = () => { if (!practice) gradeCard(c.id, false); queue.shift(); queue.splice(Math.min(3, queue.length), 0, c); if (!c._seen) { done++; c._seen = 1; } sfx.bad(); show(); };
    ok.onclick = () => { if (!practice) gradeCard(c.id, true); queue.shift(); if (!c._seen) { done++; got++; } delete c._seen; sfx.ok(); show(); };
    host.appendChild(card); host.appendChild(btns);
  }
  show();
}
function boxLabel(id) { const s = S.srs[id]; if (!s) return 'new'; if (s.b < 0) return 'relearning'; return `box ${s.b + 1} · ${INTV[s.b]}d`; }

/* ---------- search ---------- */
let SEARCH = null;
function buildSearch() {
  SEARCH = [];
  MODULES.forEach(m => {
    const c = CONTENT[m.id]; if (!c) return;
    const flow = flowOf(m.id);
    const at = s => flow.findIndex(f => f._i === s);
    c.steps.forEach((s, i) => {
      const where = `Module ${m.n} · ${m.title}`;
      if (s.t === 'card') SEARCH.push({ kind: 'Card', title: s.title, text: strip(s.body.join(' ') + ' ' + (s.cap || '') + ' ' + (s.hook || '') + ' ' + (s.flag || '')), where, go: () => openModule(m.id, at(i)) });
      if (s.t === 'ix') SEARCH.push({ kind: 'Interactive', title: s.title, text: strip(s.intro || ''), where, go: () => openModule(m.id, at(i)) });
      if (s.t === 'q') SEARCH.push({ kind: 'Question', title: strip(s.q.stem), text: strip((s.q.opts ? 'Answer: ' + s.q.opts[0] + ' · ' : '') + (s.q.why || s.q.model || '')), where, go: () => openModule(m.id, at(i)) });
      if (s.t === 'card' && s.fig) (FIGS[s.fig].labels || []).forEach(l => { SEARCH.push({ kind: 'Figure label', title: l.en + ' · ' + l.ar, text: l.note || '', where: where + ' · figure', go: () => openModule(m.id, at(i)), key: s.fig + l.id }); });
    });
    (c.flash || []).forEach(f => SEARCH.push({ kind: 'Flashcard', title: strip(f.f), text: strip(f.b), where: `Module ${m.n} · flashcards`, go: () => go('cards') }));
    (c.hooks || []).forEach(h => SEARCH.push({ kind: 'Memory hook', title: h.t, text: h.d, where: `Module ${m.n} · hooks`, go: () => openModule(m.id, flow.findIndex(f => f.t === 'hooks')) }));
  });
  const seen = new Set();
  SEARCH = SEARCH.filter(x => { const k = x.kind + x.title; if (seen.has(k)) return false; seen.add(k); return true; });
}
function hl(text, terms) {
  let t = esc(text);
  terms.forEach(w => { if (w.length > 1) t = t.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
  return t;
}
VIEWS.search = (app, params) => {
  app.appendChild(topBar('Search', 'Cards · questions · labels · flashcards'));
  const m = mainEl(); app.appendChild(m);
  if (!SEARCH) buildSearch();
  const box = el(`<div class="search"><div style="position:relative">${I.search}<input id="q-search" type="search" placeholder="Try “pelvis”, “Cowper”, “6.5”" autocomplete="off" aria-label="Search everything"></div></div>`);
  m.appendChild(box);
  const res = el('<div class="results" aria-live="polite"></div>'); m.appendChild(res);
  const inp = $('input', box);
  function run() {
    const q = inp.value.trim().toLowerCase();
    R.params.q = inp.value;
    res.innerHTML = '';
    if (!q) { res.appendChild(el(`<div class="empty"><p>Search ${SEARCH.length} items across every built module. Results show where each one lives; tap to jump there.</p></div>`)); return; }
    const terms = q.split(/\s+/).filter(Boolean);
    const hits = SEARCH.map(x => {
      const T = x.title.toLowerCase(), X = x.text.toLowerCase();
      if (!terms.every(w => T.includes(w) || X.includes(w))) return null;
      return { x, score: terms.reduce((a, w) => a + (T.includes(w) ? 3 : 1), 0) };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 60);
    if (!hits.length) { res.appendChild(el(`<div class="empty"><b>No matches for “${esc(inp.value)}”</b><p>Try a shorter word or the English exam term.</p></div>`)); return; }
    hits.forEach(({ x }) => {
      const snip = x.text.length > 160 ? x.text.slice(0, 160) + '…' : x.text;
      const b = el(`<button class="res"><span class="where">${esc(x.kind)} · ${esc(x.where)}</span><b>${hl(x.title, terms)}</b>${snip ? `<p>${hl(snip, terms)}</p>` : ''}</button>`);
      b.onclick = x.go;
      res.appendChild(b);
    });
  }
  inp.oninput = run;
  if (params.q) inp.value = params.q;
  run();
  setTimeout(() => inp.focus(), 50);
};

/* ---------- mistakes ---------- */
VIEWS.mistakes = (app) => {
  app.appendChild(topBar('My mistakes', 'Stay here until answered right', { back: true }));
  const m = mainEl(); app.appendChild(m);
  const ids = Object.keys(S.mist).filter(id => QINDEX[id]).sort((a, b) => S.mist[b] - S.mist[a]);
  if (!ids.length) { m.appendChild(el(`<div class="empty">${I.check.replace('<svg', '<svg style="width:40px;height:40px;color:var(--teal)"')}<b>No open mistakes</b><p>Questions you miss land here and leave only when you answer them correctly.</p></div>`)); return; }
  const drill = el(`<button class="btn primary block">Drill all ${ids.length} ${I.next}</button>`);
  m.appendChild(drill);
  const list = el('<div class="list" style="margin-top:14px"></div>');
  ids.forEach(id => {
    const { q, mid } = QINDEX[id], mod = modById(mid);
    const b = el(`<button class="res"><span class="where">Module ${mod.n} · ${esc(mod.title)} · missed ${S.qs[id] ? S.qs[id].w : 1}×</span><b>${strip(q.stem)}</b></button>`);
    b.onclick = () => { m.innerHTML = ''; drillList(m, [id]); };
    list.appendChild(b);
  });
  m.appendChild(list);
  drill.onclick = () => { m.innerHTML = ''; drillList(m, shuffle(ids)); };
};
function drillList(m, ids) {
  const host = el('<div></div>'); m.appendChild(host);
  let i = 0;
  function next() {
    host.innerHTML = '';
    if (i >= ids.length) {
      const left = ids.filter(id => S.mist[id]).length;
      host.appendChild(winBar(left ? `${ids.length - left} fixed · ${left} still open` : 'All fixed', null));
      const b = el(`<button class="btn block" style="margin-top:12px">Back to mistakes</button>`); b.onclick = () => go('mistakes', {}, true);
      host.appendChild(b); return;
    }
    host.appendChild(el(`<p class="eyebrow" style="margin-bottom:10px">${i + 1} of ${ids.length}</p>`));
    renderQ(QINDEX[ids[i]].q, host, { onAnswer: () => { const b = el(`<button class="btn primary small" style="margin-top:12px">${i + 1 < ids.length ? 'Next' : 'Finish'} ${I.next}</button>`); b.onclick = () => { i++; next(); }; host.appendChild(b); } });
  }
  next();
}

/* ---------- more / settings / arabic / soon ---------- */
VIEWS.more = (app) => {
  app.appendChild(topBar('More', 'Tools and settings'));
  const m = mainEl(); app.appendChild(m);
  m.appendChild(toolsSection());
};

VIEWS.settings = (app) => {
  app.appendChild(topBar('Settings', 'Saved on this device', { back: true }));
  const m = mainEl(); app.appendChild(m);
  const box = el('<div class="list"></div>'); m.appendChild(box);
  function seg(key, opts, title, desc, after) {
    const s = el(`<div class="set"><h3>${title}</h3>${desc ? `<p>${desc}</p>` : ''}<div class="seg" role="group" aria-label="${esc(title)}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${S.set[key] === v}">${l}</button>`).join('')}</div></div>`);
    $$('button', s).forEach(b => b.onclick = () => { let v = b.dataset.v; if (v === 'true') v = true; if (v === 'false') v = false; S.set[key] = v; save(); after && after(); render(); });
    box.appendChild(s);
  }
  seg('theme', [['auto', 'Auto'], ['dark', 'Dark'], ['light', 'Light']], 'Theme', 'Auto follows your device.', applyTheme);
  seg('qmode', [['inline', 'After each idea'], ['end', 'End of module']], 'Question placement', 'Inline questions test each idea right after you learn it. End-of-module puts them all in one round.');
  seg('sound', [[true, 'On'], [false, 'Off']], 'Sound effects', 'Soft monitor tones for right and wrong answers.');
  seg('arLabels', [[false, 'English'], [true, 'العربية']], 'Figure labels', 'Language of the labels drawn on anatomy figures.');
  const reset = el(`<div class="set"><h3>Reset progress</h3><p>Clears module progress, answers, mistakes and flashcard schedule on this device.</p><button class="btn danger" data-r>Reset everything</button></div>`);
  let armed = false;
  $('[data-r]', reset).onclick = e => {
    if (!armed) { armed = true; e.target.textContent = 'Tap again to confirm reset'; setTimeout(() => { armed = false; e.target.textContent = 'Reset everything'; }, 4000); return; }
    const keep = S.set; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaults(), { set: keep }); save(); toast('Progress cleared'); R.stack = []; go('home', {}, true);
  };
  box.appendChild(reset);
  box.appendChild(el(`<p class="muted" style="font-size:12.5px">Source: Chapter 22 slide decks (files A and B). “Beyond your notes” marks anything added from standard references. ⚑ marks where your notes differ from standard references; the site keeps your notes’ version for the exam.</p>`));
};

VIEWS.arabic = (app, { mid }) => {
  const mods = mid ? [modById(mid)] : MODULES.filter(x => ready(x.id));
  app.appendChild(topBar('ملخص عربي', mid ? `Module ${modById(mid).n} · ${modById(mid).title}` : 'All built modules', { back: true }));
  const m = mainEl(); app.appendChild(m);
  const w = el('<div class="arwrap ar" lang="ar" dir="rtl"></div>');
  mods.forEach(x => {
    w.appendChild(el(`<h2 style="font-size:22px">الوحدة ${x.n}: ${esc(x.ar)}</h2>`));
    const c = CONTENT[x.id];
    const d = el('<div class="arwrap"></div>'); d.innerHTML = c.arabic; w.appendChild(d);
  });
  if (!mid) w.appendChild(el(`<p class="muted">ملخصات الوحدات ٢–٨ ستضاف مع البناء الكامل.</p>`));
  m.appendChild(w);
  if (mid) { const b = el(`<button class="btn block" style="margin-top:16px">Back to the module</button>`); b.onclick = back; m.appendChild(b); }
};

VIEWS.soon = (app, { what }) => {
  app.appendChild(topBar(what, 'Arrives in the full build', { back: true }));
  const m = mainEl(); app.appendChild(m);
  const d = {
    'Exam builder': 'Choose length, modules, an optional timer, instant or end feedback. Ends with a weakest-first breakdown and one-tap drill, plus a mixed interleaved review mode.',
    'Numbers drill': 'Every number in the chapter (500 mL/day, 0.5 mL/kg/h, 70%, 6.5%, 10° head-down, 50 mL NS, 2–3 days × 3–5 h …) as rapid-fire recall.',
    'Cheat sheet': 'One searchable page with every table, list and classification from both files.',
    'Entity hub': 'Every condition, drug and procedure as a card, with side-by-side compare and a “which one is it?” quiz.',
    'Visual lab': 'Every interactive, figure, ECG and photo in one gallery, full screen, with a picture quiz.',
  }[what] || '';
  m.appendChild(el(`<div class="empty">${I.spark.replace('<svg', '<svg style="width:40px;height:40px;color:var(--amber)"')}<b>Coming in Phase 4</b><p style="max-width:46ch">${esc(d)}</p></div>`));
};
