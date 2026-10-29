const toggle = document.querySelector<HTMLButtonElement>('#theme-toggle');
function syncTheme(): void {
  const light = document.documentElement.dataset.theme === 'light';
  toggle?.setAttribute('aria-label', light ? 'Включить тёмную тему' : 'Включить светлую тему');
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', light ? '#ffffff' : '#1e1e1e');
}
toggle?.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  // Apply synchronously: repeated clicks and immediate navigation must keep the latest choice.
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('polytech-theme', theme);
  } catch {
    /* Storage can be blocked. */
  }
  syncTheme();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    toggle.getAnimations().forEach((animation) => animation.cancel());
    toggle.animate(
      [{ transform: 'rotate(-40deg) scale(.7)' }, { transform: 'rotate(0) scale(1)' }],
      { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' },
    );
  }
});
window.addEventListener('storage', (event) => {
  if (event.key === 'polytech-theme') {
    document.documentElement.dataset.theme = event.newValue === 'light' ? 'light' : 'dark';
    syncTheme();
  }
});
syncTheme();
export {};
