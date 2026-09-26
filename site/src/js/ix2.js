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

/* ---------- 3D kidney: cut it open, tap parts, optionally drop a stone ---------- */
IX.kidney3d = function (spec, host, done) {
  const root = el(`<div class="ix"></div>`); host.appendChild(root);
  const prompt = el(`<div class="prompt"><div class="find"><small>${spec.stone ? 'Stone lab' : 'Find on the 3D kidney'}</small><span></span></div><span class="score"></span></div>`);
  root.appendChild(prompt);
  const ctr = el(`<div class="ctrl3d">
    <label class="rng"><span>Cut open</span><input type="range" min="0" max="100" value="${spec.stone ? 70 : 0}" aria-label="Cut the kidney open"></label>
    ${spec.stone ? '<div class="row"><button class="btn primary small" data-drop>Drop a stone</button><button class="btn small" data-reset>Reset</button></div>' : ''}
  </div>`);
  const THREEd = {};
  const api = stage3d(root, { dist: 6.4, ry: 0.6, fallback: '<b>3D model unavailable.</b> The kidney has three regions: cortex (outer), medulla (pyramids) and renal pelvis (inner funnel), which drains into the ureter.' }, a => {
    const { THREE, root: g } = a;
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 2);
    THREEd.plane = plane;
    function bean(scale) {
      const geo = new THREE.SphereGeometry(1, 72, 54);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const dent = x < 0 ? 0.55 * Math.exp(-(y * y) / 0.28) * Math.min(1, -x * 1.4) : 0;
        x = x + dent * 0.9;
        p.setXYZ(i, x * scale, y * 1.55 * scale, z * 0.62 * scale);
      }
      geo.computeVertexNormals();
      return geo;
    }
    const clip = [plane];
    const cortex = tag(new THREE.Mesh(bean(1), stdMat(THREE, 0xb4543f, { side: THREE.DoubleSide, clippingPlanes: clip, clipShadows: true })), 'Renal cortex', 'قشرة الكلية', 'Outer region, under the capsule. Your notes place the nephrons here.');
    const medulla = tag(new THREE.Mesh(bean(0.8), stdMat(THREE, 0x7d2a33, { side: THREE.DoubleSide, clippingPlanes: clip })), 'Renal medulla', 'لب الكلية', 'Middle region, built from the renal pyramids.');
    g.add(cortex, medulla);
    const pyrs = [];
    for (let i = 0; i < 7; i++) {
      const ang = -1.25 + i * (2.5 / 6);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 20), stdMat(THREE, 0xd0646a, { clippingPlanes: clip }));
      const r = 0.62, cx = 0.05 + Math.cos(ang) * r * 0.9, cy = Math.sin(ang) * r * 1.5;
      cone.position.set(cx, cy, 0);
      cone.rotation.z = Math.atan2(cy - 0, cx + 0.45) + Math.PI / 2;
      tag(cone, 'Renal pyramid', 'الهرم الكلوي', 'Cone of medulla; its tip (papilla) drips urine into a minor calyx.');
      g.add(cone); pyrs.push(cone);
    }
    const pelvisMat = stdMat(THREE, 0xe9c46a, { roughness: 0.4 });
    const pelvis = tag(new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 24), pelvisMat), 'Renal pelvis', 'حوض الكلية', 'Inner funnel collecting urine from the calyces. Kidney stones originate here.');
    pelvis.scale.set(1, 1.35, 0.7); pelvis.position.set(-0.42, -0.05, 0);
    g.add(pelvis);
    const calyces = [];
    pyrs.forEach(c => {
      const tip = c.position.clone().multiplyScalar(0.62); tip.x -= 0.1;
      const curve = new THREE.LineCurve3(new THREE.Vector3(-0.4, -0.05, 0), tip);
      const t = tag(new THREE.Mesh(new THREE.TubeGeometry(curve, 6, 0.055, 10), pelvisMat), 'Calyx', 'الكأس الكلوية', 'Minor calyces collect from each papilla and merge into major calyces, which drain into the pelvis.');
      g.add(t); calyces.push(t);
    });
    const ureterCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.5, -0.2, 0), new THREE.Vector3(-0.85, -0.9, 0.05), new THREE.Vector3(-0.8, -1.8, 0.1), new THREE.Vector3(-0.6, -2.8, 0.05)]);
    const ureterMat = stdMat(THREE, 0xe8b54f, { roughness: 0.45 });
    const ureter = tag(new THREE.Mesh(new THREE.TubeGeometry(ureterCurve, 60, 0.085, 14), ureterMat), 'Ureter', 'الحالب', 'Carries urine from the renal pelvis down to the bladder.');
    g.add(ureter);
    const art = tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.45, 0.2, 0.05), new THREE.Vector3(-1.1, 0.35, 0.1), new THREE.Vector3(-1.9, 0.45, 0.05)]), 30, 0.09, 12), stdMat(THREE, 0xd8343a)), 'Renal artery', 'الشريان الكلوي', 'Brings blood in through the hilum.');
    const vein = tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.45, 0.02, -0.08), new THREE.Vector3(-1.1, 0.08, -0.15), new THREE.Vector3(-1.9, 0.12, -0.1)]), 30, 0.11, 12), stdMat(THREE, 0x2f62c9)), 'Renal vein', 'الوريد الكلوي', 'Returns filtered blood to the body through the hilum.');
    g.add(art, vein);
    g.position.x = 0.35; g.scale.setScalar(1.05);
    a.pickables.push(pelvis, ...calyces, ureter, art, vein, ...pyrs, medulla, cortex);
    Object.assign(THREEd, { THREE, g, pelvis, calyces, ureter, ureterCurve, ureterMat, pelvisMat, cortex });
    applyCut();
  });
  root.appendChild(ctr);
  const after = el('<div class="after"></div>'); root.appendChild(after);
  const rng = $('input', ctr);
  function applyCut() { if (THREEd.plane) THREEd.plane.constant = 1.2 - (rng.value / 100) * 1.2; }
  rng.oninput = applyCut;

  // mini quiz: find parts
  const targets = spec.stone ? [] : shuffle(['Renal cortex', 'Renal medulla', 'Renal pyramid', 'Renal pelvis', 'Calyx', 'Ureter', 'Renal artery', 'Renal vein']);
  let k = 0, errors = 0;
  function ask() {
    if (spec.stone) { $('.find span', prompt).textContent = 'Drop a stone and watch what backs up'; return; }
    if (k >= targets.length) {
      $('.find span', prompt).textContent = 'All 8 parts found'; $('.score', prompt).textContent = `${targets.length}/${targets.length}`;
      if (!after.childNodes.length) { sfx.win(); after.appendChild(winBar(errors ? `All found · ${errors} wrong tap${errors > 1 ? 's' : ''}` : 'All found, no wrong taps', () => { k = 0; errors = 0; after.innerHTML = ''; ask(); })); done && done({ total: targets.length, errors }); }
      return;
    }
    $('.find span', prompt).textContent = targets[k];
    $('.score', prompt).textContent = `${k}/${targets.length}`;
  }
  api.onPick = o => {
    api.showPick(o);
    if (spec.stone || k >= targets.length) return;
    if (o.userData.en === targets[k]) { sfx.ok(); k++; ask(); }
    else { sfx.bad(); errors++; }
  };
  ask();
  if (spec.stone) {
    let t = 0, running = false, stuck = false, swell = 0;
    let stone = null;
    api.onFrame.push(dt => {
      const T = THREEd; if (!T.THREE) return;
      if (running && stone) {
        t = Math.min(0.5, t + dt * 0.18);
        stone.position.copy(t < 0.02 ? new T.THREE.Vector3(-0.42, -0.05, 0) : T.ureterCurve.getPoint(t)).add(T.g.position.clone().multiplyScalar(0));
        if (t >= 0.5 && !stuck) { stuck = true; running = false; sfx.bad(); stuckMsg(); }
      }
      if (stuck && swell < 1) {
        swell = Math.min(1, swell + dt * 0.5);
        const s = 1 + swell * 0.45;
        T.pelvis.scale.set(s, 1.35 * s, 0.7 * s);
        T.calyces.forEach(c => c.scale.setScalar(1 + swell * 0.35));
        T.pelvisMat.color.setHex(0xf2d58a);
        T.ureter.scale.set(1, 1, 1);
      }
    });
    function stuckMsg() {
      after.innerHTML = '';
      after.appendChild(el(`<div class="callout flag"><span class="h">Stone stuck in the ureter</span><div>Urine can’t pass, so it backs up: the pelvis and calyces swell (<k>hydronephrosis</k>) and the ureter above the stone widens (hydroureter). This obstruction is why the patient has <k>flank tenderness</k> and pain. Hematuria is common.</div></div>`));
      done && done({ total: 1, errors: 0 });
    }
    $('[data-drop]', ctr).onclick = () => {
      const T = THREEd; if (!T.THREE) return;
      if (!stone) { stone = tag(new T.THREE.Mesh(new T.THREE.DodecahedronGeometry(0.1, 0), stdMat(T.THREE, 0x9c8a6a, { roughness: 0.9 })), 'Kidney stone', 'حصاة', 'Forms when excess insoluble salts or uric acid crystallize in urine. Originates in the renal pelvis.'); T.g.add(stone); api.pickables.unshift(stone); }
      t = 0; running = true; stuck = false; sfx.tap();
      $('.find span', prompt).textContent = 'The stone leaves the pelvis…';
    };
    $('[data-reset]', ctr).onclick = () => {
      const T = THREEd; if (!T.THREE) return;
      swell = 0; stuck = false; running = false; t = 0;
      T.pelvis.scale.set(1, 1.35, 0.7); T.calyces.forEach(c => c.scale.setScalar(1)); T.pelvisMat.color.setHex(0xe9c46a);
      if (stone) { T.g.remove(stone); api.pickables.shift(); stone = null; }
      after.innerHTML = ''; ask();
    };
  }
};

