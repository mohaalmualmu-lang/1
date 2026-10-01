/* ===== interactives, part 2: 3D, simulators, cases ===== */

/* ---------- three.js loader (lazy, cdnjs) ---------- */
let _three = null;
function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (_three) return _three;
  _three = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => window.THREE ? res(window.THREE) : rej(new Error('no THREE'));
    s.onerror = () => { _three = null; rej(new Error('load failed')); };
    document.head.appendChild(s);
  });
  return _three;
}

/* shared 3D stage: renderer, camera, drag-rotate, pinch/wheel zoom, tap-pick, lifecycle */
function stage3d(host, opts, build) {
  const box = el(`<div class="stage3d"><div class="cv"></div>
    <div class="hud"><span class="hint">Drag · pinch · tap a part</span></div>
    <div class="pick" aria-live="polite" hidden></div>
    <div class="fallback" hidden></div></div>`);
  host.appendChild(box);
  const cv = $('.cv', box), pick = $('.pick', box);
  const api = { box, pick, onFrame: [], pickables: [], onPick: null };
  loadThree().then(THREE => {
    const W = () => cv.clientWidth, H = () => cv.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(W(), H());
    renderer.localClippingEnabled = true;
    cv.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 100);
    camera.position.set(0, 0, opts.dist || 6);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 0.85));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(3, 4, 5); scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0x88ccff, 0.35); dl2.position.set(-4, -2, -3); scene.add(dl2);
    const root = new THREE.Group(); scene.add(root);
    Object.assign(api, { THREE, scene, camera, renderer, root });
    build(api);
    let rx = opts.rx || 0.15, ry = opts.ry || 0.5, drag = null, moved = false, auto = !REDUCED, pinch = null;
    const cvs = renderer.domElement;
    cvs.style.touchAction = 'none';
    const pts = new Map();
    cvs.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); cvs.setPointerCapture(e.pointerId); drag = [e.clientX, e.clientY, rx, ry]; moved = false; auto = false; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = [Math.hypot(a[0] - b[0], a[1] - b[1]), camera.position.z]; } });
    cvs.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); camera.position.z = Math.max(opts.min || 3, Math.min(opts.max || 10, pinch[1] * pinch[0] / d)); moved = true; return; }
      if (!drag) return;
      const dx = e.clientX - drag[0], dy = e.clientY - drag[1];
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      ry = drag[3] + dx * 0.01; rx = Math.max(-1.3, Math.min(1.3, drag[2] + dy * 0.01));
    });
    const up = e => {
      pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      if (drag && !moved) doPick(e);
      drag = null;
    };
    cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);
    cvs.addEventListener('wheel', e => { e.preventDefault(); camera.position.z = Math.max(opts.min || 3, Math.min(opts.max || 10, camera.position.z + e.deltaY * 0.004)); }, { passive: false });
    const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
    function doPick(e) {
      const r = cvs.getBoundingClientRect();
      v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const hits = ray.intersectObjects(api.pickables, false).filter(h => {
        const m = h.object.material; if (!m.clippingPlanes || !m.clippingPlanes.length) return true;
        return m.clippingPlanes.every(p => p.distanceToPoint(h.point) >= -1e-3);
      });
      if (hits.length) {
        const o = hits[0].object;
        api.onPick ? api.onPick(o) : showPick(o);
      }
    }
    function showPick(o) {
      const u = o.userData;
      pick.hidden = false;
      pick.innerHTML = `<b>${esc(u.en)}</b><span class="ar">${esc(u.ar || '')}</span>${u.note ? `<p>${esc(u.note)}</p>` : ''}`;
      flash(o);
    }
    api.showPick = showPick;
    function flash(o) {
      const m = o.material; if (!m.emissive) return;
      const old = m.emissive.getHex(); m.emissive.setHex(0x2fd3bf);
      setTimeout(() => m.emissive.setHex(old), 700);
    }
    api.flash = flash;
    const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });
    ro.observe(cv);
    let visible = true;
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; });
    io.observe(cv);
    let last = performance.now();
    (function loop(now) {
      if (!cvs.isConnected) { ro.disconnect(); io.disconnect(); renderer.dispose(); return; }
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible) return;
      if (auto) ry += dt * 0.25;
      root.rotation.set(rx, ry, 0);
      api.onFrame.forEach(f => f(dt, now / 1000));
      renderer.render(scene, camera);
    })(last);
  }).catch(() => {
    $('.hud', box).hidden = true;
    const fb = $('.fallback', box); fb.hidden = false;
    fb.innerHTML = opts.fallback || '<b>3D model could not load.</b> Check your connection and reopen this step.';
  });
  return api;
}
function stdMat(THREE, color, extra = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.05 }, extra)); }
function tag(mesh, en, ar, note) { Object.assign(mesh.userData, { en, ar, note }); return mesh; }

/* ---------- triage / clinical case engine ---------- */
IX.triage = function (spec, host, done) {
  const root = el(`<div class="ix"><div class="caseh"></div><div class="cbody"></div></div>`);
  host.appendChild(root);
  let i = 0, errors = 0, firstTry = 0;
  const order = spec.shuffle ? shuffle(spec.cases) : spec.cases;
  function vitals(v) { return `<div class="vit">${Object.entries(v).map(([k, x]) => `<div><small>${k}</small><b>${x}</b></div>`).join('')}</div>`; }
  function show() {
    const body = $('.cbody', root); body.innerHTML = '';
    $('.caseh', root).innerHTML = `<div class="prompt"><div class="find"><small>${esc(spec.kind || 'Scenario')} ${Math.min(i + 1, order.length)} of ${order.length}</small><span>${esc(spec.title || '')}</span></div><span class="score">${firstTry}/${order.length}</span></div>`;
    if (i >= order.length) {
      sfx.win();
      body.appendChild(winBar(`${firstTry}/${order.length} right on the first try`, () => { i = 0; errors = 0; firstTry = 0; show(); }));
      if (spec.end) body.appendChild(el(`<div class="callout why"><span class="h">Take-home</span><div>${spec.end}</div></div>`));
      done && done({ total: order.length, errors });
      return;
    }
    const c = order[i];
    const card = el(`<div class="alarm-card ${c.alarm ? 'on' : ''}">${c.head ? `<div class="ah"><span class="dot"></span>${esc(c.head)}</div>` : ''}${c.text ? `<p>${c.text}</p>` : ''}${c.vitals ? vitals(c.vitals) : ''}</div>`);
    body.appendChild(card);
    if (c.img) { const f = figureEl(c.img, { labels: false }); f.onclick = () => openLightbox(c.img, { title: c.head || 'Figure', labels: false }); f.style.cursor = 'zoom-in'; body.appendChild(f); }
    body.appendChild(el(`<p class="stem" style="font-weight:600;font-size:16.5px">${c.q}</p>`));
    const opts = el('<div class="opts"></div>'); body.appendChild(opts);
    let tries = 0;
    shuffle(c.opts.map((t, j) => ({ t, j }))).forEach((o, pos) => {
      const b = el(`<button class="opt"><span class="L">${'ABCD'[pos]}</span><span>${o.t}</span></button>`);
      b.onclick = () => {
        if (o.j === 0) {
          sfx.ok(); if (!tries) firstTry++;
          $$('.opt', opts).forEach(x => x.disabled = true); b.classList.add('right');
          body.appendChild(el(`<div class="callout why" style="margin-top:4px"><span class="h">Why</span><div>${c.why}</div></div>`));
          const nb = el(`<button class="btn primary small" style="margin-top:10px">${i + 1 < order.length ? 'Next' : 'Finish'} ${I.next}</button>`);
          nb.onclick = () => { i++; show(); }; body.appendChild(nb);
        } else {
          sfx.bad(); tries++; errors++; b.classList.add('wrong'); b.disabled = true;
          if (c.no && c.no[o.j - 1]) toast(strip(c.no[o.j - 1]));
        }
      };
      opts.appendChild(b);
    });
  }
  show();
};

