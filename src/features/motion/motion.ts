const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const reveal = (elements: Element[]): void => {
  if (reduced.matches) return;
  elements.forEach((element, index) => {
    element.animate(
      [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 560, delay: Math.min(index * 45, 270), easing: 'cubic-bezier(.16,1,.3,1)' },
    );
  });
};
reveal([...document.querySelectorAll('[data-enter]')]);
const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting);
    reveal(visible.map((entry) => entry.target));
    visible.forEach((entry) => observer.unobserve(entry.target));
  },
  { threshold: 0.08 },
);
document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
reduced.addEventListener('change', () => {
  if (reduced.matches) document.getAnimations().forEach((animation) => animation.cancel());
});
// One pointer listener per surface; no frame loop, no effects on touch devices.
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((surface) => {
    let frame = 0;
    surface.addEventListener('pointermove', (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (reduced.matches) return;
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        surface.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      });
    });
    surface.addEventListener('pointerleave', () => cancelAnimationFrame(frame));
  });
}
