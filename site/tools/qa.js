// Headless QA: click through every step of every built module at 360px in dark and light,
// complete every interactive, answer every question, visit every tool view.
// Fails on console errors, page errors, or horizontal overflow.
// Usage: NODE_PATH=$(npm root -g) node site/tools/qa.js [--shots DIR]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RESET = ':root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui;background:#fafafa}img{max-width:100%}[hidden]{display:none!important}';
let LAST = '';
const shotsDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;

function harness() {
  const body = fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8');
  const html = `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${RESET}</style></head><body>${body}</body></html>`;
  const f = path.join(ROOT, 'dist/_qa.html');
  fs.writeFileSync(f, html);
  return 'file://' + f;
}

async function overflow(page) {
  return page.evaluate(() => {
    const d = document.documentElement;
    if (d.scrollWidth <= d.clientWidth + 1) return null;
    const bad = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > d.clientWidth + 1 && !e.closest('.figwrap.zoomed') && getComputedStyle(e).position !== 'fixed'; }).slice(0, 5).map(e => e.tagName + '.' + e.className);
    return { sw: d.scrollWidth, cw: d.clientWidth, bad };
  });
}

async function run(theme, OUT) {
  const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: theme, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
  if (process.env.THREE_JS) await ctx.route('**/three.min.js', r => r.fulfill({ path: process.env.THREE_JS, contentType: 'application/javascript' }));
  const page = await ctx.newPage();
  const errors = OUT.errors;
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && !/ERR_(NAME|INTERNET|TUNNEL|CONNECTION|PROXY|CERT|TOO_MANY)/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const issues = OUT.issues;
  let n = 0;
  const shot = async (name) => { if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${theme}-${String(++n).padStart(2, '0')}-${name}.png`), fullPage: false }); };
  const checkOverflow = async (where) => { const o = await overflow(page); if (o) issues.push(`[${theme}] overflow at ${where}: ${JSON.stringify(o)}`); };

  await page.goto(harness());
  await page.waitForSelector('.hero');
  await checkOverflow('home'); await shot('home');

  const mods = await page.evaluate(() => MODULES.filter(m => CONTENT[m.id]).map(m => m.id));
  for (const mid of mods) {
    await page.evaluate(id => openModule(id, 0), mid);
    const total = await page.evaluate(id => flowOf(id).length, mid);
    for (let i = 0; i < total; i++) {
      await page.waitForSelector('.step');
      const st = await page.evaluate(id => { const s = flowOf(id)[prog(id).at]; return { t: s.t, kind: s.kind, id: s.id, spec: s.spec || null, q: s.q ? { id: s.q.id, type: s.q.type } : null }; }, mid);
      const where = `${mid} step ${i + 1}/${total} (${st.t}${st.kind ? ':' + st.kind : ''})`; LAST = where;
      try {
      // reveal predicts
      for (const b of await page.$$('.predict button')) await b.click();
      if (st.t === 'card') {
        const fig = await page.$('.step .fig');
        if (fig) {
          await fig.click(); await page.waitForSelector('.lb'); await checkOverflow(where + ' lightbox');
          
          await page.click('.lb [data-x]');
        }
      }
      if (st.t === 'ix') {
        const ok = await page.$('.step .ix');
        if (!ok) issues.push(`[${theme}] interactive did not mount: ${where}`);
        if (st.kind === 'label') {
          for (let g = 0; g < 40; g++) {
            const txt = await page.$eval('.ix .find span', e => e.textContent);
            if (txt === 'All found') break;
            const id = await page.evaluate(([fig, t]) => FIGS[fig].labels.find(l => l.en === t).id, [st.spec.fig, txt]);
            const sel = `.ix .pin.dot[data-id="${id}"]`;
            await page.$eval(sel, e => e.scrollIntoView({ block: 'center' }));
            await page.click(sel, { force: true });
          }
        } else if (st.kind === 'order') {
          for (const it of st.spec.items) { const id = typeof it === "object" ? it.id : it; await page.click(`.ix .tray .chipbtn[data-id="${id}"]`); await page.waitForTimeout(60); }
          await page.waitForTimeout(1200);
        } else if (st.kind === 'sort') {
          for (let g = 0; g < 30; g++) {
            const c = await page.$('.ix .tray .chipbtn');
            if (!c) break;
            const bin = await c.getAttribute('data-bin');
            await c.click(); await page.click(`.ix .bin[data-bin="${bin}"]`);
          }
        } else if (st.kind === 'match') {
          const L = await page.$$eval('.ix .L button', bs => bs.map(b => b.dataset.i));
          for (const i2 of L) { await page.click(`.ix .L button[data-i="${i2}"]`); await page.click(`.ix .R button[data-i="${i2}"]`); }
        }
        else if (st.kind === 'aki') {
          for (const k of ['pre', 'intra', 'post']) await page.click(`.aki [data-m="${k}"]`);
        } else if (st.kind === 'foley') {
          for (const a of ['bag', 'bag', 'kink', 'kink', 'remove', 'deflate', 'remove']) await page.click(`.foley [data-a="${a}"]`);
        } else if (st.kind === 'dialysis') {
          for (const b of await page.$$('.dial .probs .chipbtn')) await b.click();
        } else if (st.kind === 'uo') {
          for (const v of [60, 10, 0]) await page.$eval('.ix [data-o]', (e, v) => { e.value = v; e.dispatchEvent(new Event('input')); }, v);
        } else if (st.kind === 'ecg') {
          await page.$eval('.ecgsim input[type=range]', e => { e.value = 80; e.dispatchEvent(new Event('input')); });
          await page.waitForTimeout(400);
          for (const t of ['ecg', 'ca', 'ins', 'bic']) await page.click(`.ecgsim [data-t="${t}"]`);
          await page.waitForTimeout(300);
        } else if (st.kind === 'torsion3d') {
          await page.waitForTimeout(1500);
          await page.$eval('.ctrl3d input', e => { e.value = 360; e.dispatchEvent(new Event('input')); });
          const fb = await page.$('.stage3d .fallback:not([hidden])');
          if (fb) issues.push(`[${theme}] 3D fallback shown (three.js not loaded) at ${where}`);
        } else if (st.kind === 'kidney3d') {
          await page.waitForTimeout(2000);
          const fb = await page.$('.stage3d .fallback:not([hidden])');
          const cv = await page.$('.stage3d canvas');
          if (fb || !cv) issues.push(`[${theme}] 3D kidney did not render at ${where}`);
          if (st.spec.stone && cv) { await page.click('[data-drop]'); await page.waitForTimeout(3600); }
        } else if (st.kind === 'triage') {
          const correct = st.spec.cases.map(c => c.opts[0]);
          for (let g = 0; g < 40; g++) {
            if (await page.$('.ix .win')) break;
            const opts = await page.$$('.ix .opt:not([disabled])');
            let clicked = false;
            for (const o of opts) { const t = await o.$eval('span:last-child', e => e.innerHTML); if (correct.includes(t)) { await o.click(); clicked = true; break; } }
            if (!clicked) { issues.push(`[${theme}] triage: no correct option found at ${where}`); break; }
            const nb = await page.$('.ix .btn.primary.small'); if (nb) await nb.click();
          }
        } else if (st.kind === 'regions') {
          for (let g = 0; g < 12; g++) { const t = await page.$eval('.ix .find span', e => e.textContent); if (t.startsWith('All')) break; await page.click(`.grid9 button[aria-label="${t}"]`); }
        } else if (st.kind === 'compare') {
          for (let g = 0; g < 8; g++) { const t = await page.$eval('.ix .find span', e => e.textContent); const r = st.spec.rounds.find(x => x.q === t); if (!r) break; await (await page.$$('.pcard'))[r.ans === 'a' ? 0 : 1].click(); }
        }
        await page.waitForTimeout(150);
        const won = await page.evaluate(([m, id]) => !!prog(m).ix[id], [mid, st.id]);
        if (!won && !['kidney3d'].includes(st.kind)) issues.push(`[${theme}] interactive not completed: ${where}`);
        if (['kidney3d', 'torsion3d', 'ecg', 'aki', 'foley', 'dialysis'].includes(st.kind)) await shot(`${mid}-ix-${st.id}`);
      }
      if (st.t === 'q') {
        if (st.q.type === 'sa') {
          await page.fill('.sa textarea', 'test answer');
          await page.click('.sa [data-self]');
          await page.click('.sa [data-mark]');
        } else {
          // alternate: answer wrong on odd questions to exercise the lock-in round
          const want = (i % 3 === 0);
          const btns = await page.$$('.opt');
          const idx = await page.evaluate(([id, want]) => {
            const q = QINDEX[id].q; const opts = [...document.querySelectorAll('.opt span:last-child')].map(s => s.innerHTML);
            const right = opts.indexOf(q.opts[0]);
            return want ? (right + 1) % opts.length : right;
          }, [st.q.id, want]);
          await btns[idx].click();
        }
        if (mid === 'm1' && i < 8) await shot(`${mid}-q-${st.q.id}`);
      }
      if (st.t === 'lockin') {
        for (let g = 0; g < 40; g++) {
          const qEl = await page.$('.step .q[data-qid]');
          if (!qEl) break;
          const qid = await qEl.getAttribute('data-qid');
          if (await page.$('.step .sa')) {
            await page.click('.step .sa [data-self]');
            for (const c of await page.$$('.step .checks input')) await c.check();
            await page.click('.step .sa [data-mark]');
          } else {
            const idx = await page.evaluate(id => { const q = QINDEX[id].q; return [...document.querySelectorAll('.step .opt span:last-child')].map(s => s.innerHTML).indexOf(q.opts[0]); }, qid);
            if (idx < 0) { issues.push(`[${theme}] lock-in could not find answer for ${qid}`); break; }
            await (await page.$$('.step .opt'))[idx].click();
          }
          const nb = await page.$('.step button.btn.small:has-text("Next question"), .step button.btn.small:has-text("Finish round")');
          if (!nb) break;
          await nb.click();
        }
        
      }
      if (st.t === 'recall') {
        const revs = await page.$$('.rc [data-rev]');
        for (const r of revs) await r.click();
        const miss = await page.$('.rc .again'); if (miss) await miss.click();
        const gots = await page.$$('.rc .got'); for (const g of gots) await g.click();
        
      }
      if (st.t === 'intro') await shot(`${mid}-${st.t}`);
      } catch (err) { issues.push(`[${theme}] EXCEPTION at ${where}: ${err.message.split('\n')[0]}`); await shot('err-' + mid + '-' + i); }
      await checkOverflow(where);
      const dis = await page.$eval('[data-next]', b => b.disabled);
      if (dis) { issues.push(`[${theme}] continue disabled at ${where}`); break; }
      await page.click('[data-next]');
    }
  }
  // tools
  for (const v of ['cards', 'search', 'mistakes', 'settings', 'more', 'learn', 'exam', 'numbers', 'cheat', 'hub', 'lab']) {
    await page.evaluate(v => go(v), v);
    if (v === 'search') { await page.fill('#q-search', 'pelvis'); await page.waitForTimeout(100); const n2 = await page.$$eval('.res', r => r.length); if (!n2) issues.push(`[${theme}] search found nothing for "pelvis"`); }
    await checkOverflow(v); await shot(v);
  }
  // exam: quick 10-question end-feedback run
  await page.evaluate(() => go('exam'));
  await page.click('.seg[data-k="len"] button[data-v="10"]');
  await page.click('[data-go]');
  for (let g = 0; g < 12; g++) { const o = await page.$('.opt:not([disabled])'); if (!o) break; await o.click(); await page.waitForTimeout(450); }
  await page.waitForTimeout(300); await checkOverflow('exam results'); await shot('exam-results');
  await page.evaluate(() => go('numbers'));
  for (let g = 0; g < 3; g++) { await (await page.$$('.opt'))[0].click(); await page.click('.btn.primary'); }
  await page.evaluate(() => go('hub')); await page.click('[data-quiz]');
  for (let g = 0; g < 3; g++) { await (await page.$$('.opt'))[0].click(); await page.click('.btn.primary.small'); }
  await page.evaluate(() => go('lab', { tab: 'quiz' }));
  for (let g = 0; g < 3; g++) { await (await page.$$('.opt'))[0].click(); await page.click('.btn.primary.small'); }
  await shot('lab-quiz');
  await page.evaluate(() => go('lab', { tab: 'ix' })); await shot('lab-ix');
  await page.evaluate(() => go('cheat')); await page.fill('#q-cheat', 'dialysis'); await shot('cheat-filter');
  await page.evaluate(() => go('cards', { start: true }));
  for (let k = 0; k < 4; k++) { await page.click('.fc'); await page.waitForTimeout(80); await page.click(k % 2 ? '.fcbtns .got' : '.fcbtns .again'); }
  await shot('cards-session');
  await page.evaluate(() => go('arabic', { mid: 'm1' })); await checkOverflow('arabic'); await shot('arabic');
  await page.evaluate(() => go('mistakes')); await shot('mistakes-after');
  await browser.close();
  return { errors, issues };
}

(async () => {
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
  let fail = 0;
  for (const theme of ['dark', 'light']) {
    const OUT = { errors: [], issues: [] }; const { errors, issues } = OUT;
    try { await run(theme, OUT); } catch (e) { issues.push('CRASH after ' + LAST + ': ' + e.message.split('\n')[0]); }
    console.log(`== ${theme}: ${errors.length} errors, ${issues.length} issues`);
    [...errors, ...issues].forEach(x => console.log('  ' + x));
    fail += errors.length + issues.length;
  }
  process.exit(fail ? 1 : 0);
})();
