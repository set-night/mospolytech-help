const button = document.querySelector<HTMLButtonElement>('#menu-toggle')!;
const nav = document.querySelector<HTMLElement>('#mobile-nav')!;
const header = document.querySelector<HTMLElement>('.site-header')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function setMenu(open: boolean): void {
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  nav.getAnimations().forEach((animation) => animation.cancel());
  nav.hidden = !open;
  if (open && !reduced.matches)
    nav.animate(
      [
        { opacity: 0, transform: 'translateY(-8px) scale(.97)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: 220, easing: 'cubic-bezier(.16,1,.3,1)' },
    );
}
button.addEventListener('click', () => setMenu(nav.hidden !== false));
document.addEventListener('click', (event) => {
  if (
    !nav.hidden &&
    event.target instanceof Node &&
    !nav.contains(event.target) &&
    !button.contains(event.target)
  )
    setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (
    event.key === 'Escape' &&
    !nav.hidden &&
    !document.querySelector<HTMLDialogElement>('#search-dialog')?.open
  ) {
    setMenu(false);
    button.focus();
  }
});
const syncScroll = (): void => {
  header.toggleAttribute('data-scrolled', scrollY > 12);
};
addEventListener('scroll', syncScroll, { passive: true });
addEventListener('pageshow', syncScroll);
syncScroll();
export {};
