/* ===== interactives ===== */
const IX = {};

function labelById(figKey, id) { return (FIGS[figKey].labels || []).find(l => l.id === id); }
function winBar(text, again) {
  const w = el(`<div class="win" role="status">${I.check.replace('<svg', '<svg style="width:26px;height:26px;color:var(--teal)"')}
    <div class="grow"><b>${esc(text)}</b></div>
    ${again ? '<button class="btn small" data-again>Play again</button>' : ''}</div>`);
  if (again) $('[data-again]', w).onclick = again;
  return w;
}
function zoomable(fig) {
  const wrap = el('<div class="figwrap"></div>');
  const sc = el('<div class="figscroll"></div>');
  sc.appendChild(fig); wrap.appendChild(sc);
  const z = el(`<button class="btn small ghost zoombtn" aria-pressed="false">${I.zoom} Zoom</button>`);
  z.onclick = e => { e.stopPropagation(); const on = !wrap.classList.contains('zoomed'); wrap.classList.toggle('zoomed', on); z.setAttribute('aria-pressed', on); z.innerHTML = `${I.zoom} ${on ? 'Fit' : 'Zoom'}`; };
  wrap.appendChild(z);
  return wrap;
}
/* Tap-to-label: find each structure on the figure */
IX.label = function (spec, host, done) {
  const f = FIGS[spec.fig];
  const targets = (f.labels || []).filter(l => !l.hide && (spec.only ? spec.only.includes(l.id) : !l.path));
  let order, k, errors, found;
  const root = el(`<div class="ix">
    <div class="prompt"><div class="find"><small>Find on the figure</small><span></span><div class="ar muted" style="font-size:13px;text-align:left;direction:rtl"></div></div>
      <span class="score"></span><button class="btn small ghost" data-hint>Show me</button></div>
    <div class="figslot"></div><ol class="legend" aria-label="Found so far"></ol><div class="after"></div></div>`);
  host.appendChild(root);
  const fig = figureEl(spec.fig, { labels: false });
  $('.figslot', root).appendChild(zoomable(fig));
  const dots = {};
  targets.forEach(l => {
    const [x, y] = pinCenter(l);
    const d = el(`<span class="pin dot" data-id="${l.id}" style="left:${x}%;top:${y}%" aria-hidden="true"></span>`);
    fig.appendChild(d); dots[l.id] = d;
  });
  function start() {
    order = shuffle(targets); k = 0; errors = 0; found = new Set();
    targets.forEach(l => { const d = dots[l.id]; d.className = 'pin dot'; d.textContent = ''; const [x] = pinCenter(l); d.style.left = x + '%'; d.style.transform = ''; });
    $('.after', root).innerHTML = ''; $('.legend', root).innerHTML = ''; $('[data-hint]', root).hidden = false;
    ask();
  }
  function ask() {
    const t = order[k];
    $('.find span', root).textContent = t.en;
    $('.find .ar', root).textContent = t.ar;
    $('.score', root).textContent = `${k}/${order.length}`;
  }
  function reveal(l, cls) {
    const d = dots[l.id];
    if (f.dense) {
      d.className = 'pin dot ok'; d.textContent = found.size;
      $('.legend', root).appendChild(el(`<li><b>${found.size}</b>${esc(S.set.arLabels ? l.ar : l.en)}</li>`));
      return;
    }
    d.className = 'pin ' + cls;
    const a = l.box[0] < 12 ? 'l' : l.box[2] > 88 ? 'r' : 'c';
    if (a === 'l') { d.style.left = l.box[0] + '%'; d.style.transform = 'translate(0,-50%)'; }
    else if (a === 'r') { d.style.left = l.box[2] + '%'; d.style.transform = 'translate(-100%,-50%)'; }
    d.textContent = S.set.arLabels ? l.ar : (l.short || l.en);
  }
  fig.addEventListener('click', e => {
    if (k >= order.length) return;
    const r = fig.getBoundingClientRect();
    let best = null, bd = 1e9;
    targets.forEach(l => {
      if (found.has(l.id)) return;
      const [x, y] = pinCenter(l);
      const dx = r.left + r.width * x / 100 - e.clientX, dy = r.top + r.height * y / 100 - e.clientY;
      const dd = Math.hypot(dx, dy);
      if (dd < bd) { bd = dd; best = l; }
    });
    if (!best || bd > 46) return;
    const t = order[k];
    if (best.id === t.id) {
      sfx.ok(); found.add(t.id); reveal(t, 'ok'); k++;
      if (k === order.length) finish(); else ask();
    } else {
      sfx.bad(); errors++;
      const d = dots[best.id];
      d.classList.add('bad'); d.textContent = best.short || best.en; d.classList.remove('dot');
      setTimeout(() => { if (!found.has(best.id)) { d.className = 'pin dot'; d.textContent = ''; } }, 1100);
    }
  });
  $('[data-hint]', root).onclick = () => {
    if (k >= order.length) return;
    errors++;
    const d = dots[order[k].id]; d.classList.add('pulse');
    setTimeout(() => d.classList.remove('pulse'), 2400);
  };
  function finish() {
    sfx.win();
    $('.find span', root).textContent = 'All found';
    $('.find .ar', root).textContent = '';
    $('.score', root).textContent = `${order.length}/${order.length}`;
    $('[data-hint]', root).hidden = true;
    const msg = errors ? `${order.length} structures found · ${errors} miss${errors > 1 ? 'es' : ''}` : `${order.length}/${order.length} with no misses`;
    $('.after', root).appendChild(winBar(msg, start));
    done && done({ total: order.length, errors });
  }
  start();
};