/* ---------- compare two pictures ---------- */
IX.compare = function (spec, host, done) {
  const root = el(`<div class="ix">
    <div class="prompt"><div class="find"><small>Compare</small><span></span></div><span class="score"></span></div>
    <div class="pair2"></div><div class="fb"></div></div>`);
  host.appendChild(root);
  const pair = $('.pair2', root);
  const sides = ['a', 'b'].map(s => {
    const it = spec[s];
    const card = el(`<button class="pcard"><div class="pimg"></div><b class="plab">${esc(it.label)}</b></button>`);
    $('.pimg', card).appendChild(figureEl(it.img, { labels: false }));
    pair.appendChild(card); return card;
  });
  let k = 0, errors = 0;
  const rounds = spec.rounds;
  function ask() { $('.find span', root).textContent = rounds[k].q; $('.score', root).textContent = `${k}/${rounds.length}`; }
  sides.forEach((card, idx) => card.onclick = () => {
    if (k >= rounds.length) return;
    const r = rounds[k], ok = (idx === 0 ? 'a' : 'b') === r.ans;
    const fb = $('.fb', root);
    fb.innerHTML = '';
    if (ok) { sfx.ok(); card.classList.add('ok'); setTimeout(() => card.classList.remove('ok'), 700); fb.appendChild(el(`<div class="callout why"><div>${r.why}</div></div>`)); k++; }
    else { sfx.bad(); errors++; card.classList.add('bad'); setTimeout(() => card.classList.remove('bad'), 500); fb.appendChild(el(`<div class="callout flag"><div>Not that one. ${r.hint || 'Look again at the other picture.'}</div></div>`)); }
    if (k >= rounds.length) { $('.find span', root).textContent = 'All rounds done'; $('.score', root).textContent = `${rounds.length}/${rounds.length}`; sfx.win(); fb.appendChild(winBar(errors ? `Done · ${errors} wrong pick${errors > 1 ? 's' : ''}` : 'All right first time', () => { k = 0; errors = 0; fb.innerHTML = ''; ask(); })); done && done({ total: rounds.length, errors }); }
    else ask();
  });
  ask();
};

/* ---------- simple image with info (a "show" step inside a card is handled by card.fig) ---------- */

