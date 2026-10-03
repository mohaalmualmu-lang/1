/* ===== boot ===== */
indexContent();
applyTheme();
/* read-aloud (assets/read-aloud.js from the read-aloud skill, inlined unchanged by the build) */
if (window.ReadAloud) ReadAloud.init({
  targets: '.ra-unit, .arwrap .blk, .cs .blk',
  button: 'start',
  skip: '.src, .kind, .tag, .fig, .zoomer, .xd, .lv, .meta, .eyebrow, .pair, .L',
  ui: 'ar',
  lang: 'en',
  storageKey: 'heme25-read-aloud',
  clean: (t, lang) => lang !== 'en' ? t : t
    .replace(/\((?:[AB]\d+n?(?:\s*[–,·\s-]+\s*[AB]?\d+n?)*)\)/g, ' ')
    .replace(/×\s?10⁶\/mcL/g, ' million per microliter')
    .replace(/cells\/mm³/g, 'cells per cubic millimeter').replace(/\/mm³/g, ' per cubic millimeter')
    .replace(/cells\/mcL/g, 'cells per microliter').replace(/\/mcL/g, ' per microliter').replace(/g\/dL/g, 'grams per deciliter')
    .replace(/Ca⁺²|Ca\+2/g, 'calcium').replace(/\bCO₂/g, 'carbon dioxide').replace(/\bO₂/g, 'oxygen').replace(/B₁₂/g, 'B12')
    .replace(/⅓/g, ' one third ').replace(/⅔/g, ' two thirds ').replace(/≈\s?/g, 'about ')
    .replace(/<\s?(\d)/g, 'less than $1').replace(/>\s?(\d)/g, 'more than $1')
    .replace(/\bHct\b/g, 'hematocrit').replace(/\bHb\b/g, 'hemoglobin')
    .replace(/\b(AB|A|B|O)([+−])(?=[\s,.;:)]|$)/g, (m, g, sg) => g + (sg === '+' ? ' positive' : ' negative'))
    .replace(/\b(XIII|XII|XI|IX|X|VIII|VII|VI|V|III|II)(a)?\b(?![-\w])/g, (m, r, a) =>
      ['', '', 'two', 'three', '', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen'][['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'].indexOf(r)] + (a ? ' A' : ''))
});
/* deep link: #<card or question id> opens that step; #ar opens the Arabic summary */
(function () {
  const h = (location.hash || '').slice(1);
  if (!h) return;
  if (h === 'ar') { R.view = 'arabic'; R.params = {}; return; }
  for (const m of MODULES) {
    if (!CONTENT[m.id]) continue;
    const i = flowOf(m.id).findIndex(s => (s.q ? s.q.id : s.id) === h);
    if (i >= 0) { S.started[m.id] = true; prog(m.id).at = i; R.view = 'module'; R.params = { mid: m.id }; return; }
  }
})();
render();
if (window.matchMedia) {
  const mq = matchMedia('(prefers-color-scheme: light)');
  const onChange = () => { if (S.set.theme === 'auto') render(); };
  mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
}
claudeReady.then(() => $$('[data-needs-claude]').forEach(n => n.hidden = !SAMPLE));