/* ---------- 3D testicular torsion: twist the cord, watch the blood flow stop ---------- */
IX.torsion3d = function (spec, host, done) {
  const root = el(`<div class="ix"></div>`); host.appendChild(root);
  const status = el(`<div class="prompt"><div class="find"><small>Spermatic cord twist</small><span>0° · normal blood flow</span></div><span class="score mono">0°</span></div>`);
  root.appendChild(status);
  const S3 = {};
  let twist = 0;
  const api = stage3d(root, { dist: 7, ry: 0.35, rx: 0.05, fallback: '<b>3D model unavailable.</b> Testicular torsion = the testicle twists on the spermatic cord. It is a medical emergency when the twist reduces blood flow to the testis.' }, a => {
    const { THREE, root: g } = a;
    function testis(x, affected) {
      const grp = new THREE.Group(); grp.position.x = x;
      const mat = stdMat(THREE, 0xe9a3a0, { roughness: 0.45 });
      const t = tag(new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 30), mat), affected ? 'Testis (affected side)' : 'Testis (normal side)', 'الخصية', affected ? 'Loses blood supply as the cord twists.' : 'Torsion is usually unilateral: the other side stays normal.');
      t.scale.set(0.8, 1, 0.75); t.position.y = -1.3; grp.add(t);
      const ep = tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.05, -0.75, -0.35), new THREE.Vector3(0.1, -1.1, -0.52), new THREE.Vector3(0.05, -1.6, -0.5), new THREE.Vector3(-0.05, -1.85, -0.3)]), 24, 0.11, 10), stdMat(THREE, 0xd4837f)), 'Epididymis', 'البربخ', 'Along the posterior border of the testis.');
      grp.add(ep);
      g.add(grp);
      return { grp, mat, t, ep };
    }
    const L = testis(-0.9, true), R = testis(0.95, false);
    const strands = [{ c: 0xd8343a, en: 'Testicular artery', ar: 'الشريان الخصوي', a0: 0 }, { c: 0x2f62c9, en: 'Veins', ar: 'الأوردة', a0: 2.1 }, { c: 0xf1e3c8, en: 'Vas deferens', ar: 'الأسهر', a0: 4.2 }];
    function cordCurve(a0, tw, xoff) {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const h = i / 24, y = -0.7 + h * 3.4;
        const mid = Math.max(0, 1 - Math.abs(h - 0.35) / 0.35);
        const ang = a0 + tw * Math.min(1, h / 0.7);
        const rad = 0.13 + 0.05 * mid;
        pts.push(new THREE.Vector3(xoff + Math.cos(ang) * rad, y, Math.sin(ang) * rad));
      }
      return new THREE.CatmullRomCurve3(pts);
    }
    const meshes = strands.map(s => { const m = tag(new THREE.Mesh(new THREE.TubeGeometry(cordCurve(s.a0, 0, -0.9), 80, 0.065, 8), stdMat(THREE, s.c)), s.en, s.ar, 'Part of the spermatic cord.'); g.add(m); return m; });
    strands.forEach(s => { const m = new THREE.Mesh(new THREE.TubeGeometry(cordCurve(s.a0, 0, 0.95), 60, 0.065, 8), stdMat(THREE, s.c)); tag(m, s.en + ' (normal side)', s.ar, 'Untwisted.'); g.add(m); a.pickables.push(m); });
    const drops = [];
    for (let i = 0; i < 7; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4d4d })); g.add(d); drops.push({ d, t: i / 7 }); }
    a.pickables.push(L.t, L.ep, R.t, R.ep, ...meshes);
    g.position.y = 0.3;
    Object.assign(S3, { THREE, g, L, meshes, strands, cordCurve, drops });
    a.onFrame.push(dt => {
      const flow = Math.max(0, 1 - twist / 360);
      const curve = cordCurve(strands[0].a0, twist * Math.PI / 180, -0.9);
      drops.forEach(o => {
        o.t = (o.t + dt * 0.35 * flow) % 1;
        const p = curve.getPoint(1 - o.t); o.d.position.copy(p);
        o.d.visible = flow > 0.02;
        o.d.material.color.setHex(flow > 0.4 ? 0xff4d4d : 0xa33a3a);
      });
    });
  });
  const ctr = el(`<div class="ctrl3d"><label class="rng"><span>Twist</span><input type="range" min="0" max="720" step="10" value="0" aria-label="Twist the spermatic cord"></label>
    <div class="row"><button class="btn small" data-v="0">0°</button><button class="btn small" data-v="180">180°</button><button class="btn small" data-v="360">360°</button><button class="btn small" data-v="720">720°</button></div></div>`);
  root.appendChild(ctr);
  const after = el('<div class="after"></div>'); root.appendChild(after);
  const rng = $('input', ctr);
  let reached = false;
  function apply() {
    twist = +rng.value;
    const T = S3;
    if (T.THREE) {
      T.meshes.forEach((m, i) => { m.geometry.dispose(); m.geometry = new T.THREE.TubeGeometry(T.cordCurve(T.strands[i].a0, twist * Math.PI / 180, -0.9), 80, 0.065, 8); });
      const f = Math.min(1, twist / 540);
      T.L.mat.color.setRGB(0.91 - 0.5 * f, 0.64 - 0.42 * f, 0.63 - 0.12 * f);
      T.L.t.scale.set(0.8 + 0.08 * f, 1 + 0.08 * f, 0.75 + 0.08 * f);
    }
    const s = twist === 0 ? 'Normal blood flow' : twist < 360 ? 'Blood flow reduced' : 'Blood flow cut off: medical emergency';
    $('.find span', status).textContent = `${twist}° · ${s}`;
    $('.score', status).textContent = `${twist}°`;
    status.classList.toggle('alarm', twist >= 360);
    if (twist >= 360 && !reached) {
      reached = true; sfx.bad();
      after.innerHTML = '';
      after.appendChild(el(`<div class="callout flag"><span class="h">Testicular torsion</span><div>The testicle has twisted on the <k>spermatic cord</k>. Once the twist reduces blood flow it is a <k>medical emergency</k>. Torsion is <k>usually unilateral</k> (compare the normal side). Care: <k>transport carefully and promptly</k>, <k>position of comfort</k>, <k>analgesics</k> for pain.</div></div>`));
      done && done({ total: 1, errors: 0 });
    }
  }
  rng.oninput = apply;
  $$('[data-v]', ctr).forEach(b => b.onclick = () => { rng.value = b.dataset.v; apply(); });
};