/* ---------- centrifuge tube: spin, then identify the layers ---------- */
IX.tube = function (spec, host, done) {
  const root = el(`<div class="ix tubeix">
    <div class="prompt"><div class="find"><small>Centrifuge</small><span>Spin the blood sample</span></div><span class="score"></span></div>
    <div class="tubewrap">
      <svg class="tube" viewBox="0 0 120 300" role="img" aria-label="Test tube of blood">
        <defs><clipPath id="tclip"><path d="M30 20h60v230a30 30 0 0 1-60 0z"/></clipPath>
          <linearGradient id="tmix" x1="0" x2="1"><stop offset="0" stop-color="#8f1d22"/><stop offset=".5" stop-color="#c8333a"/><stop offset="1" stop-color="#8f1d22"/></linearGradient></defs>
        <g clip-path="url(#tclip)">
          <rect class="mix" x="30" y="40" width="60" height="250" fill="url(#tmix)"/>
          <rect class="lay pl" data-layer="plasma" x="30" y="40" width="60" height="124"/>
          <rect class="lay bf" data-layer="buffy" x="30" y="164" width="60" height="9"/>
          <rect class="lay rb" data-layer="rbc" x="30" y="173" width="60" height="117"/>
        </g>
        <path d="M30 20h60v230a30 30 0 0 1-60 0z" fill="none" stroke="var(--cyan)" stroke-width="3"/>
        <rect x="24" y="14" width="72" height="8" rx="3" fill="var(--cyan)"/>
      </svg>
      <div class="side">
        <button class="btn primary" data-spin>${I.play} Spin</button>
        <div class="tlabels"></div>
      </div>
    </div>
    <div class="stage2"></div><div class="after"></div></div>`);
  host.appendChild(root);
  const svg = $('.tube', root), find = $('.find span', root), small = $('.find small', root);
  const layers = [
    { id: 'plasma', q: 'Tap the plasma', lab: 'Plasma · 55%', why: 'The straw-coloured top layer is plasma: 55% of total blood volume.' },
    { id: 'buffy', q: 'Tap the leukocytes and thrombocytes (platelets)', lab: 'Leukocytes + thrombocytes', why: 'The thin pale band between the layers holds the leukocytes (WBCs) and thrombocytes (platelets).' },
    { id: 'rbc', q: 'Tap the erythrocytes', lab: 'Erythrocytes', why: 'The heavy red bottom layer is the erythrocytes. Formed elements = 45% of blood, and 99% of them are RBCs.' },
  ];
  let order = [], k = 0, errors = 0, spun = false;
  function score() { $('.score', root).textContent = `${k}/${layers.length + 2}`; }
  score();
  $('[data-spin]', root).onclick = () => {
    if (spun) return; spun = true; sfx.tap();
    svg.classList.add('spin');
    setTimeout(() => {
      svg.classList.remove('spin'); svg.classList.add('sep');
      $('[data-spin]', root).hidden = true;
      order = shuffle(layers); ask();
    }, REDUCED ? 50 : 1300);
  };
  function ask() { small.textContent = 'Identify the layer'; find.textContent = order[k].q; score(); }
  $$('.lay', svg).forEach(r => r.addEventListener('click', () => {
    if (!spun || k >= layers.length) return;
    const t = order[k];
    if (r.dataset.layer === t.id) {
      sfx.ok(); r.classList.add('ok');
      $('.tlabels', root).appendChild(el(`<div class="tl ${t.id}"><b>${esc(t.lab)}</b><span>${esc(t.why)}</span></div>`));
      k++; if (k < layers.length) ask(); else plasmaQ();
    } else { sfx.bad(); errors++; r.classList.add('bad'); setTimeout(() => r.classList.remove('bad'), 500); }
  }));
  function chipQ(q, opts, why, next) {
    small.textContent = 'Check'; find.textContent = q; score();
    const box = el('<div class="opts"></div>');
    $('.stage2', root).innerHTML = ''; $('.stage2', root).appendChild(box);
    shuffle(opts.map((t, j) => ({ t, j }))).forEach((o, pos) => {
      const b = el(`<button class="opt" ${o.j === 0 ? 'data-ok="1"' : ''}><span class="L">${'ABCD'[pos]}</span><span>${o.t}</span></button>`);
      b.onclick = () => {
        if (o.j === 0) { sfx.ok(); $$('.opt', box).forEach(x => x.disabled = true); b.classList.add('right'); box.appendChild(el(`<div class="callout why"><div>${why}</div></div>`)); k++; setTimeout(next, REDUCED ? 0 : 500); }
        else { sfx.bad(); errors++; b.classList.add('wrong'); b.disabled = true; }
      };
      box.appendChild(b);
    });
  }
  function plasmaQ() {
    chipQ('Zoom into the plasma: what is it made of?', ['92% water and 8% various solutes', '55% water and 45% solutes', '8% water and 92% solutes', '99% water and 1% solutes'],
      'Plasma is <n>92%</n> water and <n>8%</n> solutes: proteins, electrolytes, clotting factors and glucose. Do not mix this up with the 55/45 split of whole blood.', weightStep);
  }
  function weightStep() {
    const s2 = $('.stage2', root);
    s2.innerHTML = '';
    const w = el(`<div class="wcalc"><label for="wkg"><b>Body weight</b> <span class="mono" data-kg>70 kg</span></label>
      <input id="wkg" type="range" min="30" max="130" value="70" step="1">
      <p class="lede" style="font-size:15px">Blood ≈ <n data-b>5.6 kg</n> of this patient (<n>8%</n> of body weight). Your notes: blood is approximately <n>5 to 6 L</n>.</p></div>`);
    s2.appendChild(w);
    const inp = $('input', w);
    inp.oninput = () => { const kg = +inp.value; $('[data-kg]', w).textContent = kg + ' kg'; $('[data-b]', w).textContent = (kg * 0.08).toFixed(1) + ' kg'; };
    chipQ2();
  }
  function chipQ2() {
    const keep = $('.wcalc', root);
    chipQ('Blood accounts for approximately what share of total body weight?', ['8%', '55%', '45%', '92%'],
      'Blood is about <n>8%</n> of total body weight, approximately <n>5–6 L</n>. 55% and 45% are the plasma / formed-element split of blood itself.', finish);
    $('.stage2', root).prepend(keep);
  }
  function finish() {
    sfx.win(); small.textContent = 'Done'; find.textContent = 'Sample separated and read'; score();
    $('.after', root).appendChild(winBar(errors ? `Done · ${errors} wrong tap${errors > 1 ? 's' : ''}` : 'All layers and numbers right first time', null));
    done && done({ total: layers.length + 2, errors });
  }
};

