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
function tag(mesh, en, ar, note) { mesh.userData = { en, ar, note }; return mesh; }

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