/* ---------- hyperkalemia ECG monitor ---------- */
IX.ecg = function (spec, host, done) {
  const root = el(`<div class="ix ecgsim">
    <div class="mon">
      <div class="mtop"><span class="lead">II</span><span class="kv"><small>K⁺</small><b data-k>4.5</b><small>mEq/L</small></span><span class="hr"><small>HR</small><b data-hr>75</b></span></div>
      <canvas height="170" aria-label="Simulated ECG rhythm strip"></canvas>
      <div class="mbot"><span data-stage>Normal rhythm</span><span data-shield hidden>🛡 Membrane stabilized</span></div>
    </div>
    <label class="rng"><span>Serum K⁺</span><input type="range" min="35" max="95" value="45" aria-label="Serum potassium"></label>
    <div class="treat"><span class="eyebrow">Treat (from your notes: Rx of ↑K⁺)</span>
      <div class="row">
        <button class="btn small" data-t="ecg">12-lead ECG</button>
        <button class="btn small" data-t="ca">Calcium</button>
        <button class="btn small" data-t="ins">Insulin + glucose</button>
        <button class="btn small" data-t="beta">Beta agonist</button>
        <button class="btn small" data-t="bic">Sodium bicarbonate ?</button>
      </div>
      <label class="tog"><input type="checkbox" data-dig> Digoxin toxicity suspected</label></div>
    <div class="log" aria-live="polite"></div>
    <div class="callout beyond"><span class="h">Beyond your notes</span><div>The K⁺ numbers and the order of ECG changes (peaked T → wide QRS → sine wave) come from standard references. Your slides show these ECGs without captions.</div></div>
  </div>`);
  host.appendChild(root);
  const cv = $('canvas', root), ctx = cv.getContext('2d');
  const rng = $('input[type=range]', root), log = $('.log', root);
  let K = 4.5, target = null, ca = 0, used = new Set();
  function params() {
    const e = Math.max(0, K - 5.5);
    const hr = Math.round(Math.max(38, 78 - Math.max(0, K - 6) * 11));
    const qrs = 0.08 + Math.max(0, K - 6.5) * 0.045 * (1 - ca * 0.6);
    const tA = 0.28 + e * 0.32 * (1 - ca * 0.3);
    const tW = Math.max(0.05, 0.11 - e * 0.012);
    const pA = 0.14 * Math.max(0, 1 - Math.max(0, K - 6.5) / 1.3);
    const sine = Math.max(0, Math.min(1, (K - 8.2) / 0.8)) * (1 - ca * 0.7);
    return { hr, qrs, tA, tW, pA, sine };
  }
  function stage() {
    if (K < 5.5) return 'Normal rhythm';
    if (K < 6.5) return 'Peaked T waves';
    if (K < 8.2) return 'Peaked T · wide QRS · flat P';
    return 'Sine wave: arrest risk';
  }
  const g = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
  function v(t, p) {
    const beat = 60 / p.hr, x = t % beat;
    let y = p.pA * g(x, 0.1, 0.035);
    const q = 0.26, w = p.qrs;
    y += -0.12 * g(x, q - w * 0.45, w * 0.18) + 1.05 * g(x, q, w * 0.22) - 0.22 * g(x, q + w * 0.5, w * 0.22);
    y += p.tA * g(x, q + w + 0.22, p.tW);
    const s = 0.9 * Math.sin(2 * Math.PI * t / (beat * 0.9));
    return y * (1 - p.sine) + s * p.sine;
  }
  let x = 0, t = 0, lastY = null, W = 0;
  function size() { const r = window.devicePixelRatio || 1; W = cv.clientWidth; cv.width = W * r; cv.height = 170 * r; ctx.setTransform(r, 0, 0, r, 0, 0); ctx.fillStyle = '#041012'; ctx.fillRect(0, 0, W, 170); grid(0, W); x = 0; lastY = null; }
  function grid(x0, x1) {
    ctx.strokeStyle = 'rgba(47,211,191,.08)'; ctx.lineWidth = 1;
    for (let gx = Math.floor(x0 / 12) * 12; gx < x1; gx += 12) { ctx.beginPath(); ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, 170); ctx.stroke(); }
    for (let gy = 0; gy < 170; gy += 12) { ctx.beginPath(); ctx.moveTo(x0, gy + .5); ctx.lineTo(x1, gy + .5); ctx.stroke(); }
  }
  new ResizeObserver(size).observe(cv);
  let lastNow = performance.now();
  (function loop(now) {
    if (!cv.isConnected) return;
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - lastNow) / 1000); lastNow = now;
    if (target != null) { K += Math.sign(target - K) * Math.min(Math.abs(target - K), dt * 0.5); if (Math.abs(target - K) < 0.01) target = null; rng.value = Math.round(K * 10); upd(); }
    if (!W) return;
    const p = params();
    const pxPerSec = REDUCED ? W / 4 : 110;
    const steps = Math.max(1, Math.round(pxPerSec * dt));
    for (let i = 0; i < steps; i++) {
      t += 1 / pxPerSec;
      ctx.fillStyle = '#041012'; ctx.fillRect(x, 0, 14, 170); grid(x, x + 14);
      const y = 105 - v(t, p) * 62;
      ctx.strokeStyle = '#3cf0b8'; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(60,240,184,.7)'; ctx.shadowBlur = 6;
      if (lastY != null) { ctx.beginPath(); ctx.moveTo(x - 1, lastY); ctx.lineTo(x, y); ctx.stroke(); }
      ctx.shadowBlur = 0;
      lastY = y; x++;
      if (x >= W) { x = 0; lastY = null; }
    }
  })(lastNow);
  function upd() {
    $('[data-k]', root).textContent = K.toFixed(1);
    $('[data-hr]', root).textContent = params().hr;
    const st = stage(); $('[data-stage]', root).textContent = st;
    root.classList.toggle('alarm', K >= 6.5);
  }
  rng.oninput = () => { K = rng.value / 10; target = null; upd(); };
  function say(html, cls = 'why') { log.innerHTML = ''; log.appendChild(el(`<div class="callout ${cls}"><div>${html}</div></div>`)); }
  $$('[data-t]', root).forEach(b => b.onclick = () => {
    const a = b.dataset.t; used.add(a);
    if (a === 'ecg') say('<b>12-lead ECG first.</b> In renal failure it is how you “check electrolytes” in the field: look for the high-K⁺ pattern.');
    if (a === 'ca') {
      if ($('[data-dig]', root).checked) { sfx.bad(); say('<b>Stop: avoid calcium if digoxin toxicity is suspected.</b> Your notes list this exception.', 'flag'); return; }
      ca = 1; $('[data-shield]', root).hidden = false; sfx.ok();
      say(`<b>Calcium stabilizes the cardiac cell membranes</b> → lower risk of arrhythmia. Look at the K⁺ number: <b>${K.toFixed(1)}, unchanged</b>. Calcium does <b>not</b> lower K⁺.`);
    }
    if (a === 'ins' || a === 'beta') { target = Math.max(4.2, K - (a === 'ins' ? 1.2 : 0.8)); sfx.ok(); say(`<b>${a === 'ins' ? 'Insulin + glucose' : 'Beta agonist'}</b> is in your notes under “reduction in serum K⁺ levels”. Watch the K⁺ value fall and the ECG settle.`); }
    if (a === 'bic') say('<b>Sodium bicarbonate?</b> Your notes list it with a question mark: its role in lowering K⁺ is uncertain. Table 21-3 says calcium and bicarbonate “may be considered” for hyperkalemia if a lab value was obtained at a sending facility.', 'beyond');
    if (used.has('ca') && (used.has('ins') || used.has('beta'))) done && done({ total: 1, errors: 0 });
  });
  $('[data-dig]', root).onchange = () => { if ($('[data-dig]', root).checked && ca) { ca = 0; $('[data-shield]', root).hidden = true; } };
  upd();
  if (spec.startK) { K = spec.startK; rng.value = K * 10; upd(); }
};