/* ---------- CBC analyzer: Table 25-1 ranges + the rule of thirds ---------- */
IX.labcheck = function (spec, host, done) {
  const rows = T251;
  const groups = [['F', 'Adult female'], ['M', 'Adult male'], ['child', 'Child']];
  const st = { g: 'M', v: { rbc: 5, hb: 15, hct: 45, plt: 250000 } };
  const lim = { rbc: [2, 8, 0.1], hb: [5, 22, 0.1], hct: [15, 70, 1], plt: [20000, 800000, 10000] };
  const root = el(`<div class="ix labc">
    <div class="prompt"><div class="find"><small>CBC analyzer</small><span>Move a value and watch the flags</span></div><span class="score"></span></div>
    <div class="seg grp" role="group" aria-label="Patient group">${groups.map(([k, l]) => `<button data-g="${k}">${l}</button>`).join('')}</div>
    <div class="an"></div>
    <div class="bal"></div>
    <div class="case"></div><div class="after"></div></div>`);
  host.appendChild(root);
  const an = $('.an', root);
  const fmt = (id, x) => id === 'plt' ? Math.round(x).toLocaleString('en-US') : id === 'hct' ? Math.round(x) : (+x).toFixed(1);
  const R = {};
  rows.forEach(r => {
    const [mn, mx, stp] = lim[r.id];
    const n = el(`<div class="arow" data-row="${r.id}">
      <div class="ah"><b>${esc(r.name)}</b><span class="mono val"></span><span class="flagc"></span></div>
      <div class="rbar"><i class="nb"></i><i class="mk"></i></div>
      <input type="range" min="${mn}" max="${mx}" step="${stp}" aria-label="${esc(r.name)}">
      <div class="rr muted"></div><div class="cond"></div></div>`);
    $('input', n).oninput = e => { st.v[r.id] = +e.target.value; draw(); };
    an.appendChild(n); R[r.id] = n;
  });
  function status(r) {
    const [a, b] = r.ranges[st.g], x = st.v[r.id];
    return x < a ? 'LOW' : x > b ? 'HIGH' : 'NORMAL';
  }
  function draw() {
    $$('.grp button', root).forEach(b => b.setAttribute('aria-pressed', b.dataset.g === st.g));
    rows.forEach(r => {
      const n = R[r.id], [mn, mx] = lim[r.id], [a, b] = r.ranges[st.g], x = st.v[r.id];
      $('input', n).value = x;
      $('.val', n).textContent = `${fmt(r.id, x)} ${r.unit}`;
      const s = status(r);
      $('.flagc', n).textContent = s; $('.flagc', n).className = 'flagc ' + s.toLowerCase();
      const p = v => 100 * (v - mn) / (mx - mn);
      Object.assign($('.nb', n).style, { left: p(a) + '%', width: (p(b) - p(a)) + '%' });
      $('.mk', n).style.left = Math.max(0, Math.min(100, p(x))) + '%';
      $('.rr', n).textContent = `Normal (${groups.find(g => g[0] === st.g)[1].toLowerCase()}): ${r.txt[st.g]}`;
      $('.cond', n).innerHTML = s === 'NORMAL' ? '' : `<b>${s === 'LOW' ? 'Low readings' : 'High readings'} are associated with:</b> ${s === 'LOW' ? r.low : r.high}`;
    });
    const { rbc, hb, hct } = st.v;
    const ok1 = Math.abs(hb - hct / 3) <= 0.1 * (hct / 3), ok2 = Math.abs(rbc - hb / 3) <= 0.1 * (hb / 3);
    $('.bal', root).innerHTML = `<div class="balc ${ok1 && ok2 ? 'good' : 'off'}"><b>Rule of thirds</b>
      <div><span>Hb should be ⅓ of Hct:</span> <span class="mono">${hb.toFixed(1)} vs ${(hct / 3).toFixed(1)}</span> <i>${ok1 ? '✓' : '✕'}</i></div>
      <div><span>RBC should be ⅓ of Hb:</span> <span class="mono">${rbc.toFixed(1)} vs ${(hb / 3).toFixed(1)}</span> <i>${ok2 ? '✓' : '✕'}</i></div>
      <small>${ok1 && ok2 ? 'Balanced.' : 'Not balanced.'} (The site counts “about one-third” as within 10%. That tolerance is ours, not your notes’.)</small></div>`;
  }
  $$('.grp button', root).forEach(b => b.onclick = () => { if (busy) return; st.g = b.dataset.g; sfx.tap(); draw(); });
  draw();
  /* challenge cases */
  const cases = spec.cases;
  let i = 0, errors = 0, first = 0, busy = false;
  function caseQ() {
    const box = $('.case', root); box.innerHTML = '';
    $('.score', root).textContent = `${first}/${cases.length}`;
    if (i >= cases.length) {
      busy = false; sfx.win(); $('.find span', root).textContent = 'All cases read';
      $('.after', root).appendChild(winBar(`${first}/${cases.length} right on the first try · keep playing with the sliders`, null));
      done && done({ total: cases.length, errors }); return;
    }
    const c = cases[i]; busy = true;
    st.g = c.g; Object.assign(st.v, c.v); draw();
    $('.find small', root).textContent = `Case ${i + 1} of ${cases.length}`; $('.find span', root).textContent = c.who;
    box.appendChild(el(`<p class="stem" style="font-weight:600;font-size:16px;margin-top:4px">${c.q}</p>`));
    const opts = el('<div class="opts"></div>'); box.appendChild(opts);
    let tries = 0;
    shuffle(c.opts.map((t, j) => ({ t, j }))).forEach((o, pos) => {
      const b = el(`<button class="opt" ${o.j === 0 ? 'data-ok="1"' : ''}><span class="L">${'ABCD'[pos]}</span><span>${o.t}</span></button>`);
      b.onclick = () => {
        if (o.j === 0) {
          sfx.ok(); if (!tries) first++; $$('.opt', opts).forEach(x => x.disabled = true); b.classList.add('right');
          box.appendChild(el(`<div class="callout why"><span class="h">Why</span><div>${c.why}</div></div>`));
          const nb = el(`<button class="btn primary small" data-nextcase style="margin-top:10px">${i + 1 < cases.length ? 'Next case' : 'Finish'} ${I.next}</button>`);
          nb.onclick = () => { i++; caseQ(); }; box.appendChild(nb);
        } else { sfx.bad(); tries++; errors++; b.classList.add('wrong'); b.disabled = true; }
      };
      opts.appendChild(b);
    });
  }
  caseQ();
};

/* ---------- table drill: one row-fact at a time, misses come back until right ---------- */
IX.tdrill = function (spec, host, done) {
  const root = el(`<div class="ix">
    <div class="prompt"><div class="find"><small>${esc(spec.small || 'Table drill')}</small><span>${esc(spec.prompt || 'Pick the right answer')}</span></div><span class="score"></span></div>
    <div class="tdcard"></div><div class="after"></div></div>`);
  host.appendChild(root);
  let queue, errors, first, total, missed;
  function start() { queue = shuffle(spec.items.map((x, j) => j)); errors = 0; first = 0; total = queue.length; missed = new Set(); $('.after', root).innerHTML = ''; next(); }
  function next() {
    const box = $('.tdcard', root); box.innerHTML = '';
    $('.score', root).textContent = `${total - queue.length}/${total}`;
    if (!queue.length) {
      sfx.win();
      $('.after', root).appendChild(winBar(`${first}/${total} right on the first try`, start));
      done && done({ total, errors }); return;
    }
    const j = queue[0], it = spec.items[j];
    const choices = it.opts || spec.choices;
    box.appendChild(el(`<div class="alarm-card">${it.tag ? `<div class="ah"><span class="dot"></span>${esc(it.tag)}</div>` : ''}<p style="font-size:16.5px">${it.p}</p></div>`));
    const opts = el('<div class="opts tdopts"></div>'); box.appendChild(opts);
    (it.opts ? shuffle(choices) : choices).forEach(t => {
      const b = el(`<button class="opt" ${t === it.a ? 'data-ok="1"' : ''}><span>${t}</span></button>`);
      b.onclick = () => {
        $$('.opt', opts).forEach(x => x.disabled = true);
        const ok = t === it.a;
        if (ok) { sfx.ok(); b.classList.add('right'); if (!missed.has(j)) first++; queue.shift(); }
        else { sfx.bad(); errors++; b.classList.add('wrong'); $$('.opt', opts).forEach(x => { if (x.dataset.ok) x.classList.add('right'); }); missed.add(j); queue.push(queue.shift()); }
        if (it.why || !ok) box.appendChild(el(`<div class="callout ${ok ? 'why' : 'flag'}" style="margin-top:8px"><div>${ok ? '' : '<b>Answer: ' + it.a + '.</b> '}${it.why || ''}${!ok ? ' It will come back at the end.' : ''}</div></div>`));
        const nb = el(`<button class="btn primary small" data-nextd style="margin-top:10px">Next ${I.next}</button>`);
        nb.onclick = next; box.appendChild(nb);
      };
      opts.appendChild(b);
    });
  }
  start();
};

/* shared: one checkpoint question inside an interactive (data-ok marks the right option for QA) */
function checkpoint(host, q, opts, why, onRight) {
  const box = el(`<div class="cp"><p class="stem" style="font-weight:600;font-size:16px">${q}</p><div class="opts"></div></div>`);
  host.appendChild(box);
  const o = $('.opts', box);
  shuffle(opts.map((t, j) => ({ t, j }))).forEach((x, pos) => {
    const b = el(`<button class="opt" ${x.j === 0 ? 'data-ok="1"' : ''}><span class="L">${'ABCD'[pos]}</span><span>${x.t}</span></button>`);
    b.onclick = () => {
      if (x.j === 0) { sfx.ok(); $$('.opt', o).forEach(y => y.disabled = true); b.classList.add('right'); box.appendChild(el(`<div class="callout why"><div>${why}</div></div>`)); onRight && onRight(); }
      else { sfx.bad(); b.classList.add('wrong'); b.disabled = true; onRight && (onRight.miss = (onRight.miss || 0) + 1); }
    };
    o.appendChild(b);
  });
  return box;
}

