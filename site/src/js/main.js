/* ===== boot ===== */
indexContent();
applyTheme();
render();
if (window.matchMedia) {
  const mq = matchMedia('(prefers-color-scheme: light)');
  const onChange = () => { if (S.set.theme === 'auto') render(); };
  mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
}
claudeReady.then(() => $$('[data-needs-claude]').forEach(n => n.hidden = !SAMPLE));