/* ---------- AKI flow model: pre / intra / post ---------- */
IX.aki = function (spec, host, done) {
  const rows = {
    normal: { t: 'Normal', d: 'Blood reaches the kidney, the glomeruli filter it, and urine drains to the bladder.', s: [] },
    pre: { t: 'Prerenal AKI', d: 'Caused by <k>hypoperfusion of the kidneys</k>: not enough blood arrives. Special type: <k>hepatorenal syndrome</k> in advanced liver disease, where portal hypertension severely reduces renal perfusion.', s: ['Hypotension', 'Tachycardia', 'Dizziness', 'Thirst'] },
    intra: { t: 'Intrarenal AKI', d: 'Damage inside the kidney itself: at the <k>glomeruli</k>, the <k>tubules</k> or the <k>interstitium</k>.', s: ['Flank pain', 'Joint pain', 'Oliguria', 'Hypertension', 'Headache', 'Confusion', 'Seizure'] },
    post: { t: 'Postrenal AKI', d: 'Caused by <k>blockage of urine flow from the kidneys</k>. Urine backs up behind the block.', s: ['Pain in lower flank, abdomen, groin and genitalia', 'Oliguria', 'Distended bladder', 'Hematuria', 'Peripheral edema'] },
  };
  const root = el(`<div class="ix aki" data-mode="normal">
    <div class="seg" role="group" aria-label="Where is the problem?">
      <button data-m="normal" aria-pressed="true">Normal</button><button data-m="pre">Before</button><button data-m="intra">Inside</button><button data-m="post">After</button></div>
    <div class="akisvg">${akiSVG()}</div>
    <div class="akiinfo"></div></div>`);
  host.appendChild(root);
  const seen = new Set();
  function set(m) {
    root.dataset.mode = m;
    $$('[data-m]', root).forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m));
    const r = rows[m];
    $('.akiinfo', root).innerHTML = `<h3>${r.t}</h3><p class="lede" style="font-size:15px">${r.d}</p>${r.s.length ? `<p class="eyebrow" style="margin-top:10px">Table 21-2 signs</p><div class="chips">${r.s.map(x => `<span>${x}</span>`).join('')}</div>` : ''}`;
    if (m !== 'normal') { seen.add(m); sfx.tap(); }
    if (seen.size === 3) done && done({ total: 3, errors: 0 });
  }
  $$('[data-m]', root).forEach(b => b.onclick = () => set(b.dataset.m));
  set('normal');
};
function akiSVG() {
  return `<svg viewBox="0 0 360 230" role="img" aria-label="Blood flows from the heart to the kidney; urine flows from the kidney to the bladder">
  <defs><linearGradient id="kg" x1="0" x2="1"><stop offset="0" stop-color="#c0564a"/><stop offset="1" stop-color="#8e2f36"/></linearGradient></defs>
  <g class="heart"><path d="M52 60c-14-18-44-6-32 20 6 12 32 30 32 30s26-18 32-30c12-26-18-38-32-20z" fill="#d8343a"/><text x="52" y="128" text-anchor="middle" class="lb">Heart</text></g>
  <path class="pipe" d="M84 76 C130 76 140 96 168 100"/><path class="flow blood" d="M84 76 C130 76 140 96 168 100"/>
  <g class="kid"><path d="M200 60c-34 0-40 42-30 70 8 24 32 34 50 22 10-7 4-20 -2-28-6-8-6-18 2-26 8-8 12-20 4-30-6-6-14-8-24-8z" fill="url(#kg)"/><g class="cracks"><path d="M188 90l10 8-6 10 10 6M182 120l12-2 4 10" stroke="#1a0b0d" stroke-width="2.5" fill="none" stroke-linecap="round"/></g><text x="196" y="178" text-anchor="middle" class="lb">Kidney</text></g>
  <path class="pipe" d="M214 128 C240 150 250 160 262 176"/><path class="flow urine up" d="M214 128 C240 150 250 160 262 176"/>
  <g class="block"><circle cx="246" cy="156" r="9" fill="#9c8a6a" stroke="#fff" stroke-width="2"/></g>
  <g class="bl"><ellipse class="bladder" cx="290" cy="192" rx="30" ry="22" fill="#e9b7a8" stroke="#c37f70" stroke-width="2"/><text x="290" y="226" text-anchor="middle" class="lb">Bladder</text></g>
  <g class="liver"><path d="M98 150c-24 0-36 14-30 26 8 14 50 10 64 0 10-8 0-26-34-26z" fill="#8a5a3c"/><text x="96" y="204" text-anchor="middle" class="lb">Liver (hepatorenal)</text></g>
  </svg>`;
}