/* ---------- 3D: red cells in a small vessel; cold makes them sickle and lodge ---------- */
IX.rbc3d = function (spec, host, done) {
  const root = el(`<div class="ix"></div>`); host.appendChild(root);
  const status = el(`<div class="prompt"><div class="find"><small>Small blood vessel</small><span>Smooth, round cells flow freely</span></div><span class="score mono">0%</span></div>`);
  root.appendChild(status);
  let level = 0; const S3 = {};
  stage3d(root, { dist: 12, min: 6, max: 16, ry: 0.35, rx: 0.4, fallback: '<b>3D model unavailable.</b> Normal RBCs are smooth and round. In sickle cell disease they are oblong: poor oxygen carriers that can lodge in small blood vessels, leading to thrombosis. Use the slider and the question below.' }, a => {
    const { THREE, root: g } = a;
    const pts = []; for (let i = 0; i <= 12; i++) { const r = i / 12 * 0.5; pts.push(new THREE.Vector2(r, 0.09 + 0.1 * Math.pow(r / 0.5, 2) * (1 - Math.pow(r / 0.5, 6)) - 0.05 * (1 - r / 0.5))); }
    const half = new THREE.LatheGeometry(pts, 32);
    const discGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.16, 32, 1); discGeo.scale(1, 0.9, 1);
    const sickleGeo = new THREE.TorusGeometry(0.45, 0.11, 10, 24, 2.4);
    const vessel = tag(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 9, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xd98a8a, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })), 'Small blood vessel', 'وعاء دموي صغير', 'The odd shape of sickle cells can make them lodge in small blood vessels.');
    vessel.rotation.z = Math.PI / 2; g.add(vessel); a.pickables.push(vessel);
    const narrow = tag(new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.22, 12, 32), stdMat(THREE, 0xc97a7a, { transparent: true, opacity: 0.55 })), 'Narrow point', 'تضيّق', 'Narrow vessels, such as those of the spleen, are where sickle cells get stuck.');
    narrow.rotation.y = Math.PI / 2; narrow.position.x = 1.2; g.add(narrow); a.pickables.push(narrow);
    const cells = [];
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(discGeo, stdMat(THREE, 0xd8343a, { roughness: 0.4 }));
      tag(m, 'Normal RBC', 'كرية حمراء طبيعية', 'Smooth, round shape: carries oxygen well.');
      m.userData.x = -4.5 + i * 0.6; m.userData.y = (Math.random() - 0.5) * 0.9; m.userData.z = (Math.random() - 0.5) * 0.9; m.userData.spin = Math.random() * 6; m.userData.s = i % 3 === 0 ? 0 : (i * 0.37) % 1; m.userData.stop = 0.35 - (i % 8) * 0.38;
      g.add(m); cells.push(m); a.pickables.push(m);
    }
    const clot = tag(new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), stdMat(THREE, 0x6b1a1e, { roughness: 0.8 })), 'Blockage (thrombosis)', 'انسداد (تخثّر)', 'Sickled cells lodged in the vessel: pain, ischemia and often organ damage downstream.');
    clot.position.x = 1.0; clot.scale.set(0.01, 0.01, 0.01); g.add(clot); a.pickables.push(clot);
    Object.assign(S3, { cells, discGeo, sickleGeo, clot, vessel });
    a.onFrame.push(dt => {
      const block = Math.max(0, (level - 55) / 45);
      clot.scale.setScalar(Math.max(0.01, 0.75 * block));
      vessel.material.color.setHex(block > 0.5 ? 0x8a5a5a : 0xd98a8a);
      cells.forEach(c => {
        const sick = c.userData.s < level / 100;
        if (sick && c.geometry !== sickleGeo) { c.geometry = sickleGeo; c.material.color.setHex(0xa52a30); tag(c, 'Sickle RBC', 'كرية منجلية', 'Oblong instead of smooth and round: poor oxygen carrier (hypoxia) and much shorter life span (anemia).'); }
        if (!sick && c.geometry !== discGeo) { c.geometry = discGeo; c.material.color.setHex(0xd8343a); tag(c, 'Normal RBC', 'كرية حمراء طبيعية', 'Smooth, round shape: carries oxygen well.'); }
        const speed = 1.4 * (1 - 0.85 * block);
        let x = c.userData.x + dt * speed;
        const stop = c.userData.stop;
        if (((block > 0.3 && sick) || block > 0.7) && c.userData.x <= stop + 0.001 && x > stop) x = stop;
        if (x > 4.5) x = -4.5;
        c.userData.x = x; c.userData.spin += dt * speed;
        c.position.set(x, c.userData.y, c.userData.z); c.rotation.set(c.userData.spin, c.userData.spin * 0.6, 0);
      });
    });
  });
  const ctr = el(`<div class="ctrl3d"><label class="rng"><span>Cold exposure</span><input type="range" min="0" max="100" step="5" value="0" aria-label="Cold exposure"></label>
    <div class="row"><button class="btn small" data-v="0">Warm</button><button class="btn small" data-v="50">Cool</button><button class="btn small" data-v="100">Cold</button></div></div>`);
  root.appendChild(ctr);
  const after = el('<div class="after"></div>'); root.appendChild(after);
  const rng = $('input', ctr); let asked = false;
  function apply() {
    level = +rng.value;
    const s = level < 30 ? 'Smooth, round cells flow freely' : level < 60 ? 'Cells sickling: poor oxygen carriers' : 'Sickled cells lodge: the vessel is blocked';
    $('.find span', status).textContent = s; $('.score', status).textContent = level + '%';
    status.classList.toggle('alarm', level >= 60);
    if (level >= 60 && !asked) {
      asked = true; sfx.bad();
      after.appendChild(el(`<div class="callout flag"><span class="h">Vasoocclusive crisis</span><div>Blood flow to an organ becomes restricted: <k>pain, ischemia and often organ damage</k>, usually lasting <n>5–7 days</n>. This is why your notes say: cover the patient to maintain body temperature, because <k>cold can contribute to sickling of cells</k>.</div></div>`));
      checkpoint(after, 'Which management step does this model justify?', ['Cover the patient with a blanket to maintain body temperature', 'Apply cold packs to the painful area', 'Withhold oxygen to avoid hyperoxia', 'Keep the patient walking to improve flow'],
        'Cold can contribute to sickling, so sickle cell management covers the patient to maintain body temperature (A34).', () => { sfx.win(); after.appendChild(winBar('Model explored', null)); done && done({ total: 1, errors: 0 }); });
    }
  }
  rng.oninput = apply;
  $$('[data-v]', ctr).forEach(b => b.onclick = () => { rng.value = b.dataset.v; apply(); });
};

