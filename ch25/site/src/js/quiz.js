/* ===== questions: MCQ + short answer ===== */
const LV = { R: 'Recall', U: 'Understand', A: 'Apply' };

function recordQ(id, ok) {
  const r = S.qs[id] || { r: 0, w: 0 };
  ok ? r.r++ : r.w++;
  r.last = Date.now(); r.ok = ok;
  S.qs[id] = r;
  if (ok) delete S.mist[id]; else S.mist[id] = Date.now();
  save();
}

/* opts: {onAnswer(ok), where} */
function renderQ(q, host, opts = {}) {
  if (q.type === 'sa') return renderSA(q, host, opts);
  const order = shuffle(q.opts.map((t, i) => i));
  const root = el(`<div class="q" data-qid="${q.id}">
    <div class="lv"><span class="tag check">${LV[q.lv] || 'Question'}</span>${q.flag ? '<span class="tag" style="color:var(--coral)">⚑ Flagged fact</span>' : ''}${q.fig ? '' : ''}</div>
    <div class="stem">${q.stem}</div>
    <div class="figq"></div>
    <div class="opts" role="group" aria-label="Answer options"></div>
    <div class="fb" aria-live="polite"></div></div>`);
  if (q.fig) $('.figq', root).appendChild(figureEl(q.fig, { labels: false }));
  const box = $('.opts', root);
  const btns = order.map((i, pos) => {
    const b = el(`<button class="opt"><span class="L">${'ABCD'[pos]}</span><span>${q.opts[i]}</span></button>`);
    b.onclick = () => answer(i, b);
    box.appendChild(b); return b;
  });
  function answer(i, b) {
    const ok = i === 0;
    if (opts.quiet) {
      btns.forEach(x => x.disabled = true); b.classList.add('picked'); sfx.tap();
      recordQ(q.id, ok); opts.onAnswer && opts.onAnswer(ok, i); return;
    }
    btns.forEach((x, pos) => { x.disabled = true; const oi = order[pos]; if (oi === 0) x.classList.add('right'); else if (x !== b) x.classList.add('dim'); });
    if (!ok) b.classList.add('wrong');
    ok ? sfx.ok() : sfx.bad();
    recordQ(q.id, ok);
    const hasTrap = q.trap && q.trap[0] > 0 && q.trap[1];
    const trapI = hasTrap ? q.trap[0] : null;
    const trapTxt = trapI != null ? q.opts[trapI] : null;
    const fb = $('.fb', root);
    fb.appendChild(el(`<div class="verdict ${ok ? 'good' : 'bad'}">${ok ? I.check : I.x}<span>${ok ? 'Correct' : 'Not quite'}</span></div>`));
    fb.appendChild(el(`<div class="callout why" style="margin-top:10px"><span class="h">Why “${strip(q.opts[0])}” is right</span><div>${q.why}</div></div>`));
    if (hasTrap) fb.appendChild(el(`<div class="callout flag" style="margin-top:8px"><span class="h">${!ok && i === trapI ? 'Why your pick is wrong' : 'The tempting wrong answer'}: “${strip(trapTxt)}”</span><div>${q.trap[1]}</div></div>`));
    if (!ok && i !== trapI && q.opts[i]) fb.appendChild(el(`<p class="muted" style="font-size:13.5px;margin-top:8px">You picked “${strip(q.opts[i])}”. It does not fit: re-read the explanation above.</p>`));
    if (q.flag) fb.appendChild(el(`<div class="callout beyond" style="margin-top:8px"><span class="h">⚑ Flag</span><div>${q.flag}</div></div>`));
    if (q.src) fb.appendChild(el(`<div class="src" style="margin-top:8px">Source: ${esc(q.src)}</div>`));
    opts.onAnswer && opts.onAnswer(ok, i);
  }
  host.appendChild(root);
  return root;
}