/* ---------- Foley catheter simulator ---------- */
IX.foley = function (spec, host, done) {
  const root = el(`<div class="ix foley" data-bag="low" data-kink="0" data-balloon="1" data-out="0">
    <div class="foleysvg"><svg viewBox="0 0 340 260" role="img" aria-label="Bladder with Foley catheter draining into a bag">
      <ellipse cx="110" cy="70" rx="62" ry="46" fill="#f0c9bd" stroke="#c37f70" stroke-width="2.5"/>
      <ellipse class="urine" cx="110" cy="84" rx="50" ry="26" fill="#f5d77a" opacity=".85"/>
      <text x="110" y="16" text-anchor="middle" class="lb">Bladder</text>
      <circle class="balloon" cx="110" cy="108" r="11" fill="#9fd6ff" stroke="#3a8fd0" stroke-width="2"/>
      <path class="tube" d="M110 112 L110 160 C110 190 150 200 262 172"/>
      <path class="tflow" d="M110 112 L110 160 C110 190 150 200 262 172"/>
      <g class="kinkmark"><path d="M104 150l12 6-12 6" stroke="#ff6f61" stroke-width="3" fill="none"/></g>
      <g class="bag"><rect x="-26" y="-6" width="52" height="66" rx="10" fill="rgba(245,215,122,.25)" stroke="#9aa9ad" stroke-width="2"/><rect class="bagfill" x="-22" y="30" width="44" height="26" rx="6" fill="#f5d77a" opacity=".85"/><text x="0" y="78" text-anchor="middle" class="lb">Drainage bag</text></g>
      <line x1="10" y1="118" x2="330" y2="118" class="level"/><text x="330" y="112" text-anchor="end" class="lb small">bladder level</text>
    </svg></div>
    <div class="row wrap">
      <button class="btn small" data-a="bag">Lift the bag</button>
      <button class="btn small" data-a="kink">Kink the tube</button>
      <button class="btn small" data-a="deflate">Deflate balloon</button>
      <button class="btn small" data-a="remove">Remove catheter</button>
    </div>
    <div class="log" aria-live="polite"></div></div>`);
  host.appendChild(root);
  const svg = $('svg', root);
  function layout() {
    const low = root.dataset.bag === 'low';
    const bx = 262, by = low ? 172 : 18;
    const d = `M110 112 L110 160 C110 190 150 ${low ? 200 : 150} ${bx} ${by}`;
    $$('.tube, .tflow', svg).forEach(p => p.setAttribute('d', d));
    $('.bag', svg).setAttribute('transform', `translate(${bx} ${by})`);
    const flow = $('.tflow', svg);
    const bad = !low, stop = root.dataset.kink === '1' || root.dataset.out === '1';
    flow.classList.toggle('rev', bad && !stop); flow.classList.toggle('stop', stop);
    $('.balloon', svg).setAttribute('r', root.dataset.balloon === '1' ? 11 : 4);
  }
  const seen = new Set();
  const log = $('.log', root);
  function say(html, cls) { log.innerHTML = ''; log.appendChild(el(`<div class="callout ${cls}"><div>${html}</div></div>`)); }
  $$('[data-a]', root).forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'bag') {
      root.dataset.bag = root.dataset.bag === 'low' ? 'high' : 'low';
      b.textContent = root.dataset.bag === 'low' ? 'Lift the bag' : 'Lower the bag';
      if (root.dataset.bag === 'high') { sfx.bad(); seen.add('bag'); say('<b>Urine backflow.</b> With the bag lifted above the bladder, urine runs back up the tube. Your notes: urine backflow is a concern when transporting a catheterized patient, so <k>do not lift the drainage bag</k> while handling the patient.', 'flag'); }
      else { sfx.ok(); say('Bag below the bladder: continuous outflow again. The catheter also lets staff <k>measure urine output</k>.', 'why'); }
    }
    if (a === 'kink') {
      root.dataset.kink = root.dataset.kink === '1' ? '0' : '1';
      b.textContent = root.dataset.kink === '1' ? 'Straighten the tube' : 'Kink the tube';
      if (root.dataset.kink === '1') { sfx.bad(); seen.add('kink'); say('<b>No outflow.</b> A kinked tube stops drainage. Your notes: <k>do not pull out or kink</k> the catheter.', 'flag'); } else { sfx.ok(); say('Tube straight: urine flows again.', 'why'); }
    }
    if (a === 'deflate') {
      if (root.dataset.out === '1') return;
      root.dataset.balloon = root.dataset.balloon === '1' ? '0' : '1';
      b.textContent = root.dataset.balloon === '1' ? 'Deflate balloon' : 'Re-inflate balloon';
      seen.add('deflate'); sfx.tap();
      say(root.dataset.balloon === '1' ? 'Balloon inflated: it holds the catheter inside the bladder.' : 'Balloon deflated. Now the catheter can be removed safely.', 'why');
    }
    if (a === 'remove') {
      if (root.dataset.balloon === '1') { sfx.bad(); seen.add('removeBad'); say('<b>Stop.</b> The internal balloon is still inflated. If the catheter must be removed, <k>ensure the internal balloon is deflated</k> first.', 'flag'); }
      else { root.dataset.out = '1'; sfx.win(); seen.add('removed'); say('Catheter removed safely: balloon deflated first.', 'why'); }
    }
    layout();
    if (seen.has('bag') && seen.has('kink') && seen.has('removed')) done && done({ total: 3, errors: seen.has('removeBad') ? 1 : 0 });
  });
  layout();
  say('Try each action and see what happens to the flow. Goal: find the three handling rules from your notes, then remove the catheter safely.', 'hook');
};