/* ---------- too few vs too many red cells: hematocrit, viscosity and phlebotomy ---------- */
IX.visc = function (spec, host, done) {
  const root = el(`<div class="ix viscix">
    <div class="prompt"><div class="find"><small>Hematocrit</small><span data-st></span></div><span class="score mono" data-h></span></div>
    <div class="seg" role="group" aria-label="Sex"><button data-s="M">Adult male</button><button data-s="F">Adult female</button></div>
    <canvas class="vcv" width="640" height="190" aria-label="Blood vessel with red cells"></canvas><p class="muted" style="font-size:12.5px;margin:-4px 0 8px">Illustrative animation: more red cells = thicker (more viscous), slower flow.</p>
    <label class="rng"><span>Hematocrit</span><input id="vhct" type="range" min="15" max="70" step="1" value="44" aria-label="Hematocrit"></label>
    <div class="vinfo"></div>
    <div class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-phleb>${I.drill} Phlebotomy</button></div>
    <ul class="tasks"></ul><div class="after"></div></div>`);
  host.appendChild(root);
  const st = { sex: 'M', h: 44 };
  const tasks = [['low', 'Drag to an anemia-range hematocrit'], ['high', 'Drag into polycythemia (above the normal range)'], ['phleb', 'Bring it back to the phlebotomy target']];
  const doneT = {};
  const cv = $('canvas', root), ctx = cv.getContext('2d');
  const rng = $('input', root);
  const range = () => st.sex === 'M' ? [40, 50] : [35, 45];
  const target = () => st.sex === 'M' ? 45 : 42;
  function tick(k) { if (doneT[k]) return; doneT[k] = 1; sfx.ok(); drawTasks(); if (Object.keys(doneT).length === 3) { sfx.win(); $('.after', root).appendChild(winBar('All three states explored', null)); done && done({ total: 3, errors: 0 }); } }
  function drawTasks() { $('.tasks', root).innerHTML = tasks.map(([k, t]) => `<li class="${doneT[k] ? 'ok' : ''}">${doneT[k] ? '✓' : '○'} ${t}</li>`).join(''); }
  function info() {
    const [a, b] = range(), h = st.h;
    $$('[data-s]', root).forEach(x => x.setAttribute('aria-pressed', x.dataset.s === st.sex));
    $('[data-h]', root).textContent = h + '%';
    let s, html;
    if (h < a) { s = 'LOW: fewer red cells than normal'; html = `<b>Anemia picture.</b> Anemia = a hemoglobin or RBC level that is lower than normal. Patients feel worn down, have no energy, cannot catch their breath, and may have anginal-type chest pain (reduced oxygen supply to the heart). Normal ${st.sex === 'M' ? 'male' : 'female'} hematocrit: <n>${a}–${b}%</n>.`; tick('low'); }
    else if (h > b) { s = 'HIGH: overabundance of red cells'; html = `<b>Polycythemia picture.</b> Overabundance or overproduction of RBCs → <k>increased blood viscosity and volume</k> → congestion of tissues and organs; <k>hyperviscosity increases the risk of thrombus formation</k>. Phlebotomy keeps hematocrit <n>&lt; ${target()}%</n> in ${st.sex === 'M' ? 'men' : 'women'}.`; tick('high'); }
    else { s = 'Within the normal range'; html = `Normal ${st.sex === 'M' ? 'adult male' : 'adult female'} hematocrit in Table 25-1: <n>${a}–${b}%</n>. Phlebotomy target in polycythemia: <n>&lt; 45%</n> men, <n>&lt; 42%</n> women.`; }
    $('[data-st]', root).textContent = s;
    $('.vinfo', root).innerHTML = html;
    $('[data-phleb]', root).disabled = h < target();
    root.classList.toggle('alarm', h > b);
  }
  $$('[data-s]', root).forEach(b => b.onclick = () => { st.sex = b.dataset.s; info(); });
  rng.oninput = () => { st.h = +rng.value; info(); };
  $('[data-phleb]', root).onclick = () => {
    const t = target() - 1; sfx.tap();
    const step = () => { if (st.h > t) { st.h--; rng.value = st.h; info(); setTimeout(step, REDUCED ? 0 : 60); } else { $('.after', root).prepend(el(`<div class="callout why"><div>Phlebotomy (removing blood) brought the hematocrit to <n>${st.h}%</n>, below the <n>${target()}%</n> target for ${st.sex === 'M' ? 'men' : 'women'}.</div></div>`)); tick('phleb'); } };
    step();
  };
  /* animation: cell count follows hematocrit, speed falls as viscosity rises (illustrative) */
  const cells = Array.from({ length: 140 }, (_, i) => ({ x: Math.random() * 640, y: 30 + Math.random() * 130, r: i % 23 === 0 ? 'w' : 'r' }));
  let lastT = performance.now();
  (function loop(now) {
    if (!cv.isConnected) return;
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    const n = Math.round(st.h * 1.9), speed = REDUCED ? 0 : 160 * Math.max(0.12, 1.25 - st.h / 55);
    ctx.clearRect(0, 0, 640, 190);
    ctx.fillStyle = '#f6e6a6'; ctx.globalAlpha = 0.9; ctx.fillRect(0, 22, 640, 146); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#c97a7a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 19); ctx.lineTo(640, 19); ctx.moveTo(0, 171); ctx.lineTo(640, 171); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const c = cells[i]; c.x += dt * speed * (0.8 + (i % 5) * 0.08); if (c.x > 650) c.x = -10;
      ctx.beginPath();
      if (c.r === 'w') { ctx.fillStyle = '#c9d8ff'; ctx.arc(c.x, c.y, 8, 0, 7); }
      else { ctx.fillStyle = '#d23a40'; ctx.ellipse(c.x, c.y, 8, 6, 0, 0, 7); }
      ctx.fill();
    }
  })(lastT);
  drawTasks(); info();
};

