/*! read-aloud.js v1.0 — drop-in "Listen" for any web page.
 * Reads text sentence by sentence with the browser's own voices (Web Speech API),
 * tints the sentence being read and puts a darker highlight on the word being
 * spoken, with a floating player: from start · previous sentence · play/pause ·
 * next sentence · speed · close. Remembers where you stopped (per element),
 * survives pauses, screen-off and reloads. English + Arabic (and any language the
 * device has a voice for). No dependencies, no build step, no network.
 *
 *   <script src="read-aloud.js"></script>
 *   <script>ReadAloud.init({ targets: 'article, .card' });</script>
 *
 * or zero-code:  <script src="read-aloud.js" data-targets="article, .card"></script>
 * Full API: ReadAloud.read(el) · toggle(el, btn) · pause() · resume() · next() · prev()
 *   · restart() · stop() · setRate(r) · cycleRate() · setVoice(name) · voices(lang)
 *   · button(el) · attach(root) · forget(el) · state() · destroy()
 * MIT licence.
 */
(function (global, factory) {
  const api = factory(global);
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  if (global && typeof global === 'object') global.ReadAloud = global.ReadAloud || api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function (global) {
  'use strict';
  const doc = global && global.document;
  const noop = () => { };
  if (!doc) { // server-side render / worker: harmless stub
    const stub = { supported: false, state: () => ({ state: 'idle' }) };
    ['init', 'attach', 'read', 'toggle', 'pause', 'resume', 'next', 'prev', 'restart', 'stop', 'setRate', 'cycleRate', 'setVoice', 'forget', 'destroy'].forEach(k => { stub[k] = noop; });
    stub.button = () => null; stub.voices = () => []; return stub;
  }
  if (global.ReadAloud && global.ReadAloud.__ra) return global.ReadAloud;

  const synth = global.speechSynthesis;
  const OK = !!(synth && global.SpeechSynthesisUtterance);
  const HL = !!(global.CSS && global.CSS.highlights && global.Highlight); // CSS Custom Highlight API: no DOM changes

  /* ---------------- options ---------------- */
  const DEFAULTS = {
    targets: '',            // selector: elements that get a Listen button (leave '' to place your own buttons)
    button: 'end',          // 'end' | 'start' | function(target, button) to place the button yourself
    skip: '',               // extra selector of things never read (e.g. '.source, .badge')
    lang: '',               // language of the page's Latin-script text ('' = <html lang> or 'en')
    ui: '',                 // 'en' | 'ar' button/player labels ('' = from <html lang>)
    rates: [0.75, 0.9, 1, 1.15, 1.3, 1.5],
    rate: 1,                // starting speed (the user's choice is remembered after that)
    voice: '',              // preferred voice name (optional)
    storageKey: 'read-aloud',
    remember: true,         // resume at the sentence where reading stopped
    stopOnNavigate: true,   // stop on hashchange / popstate (single-page apps)
    pauseWhenHidden: true,  // pause when the tab/app is hidden (screen off, call)
    autoScroll: true,       // keep the spoken word on screen, clear of fixed bars and the player
    bottom: null,           // px (or function) to keep the player above; null = detect fixed bottom bars
    clean: null,            // function(text, lang, element) -> text: extra pronunciation fixes
    keyOf: null,            // function(element) -> stable key used to remember the place
    onState: null           // function(state) called on every change (also a 'readaloud:state' event)
  };
  let O = Object.assign({}, DEFAULTS);

  /* ---------------- labels ---------------- */
  const LABELS = {
    en: { listen: 'Listen', pause: 'Pause', resume: 'Resume', reading: 'Reading', paused: 'Paused', sentence: 'sentence', restart: 'Read from the start', prev: 'Previous sentence', next: 'Next sentence', play: 'Pause or resume', speed: 'Reading speed', close: 'Close (your place is saved)', region: 'Reading controls', title: 'Listen to this', resumeAt: (i, n) => 'Resuming at sentence ' + i + ' of ' + n + ' — ⏮ goes back', nothing: 'Nothing to read here.', noVoice: 'No voice for this language on this device.', finished: 'Finished reading.', unsupported: 'This browser cannot read aloud.', stopped: e => 'Reading paused (' + e + ') — press ▶ to continue.' },
    ar: { listen: 'استمع', pause: 'إيقاف مؤقت', resume: 'أكمل', reading: 'يقرأ', paused: 'متوقف', sentence: 'جملة', restart: 'من البداية', prev: 'الجملة السابقة', next: 'الجملة التالية', play: 'إيقاف أو متابعة', speed: 'سرعة القراءة', close: 'إغلاق (مكانك محفوظ)', region: 'أدوات القراءة', title: 'استمع لهذا النص', resumeAt: (i, n) => 'نكمل من الجملة ' + i + ' من ' + n + ' — ⏮ للرجوع', nothing: 'لا يوجد نص للقراءة هنا.', noVoice: 'لا يوجد صوت لهذه اللغة على هذا الجهاز.', finished: 'انتهت القراءة.', unsupported: 'هذا المتصفح لا يدعم القراءة الصوتية.', stopped: e => 'توقفت القراءة (' + e + ') — اضغط ▶ للمتابعة.' }
  };
  const T = () => LABELS[(O.ui || doc.documentElement.lang || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en'];

  const ICON = {
    speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    play: '<path d="M7 5l12 7-12 7z"/>',
    prev: '<path d="M6 5v14"/><path d="M18 5l-9 7 9 7z"/>',
    next: '<path d="M18 5v14"/><path d="M6 5l9 7-9 7z"/>',
    restart: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  const svg = k => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[k] + '</svg>';
  const h = (tag, attrs) => { const e = doc.createElement(tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); return e; };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const reduced = () => { try { return global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  /* ---------------- styles (host can override any --ra-* token) ---------------- */
  const CSS_TEXT = `
:where(:root){--ra-accent:#9a5c00;--ra-on-accent:#fff;--ra-soft:rgba(214,146,20,.2);--ra-surface:#fff;--ra-text:#14262b;--ra-muted:#5b6f74;--ra-line:#cfdcdf;--ra-shadow:0 10px 30px rgba(0,0,0,.18);--ra-radius:16px;--ra-z:2147483000}
@media (prefers-color-scheme:dark){:where(:root){--ra-accent:#f2b648;--ra-on-accent:#1a1200;--ra-soft:rgba(242,182,72,.2);--ra-surface:#132225;--ra-text:#e3eef0;--ra-muted:#93a9ad;--ra-line:#2e454b;--ra-shadow:0 10px 30px rgba(0,0,0,.45)}}
.ra-btn{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;margin:6px 0 0;border-radius:999px;border:1px solid var(--ra-line);background:transparent;color:inherit;font:inherit;font-size:.92em;font-weight:600;line-height:1;cursor:pointer;vertical-align:middle;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.ra-btn svg{width:20px;height:20px;flex:none;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.ra-btn.ra-active{border-color:var(--ra-accent);color:var(--ra-accent);background:var(--ra-soft)}
.ra-btn:focus-visible,.ra-pb:focus-visible{outline:2px solid var(--ra-accent);outline-offset:2px}
.ra-player{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:var(--ra-z);box-sizing:border-box;width:min(520px,calc(100vw - 24px));
  background:var(--ra-surface);color:var(--ra-text);border:1px solid var(--ra-accent);border-radius:var(--ra-radius);box-shadow:var(--ra-shadow);padding:6px 8px 8px;display:grid;gap:4px;
  font:500 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Arabic",Tahoma,sans-serif;text-align:left}
.ra-player[hidden],.ra-toast[hidden]{display:none!important}
.ra-player *{box-sizing:border-box}
.ra-top,.ra-row{display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0}
.ra-lab{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ra-accent);padding:0 2px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ra-pb{appearance:none;-webkit-appearance:none;margin:0;font:inherit;color:inherit;cursor:pointer;min-width:46px;min-height:46px;border-radius:12px;border:1px solid var(--ra-line);background:transparent;display:grid;place-items:center;padding:0 8px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.ra-pb svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.ra-pb.ra-main{min-width:64px;background:var(--ra-accent);border-color:var(--ra-accent);color:var(--ra-on-accent)}
.ra-pb.ra-main svg{fill:currentColor}
.ra-pb.ra-close{min-width:36px;min-height:36px;border:0;color:var(--ra-muted)}
.ra-pb.ra-speed{font-weight:700;font-size:15px;font-variant-numeric:tabular-nums;min-width:62px;color:var(--ra-accent)}
.ra-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(90px + env(safe-area-inset-bottom,0px));z-index:var(--ra-z);max-width:calc(100vw - 32px);padding:10px 14px;border-radius:12px;background:var(--ra-text);color:var(--ra-surface);font:600 13.5px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Arabic",Tahoma,sans-serif;box-shadow:var(--ra-shadow);text-align:center}
.ra-w.ra-s{background:var(--ra-soft);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.ra-w.ra-on{background:var(--ra-accent);color:var(--ra-on-accent);border-radius:3px;box-shadow:0 0 0 2px var(--ra-accent)}
.ra-spacer{height:0}
@media (max-height:520px){
  .ra-player{display:flex;align-items:center;gap:4px;padding:4px 6px}
  .ra-top{order:2}.ra-lab{display:none}.ra-row{flex:1;gap:4px}
  .ra-pb{min-width:40px;min-height:42px}.ra-pb.ra-main{min-width:56px}.ra-pb.ra-speed{min-width:52px}
}
@media (max-height:520px) and (min-width:600px){.ra-player{left:auto;right:12px;transform:none;width:min(440px,calc(58vw - 24px))}}
@media print{.ra-player,.ra-toast,.ra-btn{display:none!important}}`;

  function injectCSS() {
    if (doc.getElementById('ra-style')) return;
    const st = h('style', { id: 'ra-style' }); st.textContent = CSS_TEXT;
    (doc.head || doc.documentElement).prepend(st); // first, so the host's own CSS can override
  }
  // ::highlight() colours are written literally (var() support there differs between browsers)
  function highlightCSS(el) {
    if (!HL) return;
    let st = doc.getElementById('ra-hl'); if (!st) { st = h('style', { id: 'ra-hl' }); (doc.head || doc.documentElement).append(st); }
    const cs = getComputedStyle(el && el.isConnected ? el : doc.documentElement), v = (k, d) => (cs.getPropertyValue(k) || '').trim() || d;
    st.textContent = '::highlight(ra-sentence){background-color:' + v('--ra-soft', 'rgba(214,146,20,.2)') + '}::highlight(ra-word){background-color:' + v('--ra-accent', '#9a5c00') + ';color:' + v('--ra-on-accent', '#fff') + '}';
  }

  /* ---------------- saved state ---------------- */
  let S = { pos: {}, rate: 0, voice: '', cal: {} };
  let saveT = 0;
  function load() { try { const o = JSON.parse(global.localStorage.getItem(O.storageKey) || 'null'); if (o && typeof o === 'object') S = Object.assign(S, o); } catch (e) { } if (!S.rate) S.rate = O.rate || 1; if (O.voice && !S.voice) S.voice = O.voice; }
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      const keys = Object.keys(S.pos); if (keys.length > 300) keys.sort((a, b) => (S.pos[a][1] || 0) - (S.pos[b][1] || 0)).slice(0, keys.length - 300).forEach(k => delete S.pos[k]);
      try { global.localStorage.setItem(O.storageKey, JSON.stringify(S)); } catch (e) { }
    }, 150);
  }

  /* ---------------- text → blocks → sentences → words ---------------- */
  const BASE_SKIP = 'script,style,noscript,template,svg,math,canvas,video,audio,iframe,object,button,select,textarea,input,option,pre,kbd,samp,[aria-hidden="true"],[hidden],.ra-skip,.ra-btn,.ra-player,.ra-toast';
  const skipSel = () => BASE_SKIP + (O.skip ? ',' + O.skip : '');
  const AR = /[؀-ۿ]/g, LAT = /[A-Za-z]/g;

  // readable blocks in document order; each block = text nodes rendered on one "line of thought"
  function blocksOf(root) {
    const out = [], sel = skipSel();
    const walk = el => {
      let run = null;
      const flush = () => { if (run && /\S/.test(run.nodes.map(n => n.nodeValue).join(''))) out.push(run); run = null; };
      const visit = list => {
        for (const n of list) {
          if (n.nodeType === 3) { if (!run) run = { el, nodes: [] }; run.nodes.push(n); continue; }
          if (n.nodeType !== 1) continue;
          try { if (n.matches(sel)) continue; } catch (e) { }
          if (n.tagName === 'BR') { flush(); continue; }
          const cs = getComputedStyle(n), d = cs.display;
          if (d === 'none' || cs.visibility === 'hidden') continue;
          if (d === 'contents' || d.startsWith('inline') || d.startsWith('ruby')) visit(n.childNodes);
          else { flush(); walk(n); }
        }
      };
      visit(el.childNodes); flush();
    };
    try { if (root.matches(skipSel())) return out; } catch (e) { }
    walk(root);
    return out;
  }
  // words as they appear on the page (a word split by inline tags, e.g. <b>Hel</b>lo, is one word)
  function domWords(nodes) {
    const W = []; let glued = false;
    nodes.forEach(node => {
      const v = node.nodeValue; if (!v) return;
      const re = /\S+/g; let m, first = true;
      while ((m = re.exec(v))) {
        const seg = { node, s: m.index, e: m.index + m[0].length };
        if (first && m.index === 0 && glued && W.length) { const w = W[W.length - 1]; w.segs.push(seg); w.t += m[0]; }
        else W.push({ segs: [seg], t: m[0] });
        first = false;
      }
      glued = /\S$/.test(v);
    });
    return W;
  }
  function langOf(el, text) {
    const a = (text.match(AR) || []).length, l = (text.match(LAT) || []).length;
    if (a > l) return 'ar';
    const tag = (O.lang || ((el.closest && el.closest('[lang]')) || doc.documentElement).getAttribute('lang') || 'en').toLowerCase().split(/[-_]/)[0];
    return tag === 'ar' ? 'en' : tag; // Latin text inside an Arabic page: English
  }
  function clean(t, lang, el) {
    t = String(t || '').replace(/\s+/g, ' ');
    const ar = lang === 'ar';
    if (!ar) t = t.replace(/[(\[]?\s*[؀-ۿ][؀-ۿً-ٟ\s،؛؟]*[)\]]?/g, ' '); // Arabic glosses inside English text
    t = t.replace(/\[\d+(?:\s*[,–-]\s*\d+)*\]/g, ' ')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}️•·▪◦✓✔✗✘]/gu, ' ');
    if (!ar) t = t.replace(/\s*(?:→|⇒|➔|->)\s*/g, ', leads to, ').replace(/\s*(?:←|<-)\s*/g, ', from, ')
      .replace(/(\d)\s*–\s*(\d)/g, '$1 to $2').replace(/°\s*C\b/g, ' degrees Celsius').replace(/°\s*F\b/g, ' degrees Fahrenheit').replace(/°/g, ' degrees')
      .replace(/≥/g, ' at least ').replace(/≤/g, ' at most ').replace(/±/g, ' plus or minus ')
      .replace(/\bvs\.?(?=\s)/gi, 'versus').replace(/\be\.g\.,?/gi, 'for example,').replace(/\bi\.e\.,?/gi, 'that is,').replace(/\betc\./gi, 'et cetera.');
    else t = t.replace(/\s*(?:→|⇒|->)\s*/g, '، ثم ').replace(/(\d)\s*–\s*(\d)/g, '$1 إلى $2');
    t = t.replace(/\(\s*[.,;:]?\s*\)/g, ' ').replace(/\s+([.,;:!?،؛؟])/g, '$1').replace(/\s+/g, ' ').trim();
    if (typeof O.clean === 'function') { try { const r = O.clean(t, lang, el); if (typeof r === 'string') t = r.replace(/\s+/g, ' ').trim(); } catch (e) { } }
    return t;
  }
  // sentence pieces [{s0, t}] of a cleaned text; long sentences are split at a comma near the middle
  // (some online voices stop after ~15 s and "previous sentence" should not jump too far)
  function sentences(text) {
    const cut = []; const re = /[.!?؟]+["”’)\]]*(?=\s|$)/g; let m, last = 0;
    while ((m = re.exec(text))) {
      const e = m.index + m[0].length, before = text.slice(last, m.index).split(' ').pop();
      if (/^(?:[A-Z]|dr|mr|mrs|ms|prof|st|no|fig|approx|ca|vol|p|pp)$/i.test(before)) continue; // abbreviation
      if (e - last >= 25) { cut.push(e); last = e; }
    }
    if (!cut.length || cut[cut.length - 1] < text.length) cut.push(text.length);
    for (let q = 0; q < cut.length; q++) {
      const a = q ? cut[q - 1] : 0, b = cut[q]; if (b - a <= 230) continue;
      const mid = (a + b) / 2, sub = /[,;:،؛—–]\s/g; sub.lastIndex = a + 60; let best = -1, sm;
      while ((sm = sub.exec(text)) && sm.index < b - 60) if (best < 0 || Math.abs(sm.index - mid) < Math.abs(best - mid)) best = sm.index + 1;
      if (best > 0) { cut.splice(q, 0, best); q--; }
    }
    const out = []; let a = 0;
    cut.forEach(b => { const p = text.slice(a, b), t = p.trim(); if (t) out.push({ s0: a + (p.length - p.trimStart().length), t }); a = b; });
    return out;
  }
  const wnorm = t => String(t).toLowerCase().replace(/[’']/g, '').replace(/[ً-ٟـ]/g, '').replace(/[^a-z0-9%À-ɏء-ي٠-٩]+/g, '');
  const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
  // map every spoken word to a page word: longest common subsequence, unmatched words spread between neighbours
  function align(spoken, W) {
    const n = spoken.length, m = W.length, at = new Array(n).fill(-1);
    if (!n || !m) return at;
    const dn = W.map(w => wnorm(w.t)), dr = W.map(w => { const r = ROMAN[w.t.replace(/[^A-Za-z]/g, '')]; return r ? String(r) : ''; });
    const eq = (i, j) => { const a = spoken[i].n, b = dn[j]; return !!a && ((!!b && (a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a))))) || dr[j] === a); };
    if (n * m <= 1500000) {
      const C = m + 1, L = new Uint16Array((n + 1) * C);
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i * C + j] = eq(i, j) ? 1 + L[(i + 1) * C + j + 1] : Math.max(L[(i + 1) * C + j], L[i * C + j + 1]);
      for (let i = 0, j = 0; i < n && j < m;) { if (eq(i, j) && L[i * C + j] === 1 + L[(i + 1) * C + j + 1]) { at[i] = j; i++; j++; } else if (L[(i + 1) * C + j] >= L[i * C + j + 1]) i++; else j++; }
    } else { // very long block: greedy look-ahead
      let p = 0; for (let i = 0; i < n; i++) for (let j = p; j < Math.min(m, p + 12); j++) if (eq(i, j)) { at[i] = j; p = j + 1; break; }
    }
    for (let i = 0; i < n;) {
      if (at[i] >= 0) { i++; continue; }
      let k = i; while (k < n && at[k] < 0) k++;
      const lo = i > 0 ? at[i - 1] : -1, hi = k < n ? at[k] : m, gap = [];
      for (let j = lo + 1; j < hi; j++) if (dn[j] || /[→⇒=&+%]/.test(W[j].t)) gap.push(j); // skip bare punctuation
      for (let q = i; q < k; q++) at[q] = gap.length ? gap[Math.floor((q - i) * gap.length / (k - i))] : lo >= 0 ? lo : Math.min(hi, m - 1);
      i = k;
    }
    return at;
  }
  let noVoiceNote = false;
  function chunksOf(root) {
    const out = []; noVoiceNote = false;
    const haveVoices = voices().length > 0;
    blocksOf(root).forEach(b => {
      const raw = b.nodes.map(n => n.nodeValue).join('');
      const lang = langOf(b.el, raw);
      if (lang === 'ar' && haveVoices && !voiceFor('ar')) { noVoiceNote = true; return; }
      const text = clean(raw, lang, b.el); if (!text) return;
      const W = domWords(b.nodes);
      const spoken = []; const re = /\S+/g; let m;
      while ((m = re.exec(text))) spoken.push({ start: m.index, end: m.index + m[0].length, len: m[0].length, punct: /[.,;:!?،؛؟]$/.test(m[0]), n: wnorm(m[0]) });
      const at = align(spoken, W);
      spoken.forEach((w, i) => { w.dom = at[i] >= 0 ? W[at[i]] : null; w.di = at[i]; });
      sentences(text).forEach(p => {
        const words = spoken.filter(w => w.start >= p.s0 && w.end <= p.s0 + p.t.length).map(w => ({ start: w.start - p.s0, end: w.end - p.s0, len: w.len, punct: w.punct, dom: w.dom, di: w.di }));
        const idx = words.map(w => w.di).filter(x => x >= 0);
        out.push({ text: p.t, lang, block: b, W, words, d0: idx.length ? Math.min(...idx) : -1, d1: idx.length ? Math.max(...idx) : -1 });
      });
    });
    return out;
  }

  /* ---------------- painting the sentence + word ---------------- */
  const wrapped = []; // fallback mode only: [{orig, parts}] to restore the page exactly
  function wrapBlock(W) { // fallback for browsers without the Highlight API: wrap words in spans (undone on stop)
    if (W.__wrapped) return; W.__wrapped = true;
    const byNode = new Map();
    W.forEach(w => w.segs.forEach(seg => { if (!byNode.has(seg.node)) byNode.set(seg.node, []); byNode.get(seg.node).push(seg); }));
    byNode.forEach((segs, node) => {
      if (!node.parentNode) return;
      const v = node.nodeValue, f = doc.createDocumentFragment(), parts = []; let p = 0;
      segs.sort((a, b) => a.s - b.s).forEach(seg => {
        if (seg.s > p) { const t = doc.createTextNode(v.slice(p, seg.s)); f.append(t); parts.push(t); }
        const sp = doc.createElement('span'); sp.className = 'ra-w'; sp.textContent = v.slice(seg.s, seg.e); f.append(sp); parts.push(sp); seg.span = sp; p = seg.e;
      });
      if (p < v.length) { const t = doc.createTextNode(v.slice(p)); f.append(t); parts.push(t); }
      node.parentNode.replaceChild(f, node); wrapped.push({ orig: node, parts });
    });
  }
  function unwrapAll() {
    while (wrapped.length) { const { orig, parts } = wrapped.pop(); const first = parts[0]; if (first && first.parentNode) { first.parentNode.insertBefore(orig, first); parts.forEach(x => x.remove()); } }
  }
  function rangeOf(segA, segB) { try { const r = doc.createRange(); r.setStart(segA.node, segA.s); r.setEnd(segB.node, segB.e); return r; } catch (e) { return null; } }
  const Mark = {
    hs: null, hw: null, onSpans: [], sSpans: [], cur: '',
    ensure() { if (HL && !this.hs) { this.hs = new global.Highlight(); this.hw = new global.Highlight(); try { this.hw.priority = 1; } catch (e) { } global.CSS.highlights.set('ra-sentence', this.hs); global.CSS.highlights.set('ra-word', this.hw); } },
    sentence(c) {
      this.clear();
      if (!c || c.d0 < 0) return;
      if (HL) { this.ensure(); const a = c.W[c.d0].segs[0], b = c.W[c.d1].segs[c.W[c.d1].segs.length - 1], r = rangeOf(a, b); if (r) this.hs.add(r); return; }
      wrapBlock(c.W);
      for (let j = c.d0; j <= c.d1; j++) c.W[j].segs.forEach(s => { if (s.span) { s.span.classList.add('ra-s'); this.sSpans.push(s.span); } });
    },
    word(w) {
      this.cur = w ? w.t : '';
      if (HL) { this.ensure(); this.hw.clear(); if (w) { const r = rangeOf(w.segs[0], w.segs[w.segs.length - 1]); if (r) this.hw.add(r); } return; }
      this.onSpans.forEach(s => s.classList.remove('ra-on')); this.onSpans = [];
      if (w) w.segs.forEach(s => { if (s.span) { s.span.classList.add('ra-on'); this.onSpans.push(s.span); } });
    },
    clear() {
      this.cur = '';
      if (HL) { if (this.hs) { this.hs.clear(); this.hw.clear(); } return; }
      this.sSpans.forEach(s => s.classList.remove('ra-s')); this.onSpans.forEach(s => s.classList.remove('ra-on')); this.sSpans = []; this.onSpans = [];
    },
    rect(w) {
      if (!w) return null;
      if (!HL && w.segs[0].span) return w.segs[0].span.getBoundingClientRect();
      const r = rangeOf(w.segs[0], w.segs[w.segs.length - 1]); return r ? r.getBoundingClientRect() : null;
    }
  };

  /* ---------------- keeping the word on screen ---------------- */
  let fixedEls = [];
  function scanFixed() {
    fixedEls = [];
    const all = doc.body ? doc.body.getElementsByTagName('*') : [];
    for (let i = 0; i < all.length && i < 10000; i++) {
      const e = all[i]; if (e.classList.contains('ra-player') || e.classList.contains('ra-toast') || (e.closest && e.closest('.ra-player'))) continue;
      const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') fixedEls.push(e);
    }
  }
  function band() {
    const H = global.innerHeight; let top = 0, barTop = H;
    fixedEls.forEach(e => {
      if (!e.isConnected) return; const r = e.getBoundingClientRect();
      if (!r.height || !r.width || r.height > H * 0.5 || r.bottom <= 0 || r.top >= H) return;
      if (r.top <= 2 && r.bottom > top) top = Math.min(r.bottom, H * 0.4);   // header stuck at the top
      else if (r.bottom >= H - 2 && r.top < barTop) barTop = r.top;           // bar fixed at the bottom
    });
    let bottom = barTop;
    if (Player.el && !Player.el.hidden) { const pr = Player.el.getBoundingClientRect(); if (pr.height) bottom = Math.min(bottom, pr.top); }
    return { top, bottom, barTop };
  }
  function scrollerOf(el) {
    for (let p = el && el.parentElement; p && p !== doc.body && p !== doc.documentElement; p = p.parentElement) {
      const o = getComputedStyle(p).overflowY; if ((o === 'auto' || o === 'scroll' || o === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
    }
    return null;
  }
  function keepInView(w) {
    if (!O.autoScroll || !sess || !w) return;
    const r = Mark.rect(w); if (!r || !r.height) return;
    const b = band(); let top = b.top, bottom = b.bottom; const sc = sess.scroller;
    if (sc && sc.isConnected) { const cr = sc.getBoundingClientRect(); top = Math.max(top, cr.top); bottom = Math.min(bottom, cr.bottom); }
    if (bottom - top < 40) return;
    if (r.top >= top + 6 && r.bottom <= bottom - 30) return; // visible, with the next line too
    const target = top + Math.max(0, (bottom - top) * 0.42 - r.height / 2);
    (sc && sc.isConnected ? sc : global).scrollBy({ top: r.top - target, behavior: reduced() ? 'auto' : 'smooth' });
  }

  /* ---------------- voices ---------------- */
  function voices() { try { return OK ? synth.getVoices() || [] : []; } catch (e) { return []; } }
  const vlang = v => String(v.lang || '').toLowerCase().replace('_', '-');
  function voiceFor(lang) {
    const vs = voices().filter(v => vlang(v).startsWith(lang)); if (!vs.length) return null;
    if (S.voice) { const v = vs.find(x => x.name === S.voice); if (v) return v; }
    const page = String(doc.documentElement.lang || '').toLowerCase();
    const score = v => (/natural|neural|premium|enhanced|siri|google|samantha|daniel|serena|karen|moira|aria|jenny|guy|libby|sonia|maged|tarik|laila|hoda|zariyah|hamed|salma|shakir/i.test(v.name) ? 2 : 0)
      + (page && vlang(v) === page ? 1 : /-(us|gb|sa|eg)$/.test(vlang(v)) ? 0.6 : 0) + (v.localService ? 0.5 : 0) + (v.default ? 0.3 : 0);
    return vs.slice().sort((a, b) => score(b) - score(a))[0];
  }
  function langTag(lang) { const page = String(doc.documentElement.lang || ''); if (page.toLowerCase().startsWith(lang)) return page; return { ar: 'ar-SA', en: 'en-US' }[lang] || lang; }

  /* ---------------- reading session ---------------- */
  let sess = null, tok = 0, watch = 0, keep = 0, utter = null, bnd = {};
  function keyOf(el) {
    if (typeof O.keyOf === 'function') { try { const k = O.keyOf(el); if (k) return String(k); } catch (e) { } }
    if (el.id) return '#' + el.id;
    if (el.dataset && el.dataset.raKey) return el.dataset.raKey;
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120); let x = 5381; for (let i = 0; i < t.length; i++) x = ((x << 5) + x + t.charCodeAt(i)) | 0;
    return global.location.pathname + ':' + (x >>> 0).toString(36);
  }
  function read(el, btn) {
    init();
    if (!el) return;
    if (!OK) { toast(T().unsupported); return; }
    const chunks = chunksOf(el);
    if (!chunks.length) { toast(noVoiceNote ? T().noVoice : T().nothing); return; }
    halt();
    const key = keyOf(el); let i = 0;
    const saved = O.remember && S.pos[key]; if (saved && saved[0] > 0 && saved[0] < chunks.length) i = saved[0];
    sess = { el, chunks, i, key, playing: true, scroller: scrollerOf(el) };
    if (btn) reg(el, btn);
    highlightCSS(el); scanFixed(); Player.show();
    if (i > 0) Player.msg(T().resumeAt(i + 1, chunks.length)); else if (noVoiceNote) Player.msg(T().noVoice);
    speakCurrent();
  }
  function speakCurrent() {
    const ss = sess; if (!ss) return;
    const t = ++tok; // bump first: events from the cancelled utterance are ignored
    let busy = false; try { busy = synth.speaking || synth.pending; synth.cancel(); } catch (e) { }
    clearTimeout(watch); clearInterval(keep);
    if (!ss.el.isConnected) { halt(); return; }
    const c = ss.chunks[ss.i]; if (!c) { finish(); return; }
    Mark.sentence(c); Mark.word(null);
    keepInView(c.words.length ? (c.words[0].dom || c.W[Math.max(0, c.d0)]) : null);
    savePos(); paint();
    if (!ss.playing) return;
    const voice = voiceFor(c.lang), vk = voice ? voice.name : c.lang;
    const u = utter = new global.SpeechSynthesisUtterance(c.text); // keep a reference: Chrome drops events of collected utterances
    if (voice) u.voice = voice; u.lang = voice ? voice.lang : langTag(c.lang);
    u.rate = S.rate || 1; u.pitch = 1;
    // follow the spoken word: real word events when the voice sends them (Safari/iOS/iPadOS, Edge,
    // most Windows voices); otherwise a timed estimate that learns the voice's pace after each sentence
    const W = c.words, cal = S.cal[vk] || 1, rate = u.rate;
    let wi = -1, timer = 0, gotB = false, started = false, t0 = 0;
    const markW = k => { if (t !== tok || !W[k] || k === wi) return; wi = k; Mark.word(W[k].dom); keepInView(W[k].dom); };
    const dur = w => ((0.13 + 0.058 * w.len) + (w.punct ? 0.22 : 0)) * cal / rate * 1000;
    const tick = () => { if (t !== tok || gotB) return; if (wi + 1 < W.length) { markW(wi + 1); timer = setTimeout(tick, dur(W[wi])); } };
    const estimate = () => { if (timer || gotB || t !== tok || !W.length) return; markW(0); timer = setTimeout(tick, dur(W[0])); };
    u.onstart = () => { if (t !== tok) return; started = true; t0 = Date.now(); if (!bnd[vk]) estimate(); else setTimeout(() => { if (!gotB) estimate(); }, 700); };
    u.onboundary = e => {
      if (t !== tok || (e.name && e.name !== 'word')) return;
      gotB = true; bnd[vk] = true; clearTimeout(timer);
      let k = 0; for (let j = 0; j < W.length; j++) if (W[j].start <= e.charIndex) k = j; markW(k);
    };
    setTimeout(() => { if (!started && t === tok && synth.speaking) { started = true; estimate(); } }, 1200); // engines without onstart
    u.onend = () => {
      clearTimeout(timer); if (t !== tok) return;
      if (!gotB && t0 && W.length > 4) {
        const est = W.reduce((a, w) => a + dur(w), 0), real = Date.now() - t0;
        if (est > 0 && real > 300) { const fit = cal * real / est; S.cal[vk] = clamp(S.cal[vk] ? (cal + fit) / 2 : fit, 0.4, 2.5); persist(); }
      }
      if (!sess || !sess.playing) return;
      sess.i++; if (sess.i >= sess.chunks.length) finish(); else setTimeout(() => { if (t === tok) speakCurrent(); }, 120);
    };
    u.onerror = e => { if (t !== tok || e.error === 'interrupted' || e.error === 'canceled') return; pause(); Player.msg(T().stopped(e.error || 'error')); };
    // a browser that drops speech silently: pause so ▶ resumes at this sentence
    watch = setTimeout(() => { if (t === tok && sess && sess.playing && !synth.speaking) pause(); }, Math.max(8000, c.text.length * 140 / (S.rate || 1)));
    // Chrome's online voices stop after ~15 s unless nudged (not on Android, where pause = stop)
    if (voice && voice.localService === false && !/Android/i.test(global.navigator.userAgent)) keep = setInterval(() => { if (t !== tok) { clearInterval(keep); return; } try { if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } } catch (e) { } }, 10000);
    const go = () => { if (t !== tok) return; try { synth.speak(u); } catch (e) { pause(); } };
    if (busy) setTimeout(go, 80); else go(); // speaking right after cancel() is dropped by some engines
  }
  function savePos() { if (!sess || !O.remember) return; S.pos[sess.key] = [sess.i, Date.now()]; persist(); }
  function pause() { if (!sess) return; sess.playing = false; tok++; clearInterval(keep); try { synth.cancel(); } catch (e) { } savePos(); paint(); }
  function resume() { if (!sess) return; sess.playing = true; speakCurrent(); }
  function togglePlay() { if (sess) sess.playing ? pause() : resume(); }
  function prev() { if (!sess) return; sess.i = Math.max(0, sess.i - 1); speakCurrent(); }
  function next() { if (!sess) return; if (sess.i >= sess.chunks.length - 1) { finish(); return; } sess.i++; speakCurrent(); }
  function restart() { if (!sess) return; sess.i = 0; sess.playing = true; speakCurrent(); }
  function setRate(r) { r = +r; if (!(r > 0)) return; S.rate = clamp(r, 0.5, 2); persist(); if (sess && sess.playing) speakCurrent(); else { paint(); Player.paintSpeed(); } }
  function cycleRate() { const R = O.rates, k = R.findIndex(x => x >= (S.rate || 1) - 0.001); setRate(R[(k + 1) % R.length]); }
  function finish() { if (sess && O.remember) { delete S.pos[sess.key]; persist(); } halt(); toast(T().finished); }
  function halt() {
    tok++; clearTimeout(watch); clearInterval(keep); try { if (OK) synth.cancel(); } catch (e) { }
    Mark.clear(); unwrapAll();
    const ss = sess; sess = null; if (ss) paintButtons(ss.el, 'idle');
    Player.hide(); emit();
  }
  function stop() { if (!OK) return; if (sess) savePos(); halt(); }
  function toggle(el, btn) { if (sess && sess.el === el) { if (btn) reg(el, btn); togglePlay(); } else read(el, btn); }
  function forget(el) { if (el) delete S.pos[keyOf(el)]; else S.pos = {}; persist(); }
  function state() {
    if (!sess) return { state: 'idle' };
    const c = sess.chunks[sess.i];
    return { state: sess.playing ? 'playing' : 'paused', index: sess.i, total: sess.chunks.length, el: sess.el, sentence: c ? c.text : '', word: Mark.cur, rate: S.rate || 1 };
  }
  function emit() {
    const st = state();
    if (typeof O.onState === 'function') { try { O.onState(st); } catch (e) { } }
    try { doc.dispatchEvent(new CustomEvent('readaloud:state', { detail: st })); } catch (e) { }
  }
  function paint() { if (!sess) return; paintButtons(sess.el, sess.playing ? 'playing' : 'paused'); Player.paint(); emit(); }

  /* ---------------- buttons ---------------- */
  const owners = new WeakMap(); // element -> Set of its Listen buttons
  function reg(el, b) { let s = owners.get(el); if (!s) owners.set(el, s = new Set()); s.add(b); }
  function paintButtons(el, st) {
    const s = owners.get(el); if (!s) return; const L = T();
    s.forEach(b => {
      if (!b.isConnected) { s.delete(b); return; }
      b.classList.toggle('ra-active', st !== 'idle'); b.setAttribute('aria-pressed', String(st === 'playing'));
      const lbl = b.querySelector('.ra-lbl'); if (lbl) lbl.textContent = st === 'playing' ? L.pause : st === 'paused' ? L.resume : L.listen;
      const ic = b.querySelector('svg'); if (ic) ic.innerHTML = ICON[st === 'playing' ? 'pause' : st === 'paused' ? 'play' : 'speaker'];
    });
  }
  function button(el) {
    if (!OK || !el) return null;
    init();
    const L = T(), b = h('button', { type: 'button', class: 'ra-btn', 'aria-pressed': 'false', title: L.title });
    b.innerHTML = svg('speaker') + '<span class="ra-lbl">' + L.listen + '</span>';
    b.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); toggle(el, b); });
    reg(el, b);
    return b;
  }
  const attached = new WeakSet();
  function attach(root) {
    if (!OK || !O.targets) return;
    root = root || doc;
    const list = [...root.querySelectorAll(O.targets)]; try { if (root.matches && root.matches(O.targets)) list.unshift(root); } catch (e) { }
    list.forEach(el => {
      if (attached.has(el) || el.closest('.ra-player')) return; attached.add(el);
      const b = button(el); if (!b) return;
      if (typeof O.button === 'function') O.button(el, b); else if (O.button === 'start') el.prepend(b); else el.append(b);
    });
  }

  /* ---------------- floating player + toast ---------------- */
  const Player = {
    el: null, msgT: 0, msgOn: false,
    build() {
      if (this.el) return this.el;
      const L = T(), p = h('div', { class: 'ra-player', role: 'region', 'aria-label': L.region, dir: 'ltr', hidden: '' });
      const b = (cls, key, label, icon, fn) => { const x = h('button', { type: 'button', class: 'ra-pb ' + cls, 'data-ra': key, 'aria-label': label, title: label }); if (icon) x.innerHTML = svg(icon); x.addEventListener('click', fn); return x; };
      this.lab = h('span', { class: 'ra-lab', 'aria-live': 'polite', dir: 'auto' });
      this.playB = b('ra-main', 'play', L.play, 'pause', togglePlay);
      this.speedB = b('ra-speed', 'speed', L.speed, null, cycleRate);
      const top = h('div', { class: 'ra-top' }); top.append(this.lab, b('ra-close', 'close', L.close, 'close', stop));
      const row = h('div', { class: 'ra-row' }); row.append(b('', 'restart', L.restart, 'restart', restart), b('', 'prev', L.prev, 'prev', prev), this.playB, b('', 'next', L.next, 'next', next), this.speedB);
      p.append(top, row);
      p.addEventListener('keydown', e => { if (e.key === 'Escape') stop(); });
      doc.body.append(p); this.el = p;
      this.spacer = h('div', { class: 'ra-spacer', 'aria-hidden': 'true' });
      return p;
    },
    show() { this.build(); this.el.hidden = false; this.place(); this.paintSpeed(); },
    hide() { if (this.el) this.el.hidden = true; if (this.spacer) { this.spacer.style.height = '0'; this.spacer.remove(); } clearTimeout(this.msgT); this.msgOn = false; },
    place() {
      if (!this.el || this.el.hidden) return;
      let off = typeof O.bottom === 'function' ? O.bottom() : O.bottom;
      if (off == null) { const b = band(); off = b.barTop < global.innerHeight ? global.innerHeight - b.barTop : null; }
      this.el.style.bottom = off != null ? (+off + 8) + 'px' : '';
      // room at the end of the page so the last lines can scroll above the player
      if (!sess || !sess.scroller) { if (!this.spacer.isConnected) doc.body.append(this.spacer); this.spacer.style.height = (this.el.offsetHeight + 24) + 'px'; }
    },
    paint() {
      if (!this.el || !sess) return; const L = T();
      if (!this.msgOn) this.lab.textContent = (sess.playing ? L.reading : L.paused) + ' · ' + L.sentence + ' ' + (sess.i + 1) + ' / ' + sess.chunks.length;
      this.playB.innerHTML = svg(sess.playing ? 'pause' : 'play');
      this.playB.setAttribute('aria-label', sess.playing ? L.pause : L.resume);
      this.paintSpeed();
    },
    paintSpeed() { if (this.speedB) this.speedB.textContent = (+(S.rate || 1).toFixed(2)) + '×'; },
    msg(text) { if (!this.el) return; this.msgOn = true; this.lab.textContent = text; clearTimeout(this.msgT); this.msgT = setTimeout(() => { this.msgOn = false; this.paint(); }, 3500); }
  };
  let toastEl = null, toastT = 0;
  function toast(text) {
    if (Player.el && !Player.el.hidden) { Player.msg(text); return; }
    if (!doc.body) return;
    if (!toastEl) { toastEl = h('div', { class: 'ra-toast', role: 'status', 'aria-live': 'polite', dir: 'auto', hidden: '' }); doc.body.append(toastEl); }
    toastEl.textContent = text; toastEl.hidden = false;
    const b = band(); toastEl.style.bottom = (global.innerHeight - b.barTop + 16) + 'px';
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2600);
  }

  /* ---------------- setup ---------------- */
  let ready = false, resizeT = 0;
  const onNav = () => { if (O.stopOnNavigate) stop(); };
  const onVis = () => { if (doc.hidden && O.pauseWhenHidden && sess && sess.playing) pause(); };
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (sess) { scanFixed(); Player.place(); } }, 200); };
  const onScheme = () => { if (sess) highlightCSS(sess.el); };
  let mq = null;
  function init(opts) {
    if (opts && typeof opts === 'object') O = Object.assign({}, O, opts);
    if (!ready) {
      ready = true; load(); injectCSS();
      global.addEventListener('hashchange', onNav); global.addEventListener('popstate', onNav);
      doc.addEventListener('visibilitychange', onVis);
      global.addEventListener('resize', onResize); global.addEventListener('orientationchange', onResize);
      global.addEventListener('pagehide', stop);
      try { mq = global.matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener('change', onScheme); } catch (e) { }
      if (OK) { try { synth.getVoices(); synth.addEventListener('voiceschanged', noop); } catch (e) { } }
    }
    if (opts && opts.targets) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => attach(), { once: true }); else attach(); }
    return API;
  }
  function destroy() {
    stop();
    global.removeEventListener('hashchange', onNav); global.removeEventListener('popstate', onNav);
    doc.removeEventListener('visibilitychange', onVis); global.removeEventListener('resize', onResize); global.removeEventListener('orientationchange', onResize); global.removeEventListener('pagehide', stop);
    try { mq && mq.removeEventListener('change', onScheme); } catch (e) { }
    doc.querySelectorAll('.ra-btn').forEach(b => b.remove());
    if (Player.el) { Player.el.remove(); Player.el = null; }
    if (toastEl) { toastEl.remove(); toastEl = null; }
    ['ra-style', 'ra-hl'].forEach(id => { const e = doc.getElementById(id); if (e) e.remove(); });
    if (HL) { try { global.CSS.highlights.delete('ra-sentence'); global.CSS.highlights.delete('ra-word'); } catch (e) { } Mark.hs = Mark.hw = null; }
    ready = false;
  }

  const API = {
    __ra: true, version: '1.0', supported: OK, highlightApi: HL,
    init, attach, button, read: el => read(el), toggle, pause, resume, next, prev, restart, stop, setRate, cycleRate, forget, state, destroy,
    voices: lang => voices().filter(v => !lang || vlang(v).startsWith(lang)),
    setVoice: name => { S.voice = name || ''; persist(); if (sess && sess.playing) speakCurrent(); },
    get rate() { return S.rate || 1; }
  };

  // zero-code use: <script src="read-aloud.js" data-targets="article"></script>
  const cur = doc.currentScript;
  if (cur && cur.dataset && cur.dataset.targets) init({ targets: cur.dataset.targets, lang: cur.dataset.lang || '', ui: cur.dataset.ui || '', skip: cur.dataset.skip || '' });
  return API;
});