/* ---------- dialysis circuit ---------- */
IX.dialysis = function (spec, host, done) {
  const probs = [
    { id: 'disc', t: 'Accidental disconnection', fx: 'disc', m: 'Turn off the machine, clamp the ends of the shunt, disconnect the patient from the machine, transport. If bleeding: direct pressure.' },
    { id: 'bleed', t: 'Bleeding from fistula or shunt', fx: 'bleed', m: 'If the shunt cannot be reconnected, clamp it off; apply direct pressure to control bleeding; check for signs of shock.' },
    { id: 'mach', t: 'Machine malfunction', fx: 'stop', m: 'Turn off the machine; clamp the ends of the shunt; disconnect the patient from the machine; transport.' },
    { id: 'hypo', t: 'Rapid fluid shift → hypotension', fx: 'bp', m: 'Administer 50 mL of normal saline intravenously (Table 21-3).' },
    { id: 'k', t: 'Potassium imbalance', fx: 'k', m: 'Hypokalemia: treat bradycardia with atropine. Hyperkalemia: calcium and bicarbonate may be considered if a lab value was obtained at a sending facility.' },
    { id: 'dis', t: 'Disequilibrium syndrome', fx: 'brain', m: 'Provide only supportive treatment. (Cerebral edema from fluid shifts into the brain after a rapid fall in serum osmolality: nausea, headache, disorientation, confusion, dizziness, seizures, coma or death.)' },
    { id: 'air', t: 'Air embolism', fx: 'air', m: 'Position the patient left lateral recumbent with about 10° of head-down tilt.' },
  ];
  const root = el(`<div class="ix dial" data-fx="">
    <div class="dialsvg"><svg viewBox="0 0 360 200" role="img" aria-label="Hemodialysis circuit from the forearm access to the machine and back">
      <rect x="236" y="30" width="104" height="130" rx="14" fill="#dfe8ea" stroke="#9aa9ad" stroke-width="2"/>
      <rect x="250" y="46" width="76" height="30" rx="5" class="screen"/>
      <text x="288" y="66" text-anchor="middle" class="scr">BP <tspan class="bp">128/76</tspan></text>
      <rect x="276" y="92" width="24" height="54" rx="10" fill="#f4f7f8" stroke="#9aa9ad"/>
      <text x="288" y="178" text-anchor="middle" class="lb">Dialysis machine</text>
      <path d="M20 150 C70 120 120 120 170 132" stroke="#e8b8a0" stroke-width="34" fill="none" stroke-linecap="round"/>
      <text x="40" y="190" class="lb">Forearm: fistula / AV shunt</text>
      <path class="line art" d="M120 128 C140 60 200 50 276 100"/>
      <path class="line ven" d="M150 132 C170 180 230 180 276 140"/>
      <path class="flow a" d="M120 128 C140 60 200 50 276 100"/>
      <path class="flow v" d="M276 140 C230 180 170 180 150 132"/>
      <g class="fx-bleed"><circle cx="122" cy="132" r="8" fill="#d8343a"/><circle cx="118" cy="150" r="5" fill="#d8343a"/><circle cx="128" cy="160" r="3.5" fill="#d8343a"/></g>
      <g class="fx-disc"><path d="M150 132 l-8 -12" stroke="#ff6f61" stroke-width="4"/></g>
      <g class="fx-air"><circle cx="210" cy="164" r="5" fill="#fff" stroke="#48c9ea"/><circle cx="196" cy="168" r="3.5" fill="#fff" stroke="#48c9ea"/><circle cx="224" cy="160" r="4" fill="#fff" stroke="#48c9ea"/></g>
      <g class="fx-brain"><path d="M40 40c-12 0-18 10-14 18-8 4-6 16 4 18 2 8 14 10 20 4 8 6 20 2 20-8 8-2 8-16-2-18 0-10-14-14-20-8-2-4-6-6-8-6z" fill="#f2b8c4" stroke="#c0708a" stroke-width="2"/><text x="52" y="100" text-anchor="middle" class="lb">brain swelling</text></g>
      <g class="fx-k"><text x="50" y="62" class="kk">K⁺ ↑↓</text></g>
    </svg></div>
    <div class="probs"></div>
    <div class="log" aria-live="polite"></div></div>`);
  host.appendChild(root);
  const box = $('.probs', root), log = $('.log', root);
  const seen = new Set();
  probs.forEach(p => {
    const b = el(`<button class="chipbtn">${esc(p.t)}</button>`);
    b.onclick = () => {
      root.dataset.fx = p.fx; seen.add(p.id); sfx.bad();
      $$('.chipbtn', box).forEach(x => x.classList.remove('sel')); b.classList.add('sel');
      $('.bp', root).textContent = p.fx === 'bp' ? '78/44' : '128/76';
      log.innerHTML = ''; log.appendChild(el(`<div class="callout why"><span class="h">${esc(p.t)} · prehospital management</span><div>${p.m}</div></div>`));
      if (seen.size === probs.length) done && done({ total: probs.length, errors: 0 });
    };
    box.appendChild(b);
  });
  log.appendChild(el(`<div class="callout hook"><div>Blood leaves the access, is cleaned by the machine, and returns. Tap each problem to see what goes wrong and what you do. Explore all ${probs.length}.</div></div>`));
};

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