function renderSA(q, host, opts = {}) {
  const root = el(`<div class="q sa" data-qid="${q.id}">
    <div class="lv"><span class="tag check">Short answer</span></div>
    <div class="stem">${q.stem}</div>
    <textarea id="sa-${q.id}" placeholder="Type your answer from memory…" aria-label="Your answer"></textarea>
    <div class="row">
      <button class="btn primary small" data-claude data-needs-claude ${SAMPLE ? '' : 'hidden'}>${I.spark} Grade with Claude</button>
      <button class="btn small" data-self>Check against model answer</button>
    </div>
    <div class="fb" aria-live="polite"></div></div>`);
  const ta = $('textarea', root), fb = $('.fb', root);
  let answered = false;
  function finish(ok) {
    if (answered) return; answered = true;
    ok ? sfx.ok() : sfx.bad();
    recordQ(q.id, ok);
    fb.appendChild(el(`<div class="verdict ${ok ? 'good' : 'bad'}" style="margin-top:10px">${ok ? I.check : I.x}<span>${ok ? 'Marked correct' : 'Marked for review'}</span></div>`));
    opts.onAnswer && opts.onAnswer(ok);
  }
  function showModel(gotSet) {
    fb.innerHTML = '';
    const list = el(`<div class="checks"></div>`);
    q.points.forEach((p, i) => {
      const got = gotSet ? gotSet.has(i) : false;
      list.appendChild(el(`<label class="${gotSet ? (got ? 'got' : 'miss') : ''}"><input type="checkbox" ${got ? 'checked' : ''}> <span>${p}</span></label>`));
    });
    fb.appendChild(el(`<div class="callout why"><span class="h">Model answer</span><div>${q.model}</div></div>`));
    fb.appendChild(el(`<p class="eyebrow" style="margin-top:12px">Tick every point your answer included</p>`));
    fb.appendChild(list);
    const row = el(`<div class="row" style="margin-top:10px"><button class="btn primary small" data-mark>Save my mark</button></div>`);
    $('[data-mark]', row).onclick = () => {
      const n = $$('input', list).filter(x => x.checked).length;
      row.remove();
      finish(n >= Math.ceil(q.points.length * (q.pass || 1)));
    };
    fb.appendChild(row);
  }
  $('[data-self]', root).onclick = () => showModel(null);
  $('[data-claude]', root).onclick = async () => {
    const ans = ta.value.trim();
    if (!ans) { toast('Write your answer first'); ta.focus(); return; }
    if (!SAMPLE) return showModel(null);
    const btn = $('[data-claude]', root); btn.disabled = true;
    fb.innerHTML = '<p class="muted">Claude is reading your answer…</p>';
    const prompt = `You are grading a BSc Emergency Medical Services student's short answer for an exam on "Hematologic Emergencies" (Chapter 25).
The ONLY source of truth is the model answer and key points below (they come from the student's course notes). Do not reward facts outside them, and do not penalise wording or spelling if the meaning is right.

Question: ${strip(q.stem)}
Model answer: ${strip(q.model)}
Key points (0-indexed):
${q.points.map((p, i) => `${i}. ${strip(p)}`).join('\n')}

Student answer:
"""${ans.slice(0, 2000)}"""

Reply with only JSON: {"got":[indices of key points clearly present],"feedback":"one or two short sentences in English telling the student exactly what was missing or wrong"}`;
    try {
      const r = await SAMPLE.json(prompt, { modelTier: 'quick' });
      const got = new Set((r && Array.isArray(r.got) ? r.got : []).map(Number).filter(n => n >= 0 && n < q.points.length));
      showModel(got);
      if (r && r.feedback) fb.insertBefore(el(`<div class="callout hook"><span class="h">Claude's feedback · ${got.size}/${q.points.length} points</span><div>${esc(r.feedback)}</div></div>`), fb.firstChild);
    } catch (e) {
      const m = claudeErr(e);
      showModel(null);
      if (m) fb.insertBefore(el(`<p class="muted" style="font-size:13.5px">${esc(m)}</p>`), fb.firstChild);
    } finally { btn.disabled = false; }
  };
  host.appendChild(root);
  return root;
}

/* ask-Claude panel for a teaching card */
function explainPanel(card, host) {
  const box = el(`<div data-needs-claude ${SAMPLE ? '' : 'hidden'}>
    <div class="xd"><span class="eyebrow" style="align-self:center;margin-right:4px">Explain differently</span>
      <button class="chipbtn" data-m="simple">Simpler</button>
      <button class="chipbtn" data-m="case">With a patient example</button>
      <button class="chipbtn" data-m="ar" style="font-family:var(--f-ar)">اشرحها بالعربي</button></div>
    <div class="xdout" hidden></div></div>`);
  const out = $('.xdout', box);
  let ctl = null;
  $$('[data-m]', box).forEach(b => b.onclick = async () => {
    if (!SAMPLE) return;
    ctl && ctl.abort(); ctl = new AbortController();
    const m = b.dataset.m;
    const how = m === 'simple' ? 'Explain it again in simpler words, as if to a first-year student. Use a short everyday analogy.'
      : m === 'case' ? 'Explain it through one short, realistic prehospital patient example (EMS call), then say which fact from the card the example shows.'
      : 'Explain it in clear Arabic (Modern Standard, friendly tone). Keep every medical term in English exactly as written in the card, e.g. "hematocrit".';
    out.hidden = false; out.classList.toggle('ar', m === 'ar'); out.setAttribute('dir', m === 'ar' ? 'rtl' : 'ltr');
    out.textContent = 'Thinking…';
    const prompt = `A BSc EMS student is studying this card from their course notes (Chapter 25, Hematologic Emergencies):

Title: ${card.title}
Card: ${strip([].concat(card.body).join(" "))}

${how}
Rules: stay within the facts on the card. If you add anything that is not on the card, put it in a final line starting with "Beyond your notes:". Maximum 120 words. Plain text, no markdown headings.`;
    try {
      await SAMPLE(prompt, { signal: ctl.signal, onText: ({ text }) => { out.textContent = text; } });
    } catch (e) {
      const msg = claudeErr(e);
      out.textContent = (e && e.text) ? e.text + (msg ? '\n\n' + msg : '') : msg;
      if (!msg && !(e && e.text)) out.hidden = true;
    }
  });
  host.appendChild(box);
}