/* Order on the figure: pick each station in sequence; a drop travels the route */
IX.order = function (spec, host, done) {
  const f = spec.fig ? FIGS[spec.fig] : null;
  const path = spec.path ? f.paths[spec.path] : null;
  const items = spec.items.map(id => typeof id === 'object' ? id : (f && labelById(spec.fig, id)) || { id, en: id, ar: '' });
  let k, errors, chips, drop, at;
  const root = el(`<div class="ix">
    <div class="prompt"><div class="find"><small>${esc(spec.promptSmall || 'Build the route')}</small><span>${esc(spec.prompt || 'Tap the stations in order')}</span></div><span class="score"></span></div>
    <div class="figslot"></div>
    <ol class="seq"></ol>
    <div class="tray"></div><div class="after"></div></div>`);
  host.appendChild(root);
  const fig = f ? figureEl(spec.fig, { labels: !!spec.showOtherLabels, only: spec.showOtherLabels }) : el('<div></div>');
  if (f) $('.figslot', root).appendChild(zoomable(fig));
  function pt(i) { const p = path[i].pt; return { left: p[0] + '%', top: p[1] + '%' }; }
  function stopIndex(id) { return path ? path.findIndex(p => p.stop === id) : -1; }
  function travel(toIdx, cb) {
    if (!path) return cb && cb();
    if (!drop) { drop = el('<span class="drop"></span>'); fig.appendChild(drop); Object.assign(drop.style, pt(toIdx)); at = toIdx; return cb && cb(); }
    const frames = [];
    for (let i = at; i <= toIdx; i++) frames.push(pt(i));
    at = toIdx;
    const end = frames[frames.length - 1];
    if (REDUCED || frames.length < 2 || !drop.animate) { Object.assign(drop.style, end); return cb && cb(); }
    const a = drop.animate(frames, { duration: 380 * (frames.length - 1), easing: 'ease-in-out' });
    a.onfinish = () => { Object.assign(drop.style, end); cb && cb(); };
  }
  function start() {
    k = 0; errors = 0; at = 0;
    if (drop) { drop.remove(); drop = null; }
    $$('.pin.ok', fig).forEach(p => p.remove());
    $('.seq', root).innerHTML = items.map(() => '<li>?</li>').join('');
    const tray = $('.tray', root); tray.innerHTML = '';
    chips = shuffle(items).map(it => {
      const b = el(`<button class="chipbtn" data-id="${it.id}">${esc(it.en)}</button>`);
      b.onclick = () => pick(it, b);
      tray.appendChild(b); return b;
    });
    $('.after', root).innerHTML = '';
    $('.score', root).textContent = `0/${items.length}`;
  }
  function pick(it, b) {
    if (k >= items.length) return;
    if (it.id === items[k].id) {
      sfx.ok(); b.classList.add('done');
      const li = $$('.seq li', root)[k]; li.classList.add('on'); li.textContent = it.en;
      if (it.box && f) { const p = pinEl(it, S.set.arLabels); p.classList.add('ok'); fig.appendChild(p); }
      k++; $('.score', root).textContent = `${k}/${items.length}`;
      const si = stopIndex(it.id);
      if (si >= 0) travel(si);
      if (k === items.length) {
        const last = path && path[path.length - 1];
        const fin = () => finish();
        if (last && !last.stop && at < path.length - 1) travel(path.length - 1, fin);
        else if (last && last.stop && !items.some(x => x.id === last.stop)) travel(path.length - 1, fin);
        else fin();
      }
    } else {
      sfx.bad(); errors++;
      b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad');
    }
  }
  function replay() {
    if (!path || !drop) return;
    at = 0; Object.assign(drop.style, pt(0));
    setTimeout(() => travel(path.length - 1), 60);
  }
  function finish() {
    sfx.win();
    const msg = errors ? `Route complete · ${errors} wrong pick${errors > 1 ? 's' : ''}` : 'Perfect route, no wrong picks';
    const w = winBar(msg, start);
    if (path) { const r = el(`<button class="btn small">${I.play} Replay</button>`); r.onclick = replay; w.insertBefore(r, $('[data-again]', w)); }
    $('.after', root).appendChild(w);
    if (spec.endText) $('.after', root).appendChild(el(`<p class="muted" style="font-size:14px">${spec.endText}</p>`));
    done && done({ total: items.length, errors });
  }
  start();
};