/* ---------- nine abdominal regions: tap the cell ---------- */
IX.regions = function (spec, host, done) {
  const cells = [['rhc', 'Right hypochondriac', 'المراقي الأيمن'], ['epi', 'Epigastric', 'الشرسوفي'], ['lhc', 'Left hypochondriac', 'المراقي الأيسر'],
    ['rlum', 'Right lumbar', 'القطني الأيمن'], ['peri', 'Periumbilical', 'حول السرة'], ['llum', 'Left lumbar', 'القطني الأيسر'],
    ['ril', 'Right iliac', 'الحرقفي الأيمن'], ['hypo', 'Hypogastric', 'الخثلي'], ['lil', 'Left iliac', 'الحرقفي الأيسر']];
  const root = el(`<div class="ix">
    <div class="prompt"><div class="find"><small>Tap the region</small><span></span></div><span class="score"></span></div>
    <div class="regwrap"><div class="fig"><img src="${IMG.regions}" alt="Torso with the nine abdominal regions"><div class="grid9"></div></div>
    <p class="muted" style="font-size:13px;margin-top:6px">You are facing the patient: the patient’s <b>right</b> is on <b>your left</b>.</p></div>
    <div class="after"></div></div>`);
  host.appendChild(root);
  const grid = $('.grid9', root);
  const btns = cells.map(c => { const b = el(`<button aria-label="${c[1]}"></button>`); grid.appendChild(b); return b; });
  let order, k, errors;
  function start() { order = shuffle(cells.map((c, i) => i)); k = 0; errors = 0; btns.forEach(b => { b.className = ''; b.textContent = ''; }); $('.after', root).innerHTML = ''; ask(); }
  function ask() { $('.find span', root).textContent = cells[order[k]][1]; $('.score', root).textContent = `${k}/9`; }
  btns.forEach((b, i) => b.onclick = () => {
    if (k >= 9) return;
    if (i === order[k]) { sfx.ok(); b.className = 'ok'; b.textContent = cells[i][1]; k++; if (k === 9) { $('.find span', root).textContent = 'All 9 regions'; $('.score', root).textContent = '9/9'; sfx.win(); $('.after', root).appendChild(winBar(errors ? `9 regions · ${errors} wrong tap${errors > 1 ? 's' : ''}` : '9/9 with no wrong taps', start)); done && done({ total: 9, errors }); } else ask(); }
    else { sfx.bad(); errors++; b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 500); }
  });
  start();
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

