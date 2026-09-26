// Headless QA: click through every step of every built module at 360px in dark and light,
// complete every interactive, answer every question, visit every tool view.
// Fails on console errors, page errors, or horizontal overflow.
// Usage: NODE_PATH=$(npm root -g) node site/tools/qa.js [--shots DIR]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RESET = ':root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui;background:#fafafa}img{max-width:100%}[hidden]{display:none!important}';
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

async function run(theme) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: theme, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && !/ERR_(NAME|INTERNET|TUNNEL|CONNECTION|PROXY|CERT)/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const issues = [];
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
      const where = `${mid} step ${i + 1}/${total} (${st.t}${st.kind ? ':' + st.kind : ''})`;
      // reveal predicts
      for (const b of await page.$$('.predict button')) await b.click();
      if (st.t === 'card') {
        const fig = await page.$('.step .fig');
        if (fig) {
          await fig.click(); await page.waitForSelector('.lb'); await checkOverflow(where + ' lightbox');
          if (i < 12) await shot(`${mid}-lightbox-${i}`);
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
            await page.click(`.ix .pin.dot[data-id="${id}"]`, { force: true });
          }
        } else if (st.kind === 'order') {
          for (const id of st.spec.items) { await page.click(`.ix .tray .chipbtn[data-id="${id}"]`); await page.waitForTimeout(60); }
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
        const won = await page.$('.ix .win');
        if (!won) issues.push(`[${theme}] interactive not completed: ${where}`);
        await shot(`${mid}-ix-${st.id}`);
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
        if (i < 16) await shot(`${mid}-q-${st.q.id}`);
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
        await shot(`${mid}-lockin`);
      }
      if (st.t === 'recall') {
        const revs = await page.$$('.rc [data-rev]');
        for (const r of revs) await r.click();
        const miss = await page.$('.rc .again'); if (miss) await miss.click();
        const gots = await page.$$('.rc .got'); for (const g of gots) await g.click();
        await shot(`${mid}-recall`);
      }
      if (st.t === 'hooks' || st.t === 'done' || st.t === 'intro') await shot(`${mid}-${st.t}`);
      await checkOverflow(where);
      const dis = await page.$eval('[data-next]', b => b.disabled);
      if (dis) { issues.push(`[${theme}] continue disabled at ${where}`); break; }
      await page.click('[data-next]');
    }
  }
  // tools
  for (const v of ['cards', 'search', 'mistakes', 'settings', 'more', 'learn']) {
    await page.evaluate(v => go(v), v);
    if (v === 'search') { await page.fill('#q-search', 'pelvis'); await page.waitForTimeout(100); const n2 = await page.$$eval('.res', r => r.length); if (!n2) issues.push(`[${theme}] search found nothing for "pelvis"`); }
    await checkOverflow(v); await shot(v);
  }
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
    const { errors, issues } = await run(theme);
    console.log(`== ${theme}: ${errors.length} errors, ${issues.length} issues`);
    [...errors, ...issues].forEach(x => console.log('  ' + x));
    fail += errors.length + issues.length;
  }
  process.exit(fail ? 1 : 0);
})();