/* ---------- block a clotting factor on the real cascade figure ---------- */
IX.cascade = function (spec, host, done) {
  const f = FIGS.cascade;
  const path = f.paths.intrinsic;
  const root = el(`<div class="ix">
    <div class="prompt"><div class="find"><small>Intrinsic pathway</small><span>Run the cascade</span></div><span class="score"></span></div>
    <div class="figslot"></div>
    <div class="row runs" style="display:flex;gap:8px;flex-wrap:wrap"></div>
    <div class="cmsg"></div><div class="after"></div></div>`);
  host.appendChild(root);
  const fig = figureEl('cascade', { labels: false });
  $('.figslot', root).appendChild(zoomable(fig));
  const runs = [
    { k: 'normal', t: 'Normal', stopAt: null, msg: 'Every factor is present: the cascade runs through IXa, VIII, X, II to fibrin and insoluble fibrin. A clot forms.' },
    { k: 'A', t: 'Hemophilia A · low factor VIII', stopAt: 'k_viii', msg: '<b>Hemophilia A</b>: low levels of <k>factor VIII</k> (antihemophilic globulin and antihemophilic factor). On the figure, VIII (AHF) is needed with Ca²⁺ and platelet lipid to move on to X. Clotting does not occur or occurs insufficiently.' },
    { k: 'B', t: 'Hemophilia B · low factor IX', stopAt: 'k_ix', msg: '<b>Hemophilia B</b>: deficiency of <k>factor IX</k> (plasma thromboplastin component, the Christmas factor). Without IX → IXa the intrinsic route stalls. Signs and symptoms are the same in both types.' },
  ];
  const did = {}; let drop = null, busy = false, xm = null;
  const pt = i => ({ left: path[i].pt[0] + '%', top: path[i].pt[1] + '%' });
  runs.forEach(r => { const b = el(`<button class="btn small" data-run="${r.k}">${I.play} ${esc(r.t)}</button>`); b.onclick = () => go(r); $('.runs', root).appendChild(b); });
  function go(r) {
    if (busy) return; busy = true; sfx.tap();
    if (drop) drop.remove(); if (xm) xm.remove();
    drop = el('<span class="drop"></span>'); fig.appendChild(drop); Object.assign(drop.style, pt(0));
    const end = r.stopAt ? path.findIndex(p => p.stop === r.stopAt) : path.length - 1;
    const frames = []; for (let i = 0; i <= end; i++) frames.push(pt(i));
    $('.find span', root).textContent = r.t; $('.cmsg', root).innerHTML = '';
    const fin = () => {
      Object.assign(drop.style, frames[frames.length - 1]); busy = false;
      if (r.stopAt) { xm = el(`<span class="xmark" style="left:${path[end].pt[0]}%;top:${path[end].pt[1]}%">✕</span>`); fig.appendChild(xm); sfx.bad(); } else sfx.ok();
      $('.cmsg', root).innerHTML = `<div class="callout ${r.stopAt ? 'flag' : 'why'}"><div>${r.msg}</div></div>`;
      did[r.k] = 1; $('.score', root).textContent = `${Object.keys(did).length}/3`;
      if (Object.keys(did).length === 3 && !did.won) { did.won = 1; sfx.win(); $('.after', root).appendChild(winBar('All three runs compared', null)); done && done({ total: 3, errors: 0 }); }
    };
    if (REDUCED || !drop.animate) return fin();
    drop.animate(frames, { duration: 170 * frames.length, easing: 'linear' }).onfinish = fin;
  }
  $('.score', root).textContent = '0/3';
};

/* ---------- DIC: two stages ---------- */
IX.dic = function (spec, host, done) {
  const root = el(`<div class="ix dicix">
    <div class="prompt"><div class="find"><small>DIC</small><span data-t>Before DIC</span></div><span class="score" data-s>0/2</span></div>
    <svg class="dsv" viewBox="0 0 320 120" role="img" aria-label="Blood vessel">
      <rect x="0" y="20" width="320" height="80" rx="10" class="dw"/><g class="dc"></g><g class="db"></g></svg>
    <div class="meters"><div><small>Free thrombin & fibrin deposits</small><i><b data-m="f"></b></i></div><div><small>Clotting factors left</small><i><b data-m="c"></b></i></div><div><small>Bleeding</small><i><b data-m="b"></b></i></div></div>
    <button class="btn primary" data-nstage>Next stage ${I.next}</button>
    <div class="dq"></div><div class="after"></div></div>`);
  host.appendChild(root);
  let stage = 0, right = 0;
  const T = ['Before DIC', 'Stage 1: clots everywhere', 'Stage 2: uncontrolled hemorrhage'];
  function draw() {
    $('[data-t]', root).textContent = T[stage];
    const m = [[5, 100, 0], [90, 40, 10], [30, 5, 100]][stage];
    ['f', 'c', 'b'].forEach((k, i) => $(`[data-m="${k}"]`, root).style.width = m[i] + '%');
    $('.dc', root).innerHTML = stage === 1 ? Array.from({ length: 16 }, (_, i) => `<circle cx="${12 + i * 19}" cy="${30 + (i * 37) % 60}" r="${4 + (i % 3) * 2}" class="clot"/>`).join('') : stage === 2 ? Array.from({ length: 5 }, (_, i) => `<circle cx="${30 + i * 60}" cy="${40 + (i * 23) % 40}" r="3" class="clot"/>`).join('') : '';
    $('.db', root).innerHTML = stage === 2 ? Array.from({ length: 7 }, (_, i) => `<path class="bleed" d="M${25 + i * 45} 100 q-6 12 0 16 q6-4 0-16z"/>`).join('') : '';
    $('[data-nstage]', root).hidden = stage === 2 || !!$('.dq .cp:not(.answered)', root);
  }
  const Q = [null,
    ['In the first stage of DIC, which happens?', ['Free thrombin and fibrin deposits increase, platelets aggregate, and defibrination occurs', 'Clotting factors run out and uncontrolled hemorrhage begins', 'Plasma cells form tumors in the bone', 'RBCs become trapped in the spleen'], 'Stage 1: free thrombin and fibrin deposits in the blood increase; platelets begin to aggregate; defibrination (breakdown of the fibrin clots) occurs.'],
    ['What causes the bleeding in the second stage?', ['A reduction in clotting factors', 'Too many platelets', 'A deficiency of factor VIII only', 'Hyperviscosity of the blood'], 'Stage 2: uncontrolled hemorrhage results from a reduction in clotting factors. Death is related to uncontrolled bleeding, hypotension and shock.']];
  $('[data-nstage]', root).onclick = () => {
    stage++; sfx.tap(); $('.dq', root).innerHTML = '';
    const [q, o, w] = Q[stage];
    const cp = checkpoint($('.dq', root), q, o, w, () => { cp.classList.add('answered'); right++; $('[data-s]', root).textContent = `${right}/2`; draw(); if (right === 2) { sfx.win(); $('.after', root).appendChild(winBar('Both stages of DIC explained', null)); done && done({ total: 2, errors: 0 }); } });
    draw();
  };
  draw();
};