/* Sort into bins */
IX.sort = function (spec, host, done) {
  let sel = null, left, errors;
  const root = el(`<div class="ix">
    <div class="prompt"><div class="find"><small>Sort</small><span>${esc(spec.prompt || 'Tap an item, then tap its group')}</span></div><span class="score"></span></div>
    <div class="tray"></div><div class="bins"></div><div class="after"></div></div>`);
  host.appendChild(root);
  function start() {
    sel = null; errors = 0; left = spec.items.length;
    const tray = $('.tray', root), bins = $('.bins', root);
    tray.innerHTML = ''; bins.innerHTML = ''; $('.after', root).innerHTML = '';
    spec.bins.forEach(b => {
      const n = el(`<button class="bin" data-bin="${b.id}"><b>${esc(b.title)}</b>${b.sub ? `<small>${esc(b.sub)}</small>` : ''}<div class="in"></div></button>`);
      n.onclick = () => drop(b, n);
      bins.appendChild(n);
    });
    shuffle(spec.items).forEach(it => {
      const c = el(`<button class="chipbtn" data-bin="${it.bin}">${esc(it.t)}</button>`);
      c.onclick = () => { $$('.chipbtn', tray).forEach(x => x.classList.remove('sel')); sel = { it, c }; c.classList.add('sel'); sfx.tap(); $$('.bin', bins).forEach(x => x.classList.add('target')); };
      tray.appendChild(c);
    });
    score();
  }
  function score() { $('.score', root).textContent = `${spec.items.length - left}/${spec.items.length}`; }
  function drop(b, n) {
    if (!sel) return;
    const { it, c } = sel;
    $$('.bin', root).forEach(x => x.classList.remove('target'));
    if (it.bin === b.id) {
      sfx.ok(); c.remove(); $('.in', n).appendChild(el(`<span>${esc(it.t)}</span>`)); left--; sel = null; score();
      if (!left) finish();
    } else {
      sfx.bad(); errors++; c.classList.remove('sel'); c.classList.remove('bad'); void c.offsetWidth; c.classList.add('bad'); sel = null;
      if (it.why) toast(it.why);
    }
  }
  function finish() {
    sfx.win();
    $('.after', root).appendChild(winBar(errors ? `All sorted · ${errors} wrong drop${errors > 1 ? 's' : ''}` : 'All sorted, no mistakes', start));
    done && done({ total: spec.items.length, errors });
  }
  start();
};

/* Match pairs */
IX.match = function (spec, host, done) {
  let selL = null, errors, left, n;
  const root = el(`<div class="ix">
    <div class="prompt"><div class="find"><small>Match</small><span>${esc(spec.prompt || 'Tap a left card, then its partner')}</span></div><span class="score"></span></div>
    <div class="match"><div class="col L"></div><div class="col R"></div></div><div class="after"></div></div>`);
  host.appendChild(root);
  function start() {
    errors = 0; left = spec.pairs.length; n = 0; selL = null;
    const L = $('.L', root), R = $('.R', root); L.innerHTML = ''; R.innerHTML = ''; $('.after', root).innerHTML = '';
    shuffle(spec.pairs.map((p, i) => ({ t: p[0], i }))).forEach(o => {
      const b = el(`<button data-i="${o.i}">${esc(o.t)}</button>`);
      b.onclick = () => { $$('button', L).forEach(x => x.classList.remove('sel')); selL = { o, b }; b.classList.add('sel'); sfx.tap(); };
      L.appendChild(b);
    });
    shuffle(spec.pairs.map((p, i) => ({ t: p[1], i }))).forEach(o => {
      const b = el(`<button data-i="${o.i}">${esc(o.t)}</button>`);
      b.onclick = () => {
        if (!selL) { toast('Pick a card on the left first'); return; }
        if (selL.o.i === o.i) {
          sfx.ok(); n++;
          [selL.b, b].forEach(x => { x.classList.remove('sel'); x.classList.add('ok'); x.insertAdjacentHTML('afterbegin', `<span class="pair">${n}</span>`); });
          selL = null; left--; score();
          if (!left) finish();
        } else {
          sfx.bad(); errors++; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad');
        }
      };
      R.appendChild(b);
    });
    score();
  }
  function score() { $('.score', root).textContent = `${spec.pairs.length - left}/${spec.pairs.length}`; }
  function finish() {
    sfx.win();
    $('.after', root).appendChild(winBar(errors ? `All matched · ${errors} wrong try${errors > 1 ? 's' : ''}` : 'All matched on the first try', start));
    done && done({ total: spec.pairs.length, errors });
  }
  start();
};
