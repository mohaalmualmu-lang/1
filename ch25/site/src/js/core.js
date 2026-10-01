/* ===== core: state, storage, helpers, sound, Claude ===== */
const APP_KEY = 'heme25.v1';
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOST_THEME = document.documentElement.getAttribute('data-theme');

function defaults() {
  return { v: 1, prog: {}, qs: {}, srs: {}, mist: {}, rec: {}, started: {}, last: null,
    set: { qmode: 'inline', theme: 'auto', sound: true, arLabels: false } };
}
function loadState() {
  try {
    const raw = localStorage.getItem(APP_KEY);
    if (raw) {
      const d = JSON.parse(raw), base = defaults();
      return Object.assign(base, d, { set: Object.assign(base.set, d.set || {}) });
    }
  } catch (e) {}
  return defaults();
}
const S = loadState();
let _saveT;
function save() {
  clearTimeout(_saveT);
  _saveT = setTimeout(() => { try { localStorage.setItem(APP_KEY, JSON.stringify(S)); } catch (e) {} }, 120);
}

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function strip(html) { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g, ' ').trim(); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }

function applyTheme() {
  const r = document.documentElement, t = S.set.theme;
  if (t === 'auto') { if (HOST_THEME) r.setAttribute('data-theme', HOST_THEME); else r.removeAttribute('data-theme'); }
  else r.setAttribute('data-theme', t);
}