/* ---------- blood compatibility (Table 25-4) ---------- */
IX.bloodmatch = function (spec, host, done) {
  const types = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
  const rounds = spec.rounds;
  const root = el(`<div class="ix">
    <div class="prompt"><div class="find"><small>Recipient</small><span data-r></span></div><span class="score" data-s></span></div>
    <p class="muted" style="font-size:13.5px">Tap every donor bag this patient may receive (preferred + additional permissible types), then check.</p>
    <div class="bags"></div><button class="btn primary" data-check>Check</button><div class="fb"></div><div class="after"></div></div>`);
  host.appendChild(root);
  let k = 0, errors = 0, sel;
  function show() {
    const r = rounds[k], row = T254.find(x => x.r === r);
    sel = new Set();
    $('[data-r]', root).textContent = `${r} patient`; $('[data-s]', root).textContent = `${k}/${rounds.length}`;
    $('.fb', root).innerHTML = ''; $('[data-check]', root).hidden = false;
    const bags = $('.bags', root); bags.innerHTML = '';
    types.forEach(t => {
      const ok = t === row.p || row.add.includes(t);
      const b = el(`<button class="bag" ${ok ? 'data-ok="1"' : ''} aria-pressed="false"><svg viewBox="0 0 30 40" aria-hidden="true"><path d="M6 4h18v26a9 9 0 0 1-18 0z"/><path d="M15 0v4" /></svg><b>${t}</b></button>`);
      b.onclick = () => { if (sel.done) return; sel.has(t) ? sel.delete(t) : sel.add(t); b.setAttribute('aria-pressed', sel.has(t)); sfx.tap(); };
      bags.appendChild(b);
    });
  }
  $('[data-check]', root).onclick = () => {
    const r = rounds[k], row = T254.find(x => x.r === r), good = new Set([row.p, ...row.add]);
    const wrong = [...sel].filter(t => !good.has(t)), missed = [...good].filter(t => !sel.has(t));
    $$('.bag', root).forEach(b => { const t = $('b', b).textContent; b.classList.add(good.has(t) ? 'okb' : 'nob'); });
    if (!wrong.length && !missed.length) {
      sfx.ok(); sel.done = true; $('[data-check]', root).hidden = true;
      $('.fb', root).innerHTML = `<div class="callout why"><div><b>${r}</b>: preferred donor <b>${row.p}</b>; additional permissible: <b>${row.add.length ? row.add.join(', ') : 'none'}</b>.</div></div>`;
      const nb = el(`<button class="btn primary small" data-nextm style="margin-top:10px">${k + 1 < rounds.length ? 'Next patient' : 'Finish'} ${I.next}</button>`);
      nb.onclick = () => { k++; if (k < rounds.length) show(); else { sfx.win(); $('[data-s]', root).textContent = `${rounds.length}/${rounds.length}`; $('.fb', root).innerHTML = ''; $('.after', root).appendChild(winBar(errors ? `All patients matched · ${errors} wrong check${errors > 1 ? 's' : ''}` : 'Every patient matched first time', null)); done && done({ total: rounds.length, errors }); } };
      $('.fb', root).appendChild(nb);
    } else {
      sfx.bad(); errors++;
      $('.fb', root).innerHTML = `<div class="callout flag"><div>${wrong.length ? `Not permissible: <b>${wrong.join(', ')}</b>. ` : ''}${missed.length ? `Also allowed: <b>${missed.join(', ')}</b>. ` : ''}Green bags are allowed. Fix your picks and check again.</div></div>`;
      setTimeout(() => $$('.bag', root).forEach(b => b.classList.remove('okb', 'nob')), 1800);
    }
  };
  show();
};

/* ---------- transfusion monitor: watch the first minutes, then manage the reaction in order ---------- */
IX.transfuse = function (spec, host, done) {
  const steps = ['Immediately stop the transfusion', 'Recheck donor blood: was the wrong blood given?', 'Contact medical control', 'Provide supportive care (counteract shock)', 'Replace existing IV tubing and bag with normal saline', 'Retain blood products and tubing; transfer them to the hospital'];
  const root = el(`<div class="ix tfix">
    <div class="tmon"><div class="mtop"><span class="lead">TRANSFUSION</span><span>min <b data-t>0</b></span></div>
      <div class="vit"><div><small>HR</small><b data-hr>84</b></div><div><small>BP</small><b data-bp>124/78</b></div><div><small>TEMP</small><b data-tp>36.8</b></div><div><small>BAG</small><b data-bag>running</b></div></div>
      <div class="sx" data-sx>Watch closely: the first 30 to 60 minutes.</div></div>
    <button class="btn primary" data-start>${I.play} Start the transfusion</button>
    <ol class="seq"></ol><div class="tray"></div><div class="after"></div></div>`);
  host.appendChild(root);
  let t = 0, timer = null, k = 0, errors = 0, react = false;
  const set = (a, v) => { $(`[data-${a}]`, root).textContent = v; };
  $('[data-start]', root).onclick = () => {
    $('[data-start]', root).hidden = true; sfx.tap();
    timer = setInterval(() => {
      t += 2; set('t', t);
      if (t >= 14 && !react) {
        react = true; clearInterval(timer); root.classList.add('alarm'); sfx.bad();
        set('hr', 128); set('bp', '84/50'); set('tp', '38.9');
        $('[data-sx]', root).innerHTML = '<b>Acute reaction:</b> chills · fever · back pain · vomiting · tachycardia · hypotension';
        startSteps();
      }
    }, REDUCED ? 60 : 280);
  };
  function startSteps() {
    $('.seq', root).innerHTML = steps.map(() => '<li>?</li>').join('');
    const tray = $('.tray', root);
    tray.before(el('<p class="stem" style="font-weight:600;font-size:16px;margin:4px 0">Manage the reaction: tap the steps in order.</p>'));
    shuffle(steps.map((s, i) => ({ s, i }))).forEach(o => {
      const b = el(`<button class="chipbtn" data-i="${o.i}">${esc(o.s)}</button>`);
      b.onclick = () => {
        if (o.i === k) {
          sfx.ok(); b.classList.add('done'); const li = $$('.seq li', root)[k]; li.classList.add('on'); li.textContent = o.s; k++;
          if (k === 1) { set('bag', 'STOPPED'); }
          if (k === 5) set('bag', 'saline');
          if (k === steps.length) { root.classList.remove('alarm'); set('hr', 104); set('bp', '102/64'); sfx.win(); $('.after', root).appendChild(winBar(errors ? `Reaction managed · ${errors} wrong pick${errors > 1 ? 's' : ''}` : 'Reaction managed in the right order', null)); $('.after', root).appendChild(el('<p class="muted" style="font-size:14px">Severity correlates to the amount of blood volume transfused, which is why stopping comes first.</p>')); done && done({ total: steps.length, errors }); }
        } else { sfx.bad(); errors++; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); }
      };
      tray.appendChild(b);
    });
  }
};
