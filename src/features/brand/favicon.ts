const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
if (icon) {
  const link = icon;
  const fallback = link.getAttribute('href')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frames: string[] = [];
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let loading = false;

  function stop(): void {
    clearTimeout(timer);
    timer = undefined;
    link.setAttribute('href', fallback);
  }

  function tick(): void {
    if (document.hidden || reduced.matches) return stop();
    link.href = frames[frame];
    frame = (frame + 1) % frames.length;
    // A short bounce, then a rest. No continuous frame loop or network requests.
    timer = setTimeout(tick, frame === 0 ? 4200 : 90);
  }

  function start(): void {
    stop();
    if (document.hidden || reduced.matches || !frames.length) return;
    frame = 0;
    timer = setTimeout(tick, 500);
  }

  async function load(): Promise<void> {
    if (loading) return;
    loading = true;
    try {
      const response = await fetch(fallback);
      if (!response.ok) return;
      const svg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      const dot = svg.getElementById('question-dot');
      if (!dot || svg.querySelector('parsererror')) return;
      const serializer = new XMLSerializer();
      frames = Array.from({ length: 14 }, (_, index) => {
        const progress = index / 13;
        const height = -4 * 8 * progress * (1 - progress);
        dot.setAttribute('transform', `translate(0 ${height.toFixed(2)})`);
        return `data:image/svg+xml,${encodeURIComponent(serializer.serializeToString(svg))}`;
      });
      start();
    } catch {
      // The static, transparent question mark remains available offline or on failure.
    }
  }

  function sync(): void {
    if (document.hidden || reduced.matches) stop();
    else if (frames.length) start();
    else void load();
  }
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('pagehide', stop);
  addEventListener('pageshow', sync);
  sync();
}
export {};