/* ---------- urine output checker (oliguria thresholds) ---------- */
IX.uo = function (spec, host, done) {
  const root = el(`<div class="ix">
    <div class="viz" style="display:grid;gap:12px">
      <label class="rng"><span>Weight</span><input type="range" min="10" max="130" value="70" data-w aria-label="Weight in kilograms"></label>
      <label class="rng"><span>Output</span><input type="range" min="0" max="120" value="60" data-o aria-label="Urine output in millilitres per hour"></label>
      <div class="statrow">
        <div class="stat"><b data-wv>70 kg</b><span>patient weight</span></div>
        <div class="stat"><b data-ov>60 mL/h</b><span>urine output</span></div>
        <div class="stat"><b data-tv>35 mL/h</b><span>oliguria line (0.5 mL/kg/h)</span></div>
      </div>
      <div class="uobar"><i data-bar></i><span data-line></span></div>
      <div data-verdict class="verdict"></div>
      <p class="muted" style="font-size:13.5px" data-day></p>
    </div>
    <p class="lede" style="font-size:15px">Your notes give two oliguria definitions: less than <n>500 mL/day</n> in an adult, or less than <n>0.5 mL/kg/h</n> in an adult or child. Anuria is complete cessation of urine. Find the weight where a 30 mL/h output becomes oliguria.</p></div>`);
  host.appendChild(root);
  const w = $('[data-w]', root), o = $('[data-o]', root);
  let hits = new Set();
  function upd() {
    const kg = +w.value, ml = +o.value, th = kg * 0.5, day = ml * 24;
    $('[data-wv]', root).textContent = kg + ' kg'; $('[data-ov]', root).textContent = ml + ' mL/h'; $('[data-tv]', root).textContent = th.toFixed(0) + ' mL/h';
    const bar = $('[data-bar]', root); bar.style.width = Math.min(100, ml / 120 * 100) + '%';
    $('[data-line]', root).style.left = Math.min(100, th / 120 * 100) + '%';
    const v = $('[data-verdict]', root);
    let st;
    if (ml === 0) { st = 'anuria'; v.className = 'verdict bad'; v.innerHTML = `${I.x}<span>Anuria: no urine at all</span>`; }
    else if (ml < th) { st = 'olig'; v.className = 'verdict bad'; v.innerHTML = `${I.x}<span>Oliguria: below 0.5 mL/kg/h</span>`; }
    else { st = 'ok'; v.className = 'verdict good'; v.innerHTML = `${I.check}<span>Above the oliguria line</span>`; }
    bar.style.background = st === 'ok' ? 'var(--teal)' : 'var(--coral)';
    $('[data-day]', root).textContent = `Over a day that is about ${day.toLocaleString()} mL (${day < 500 ? 'below' : 'above'} the 500 mL/day adult line).`;
    hits.add(st);
    if (hits.has('ok') && hits.has('olig') && hits.has('anuria')) done && done({ total: 1, errors: 0 });
  }
  w.oninput = upd; o.oninput = upd; upd();
};
