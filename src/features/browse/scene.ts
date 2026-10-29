const element = document.querySelector<HTMLElement>('.search-stage');
if (element) {
  const scene = element;
  const root = document.documentElement;
  const search = scene.querySelector<HTMLElement>('.stage-search-wrap')!;
  const form = scene.querySelector<HTMLElement>('.hub-search')!;
  const links = scene.querySelector<HTMLElement>('.floating-services')!;
  const cue = scene.querySelector<HTMLElement>('.stage-more')!;
  const art = scene.querySelector<HTMLElement>('[data-scene-parallax]')!;
  const guide = document.querySelector<HTMLElement>('#guide')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0,
    startY = 0,
    endY = 0,
    mobile = false;
  function render(): void {
    const progress = Math.min(1, Math.max(0, scrollY / Math.max(1, startY - endY)));
    const scale = 1 - (mobile ? 0.04 : 0.28) * progress * progress;
    search.style.setProperty('--search-y', `${Math.max(endY, startY - scrollY)}px`);
    search.style.setProperty('--search-scale', String(scale));
    scene.style.setProperty('--scene-progress', String(progress));
    root.classList.toggle('search-docked', progress > 0.96);
    root.classList.toggle('scene-scrolled', scrollY > 24);
    links.inert = progress > 0.72;
    cue.inert = progress > 0.96;
  }
  function measure(): void {
    mobile = matchMedia('(max-width: 1050px)').matches;
    startY = scene.clientHeight / 2 - form.offsetHeight / 2;
    endY = mobile ? document.querySelector<HTMLElement>('.site-header')!.offsetHeight + 11 : 12;
    render();
  }
  function schedule(): void {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
  }
  measure();
  root.classList.add('scene-ready');
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('pageshow', measure);
  function revealResults(): void {
    if (scrollY < scene.offsetHeight - 160)
      guide.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  }
  scene.closest('[data-browse]')?.addEventListener('browse:results', revealResults);
  // Links from articles must land on their filtered results, below the search scene.
  const params = new URLSearchParams(location.search);
  if (['q', 'tag', 'category'].some((key) => params.get(key))) requestAnimationFrame(revealResults);
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let pointerFrame = 0;
    scene.addEventListener('pointermove', (event) => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        if (reduced.matches) return;
        const rect = scene.getBoundingClientRect();
        art.style.setProperty('--drift-x', `${(event.clientX / rect.width - 0.5) * 18}px`);
        art.style.setProperty(
          '--drift-y',
          `${((event.clientY - rect.top) / rect.height - 0.5) * 14}px`,
        );
      });
    });
    scene.addEventListener('pointerleave', () => {
      cancelAnimationFrame(pointerFrame);
      art.style.setProperty('--drift-x', '0px');
      art.style.setProperty('--drift-y', '0px');
    });
  }
}
export {};