function toast(msg) {
  const t = el(`<div class="toast" role="status">${esc(msg)}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/* ---- sound: short monitor-style tones, quiet by design ---- */
let _ac = null;
function tone(freqs, dur = 0.09, type = 'sine', gain = 0.05) {
  if (!S.set.sound) return;
  try {
    _ac = _ac || new (window.AudioContext || window.webkitAudioContext)();
    let t = _ac.currentTime;
    freqs.forEach(f => {
      const o = _ac.createOscillator(), g = _ac.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(_ac.destination); o.start(t); o.stop(t + dur + 0.02);
      t += dur * 0.9;
    });
  } catch (e) {}
}
const sfx = {
  ok: () => tone([880, 1320], 0.09, 'sine', 0.045),
  bad: () => tone([196, 147], 0.12, 'triangle', 0.05),
  win: () => tone([660, 880, 1320], 0.1, 'sine', 0.04),
  tap: () => tone([1200], 0.03, 'sine', 0.02),
};

/* ---- Claude (sample capability): explain differently + grading ---- */
let SAMPLE = null;
const claudeReady = (async () => {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      SAMPLE = await window.claude.use('sample');
    }
  } catch (e) { SAMPLE = null; }
  document.documentElement.classList.toggle('has-claude', !!SAMPLE);
  $$('[data-needs-claude]').forEach(n => n.hidden = !SAMPLE);
  return SAMPLE;
})();
function claudeErr(e) {
  const c = e && e.code;
  if (c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') {
    SAMPLE = null; $$('[data-needs-claude]').forEach(n => n.hidden = true);
    return 'Claude is not available on this page, so this button is now hidden.';
  }
  if (c === 'rate_limited') return 'Too many requests right now. Try again in a minute.';
  if (c === 'session_expired') return 'Sign in to Claude again, then retry.';
  if (c === 'cancelled') return '';
  return 'Claude could not answer this time. Tap to try again.';
}

/* ---- icons (inline SVG, stroke) ---- */
const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7c-2-1.6-4.8-2.2-8-2v13c3.2-.2 6 .4 8 2 2-1.6 4.8-2.2 8-2V5c-3.2-.2-6 .4-8 2Z"/><path d="M12 7v13"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="6" width="13" height="14" rx="2.5"/><path d="M8 3.5h10a2.5 2.5 0 0 1 2.5 2.5v11"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.6-4.6"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.6-4.6M10.5 7.5v6M7.5 10.5h6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
  mistake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.2v.1"/></svg>',
  hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 9h15M4 15h15M10 4 8 20M16 4l-2 16"/></svg>',
  sheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8h5M9 12.5h7M9 16h7"/></svg>',
  exam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/></svg>',
  hub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="2.6"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M6.6 7.3 10 10.3M17.4 7.3 14 10.3M6.6 16.7l3.4-3M17.4 16.7 14 13.7"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-5-5-8.5 8.5"/></svg>',
  arabic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h9M8.5 5v2.5c0 4-2 6.5-4.5 7.5M6 10c1.2 2.4 3.3 4 6 4.7"/><path d="m13 20 4-9 4 9M14.5 17h5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  drill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h3l2-5 4 10 3-8 2 3h4"/></svg>',
};

/* ---- lightbox: any figure, full screen ---- */
function openLightbox(figKey, opts = {}) {
  const lb = el(`<div class="lb" role="dialog" aria-modal="true" aria-label="Figure">
    <div class="bar"><b>${esc(opts.title || 'Figure')}</b>
      <button class="ibtn" data-z aria-label="Zoom">${I.zoom}</button>
      <button class="ibtn" data-x aria-label="Close">${I.close}</button></div>
    <div class="body"></div>
    ${opts.caption ? `<div class="cap">${opts.caption}</div>` : ''}</div>`);
  const body = $('.body', lb);
  body.appendChild(figureEl(figKey, { labels: opts.labels !== false, only: opts.only }));
  const lg = opts.labels !== false && legendEl(figKey, opts.only); if (lg) body.appendChild(lg);
  const close = () => { lb.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  $('[data-x]', lb).onclick = close;
  $('[data-z]', lb).onclick = () => body.classList.toggle('big');
  document.addEventListener('keydown', onKey);
  document.body.appendChild(lb);
  $('[data-x]', lb).focus();
}

/* figure element: image + optional label chips (study mode) */
function figureEl(key, opts = {}) {
  const f = FIGS[key];
  const wrap = el(`<div class="fig"><img alt="${esc(opts.alt || (f && f.alt) || key)}" src="${IMG[key]}" loading="lazy" decoding="async"></div>`);
  if (f && opts.labels !== false) {
    const only = opts.only ? new Set(opts.only) : null;
    let n = 0;
    (f.labels || []).forEach(l => {
      if (l.hide || (only && !only.has(l.id)) || (!only && l.path && !opts.withPath)) return;
      if (f.dense) { const [x, y] = pinCenter(l); wrap.appendChild(el(`<span class="pin num" style="left:${x}%;top:${y}%">${++n}</span>`)); return; }
      wrap.appendChild(pinEl(l, S.set.arLabels));
    });
  }
  return wrap;
}
/* legend for dense figures (numbered dots) */
function legendEl(key, only) {
  const f = FIGS[key]; if (!f || !f.dense) return null;
  const set = only ? new Set(only) : null;
  const ls = (f.labels || []).filter(l => !l.hide && (!set || set.has(l.id)));
  return el(`<ol class="legend fixed">${ls.map((l, i) => `<li><b>${i + 1}</b>${esc(S.set.arLabels ? l.ar : l.en)}</li>`).join('')}</ol>`);
}
function pinCenter(l) { return [(l.box[0] + l.box[2]) / 2, (l.box[1] + l.box[3]) / 2]; }
function pinEl(l, ar) {
  const [x, y] = pinCenter(l);
  const a = l.box[0] < 12 ? 'l' : l.box[2] > 88 ? 'r' : 'c';
  const pos = a === 'l' ? `left:${l.box[0]}%;transform:translate(0,-50%)` : a === 'r' ? `left:${l.box[2]}%;transform:translate(-100%,-50%)` : `left:${x}%`;
  return el(`<span class="pin${ar ? ' ar' : ''}" style="${pos};top:${y}%" title="${esc(l.note || '')}">${esc(ar ? l.ar : (l.short || l.en))}</span>`);
}
