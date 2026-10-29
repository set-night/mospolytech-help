import { searchArticles } from '../search/engine';
import { normalizeTag, formatMaterialCount } from './topics';
const root = document.querySelector<HTMLElement>('[data-browse]');
if (root) {
  const query = root.querySelector<HTMLInputElement>('#browse-query')!;
  const form = root.querySelector<HTMLFormElement>('.hub-search')!;
  const cards = [...root.querySelectorAll<HTMLElement>('[data-article]')];
  const categories = [...root.querySelectorAll<HTMLAnchorElement>('[data-category]')];
  const tags = [...root.querySelectorAll<HTMLAnchorElement>('[data-tag]')];
  const title = root.querySelector<HTMLElement>('#feed-title')!;
  const count = root.querySelector<HTMLElement>('#browse-count')!;
  const reset = root.querySelector<HTMLButtonElement>('#browse-reset')!;
  const more = root.querySelector<HTMLButtonElement>('#browse-more')!;
  const empty = root.querySelector<HTMLElement>('#browse-empty')!;
  const notice = root.querySelector<HTMLElement>('#browse-notice')!;
  const grid = root.querySelector<HTMLElement>('#answer-grid')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cardTags = new Map(
    cards.map((card) => [card, JSON.parse(card.dataset.tags ?? '[]') as string[]]),
  );
  let category = '',
    tag = '',
    limit = 8,
    request = 0;
  let timer: ReturnType<typeof setTimeout>;
  function readURL(): void {
    const params = new URLSearchParams(location.search);
    query.value = (params.get('q') ?? '').slice(0, 200);
    const requested = params.get('category') ?? root?.dataset.initialCategory ?? '';
    category = categories.some((link) => link.dataset.category === requested) ? requested : '';
    tag = normalizeTag(params.get('tag') ?? '');
    limit = 8;
  }
  function writeURL(push = false): void {
    const url = new URL(location.href);
    for (const [key, value] of [
      ['q', query.value.trim()],
      ['category', category],
      ['tag', tag],
    ]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (root?.dataset.initialCategory && !category) url.searchParams.set('category', 'all');
    if (url.href !== location.href) history[push ? 'pushState' : 'replaceState'](null, '', url);
  }
  function paint(matches: HTMLElement[], animate: boolean): void {
    const oldRects = new Map(
      cards.filter((card) => !card.hidden).map((card) => [card, card.getBoundingClientRect()]),
    );
    const visible = new Set(matches.slice(0, limit));
    cards.forEach((card) => {
      card.hidden = !visible.has(card);
      card.style.removeProperty('order');
    });
    // Keep visual, keyboard and screen-reader order identical.
    grid.append(...matches, ...cards.filter((card) => !matches.includes(card)));
    categories.forEach((link) =>
      link.setAttribute('aria-current', String(link.dataset.category === category)),
    );
    tags.forEach((link) => link.setAttribute('aria-current', String(link.dataset.tag === tag)));
    const categoryTitle = categories
      .find((link) => link.dataset.category === category)
      ?.querySelector('span')?.textContent;
    title.textContent = query.value.trim()
      ? 'Результаты поиска'
      : tag
        ? `#${tag}`
        : category
          ? (categoryTitle ?? 'Материалы')
          : 'Нужно сейчас';
    count.textContent =
      matches.length === cards.length
        ? formatMaterialCount(cards.length)
        : `${matches.length} из ${cards.length}`;
    reset.hidden = !(query.value || category || tag);
    empty.hidden = matches.length > 0;
    more.hidden = matches.length <= limit;
    more.setAttribute(
      'aria-label',
      `Показать ещё материалы: осталось ${Math.max(0, matches.length - limit)}`,
    );
    if (animate && !reduced.matches) {
      [...visible].forEach((card, index) => {
        const before = oldRects.get(card),
          after = card.getBoundingClientRect();
        const frames = before
          ? [
              { transform: `translate(${before.left - after.left}px,${before.top - after.top}px)` },
              { transform: 'translate(0,0)' },
            ]
          : [
              { opacity: 0, transform: 'translateY(12px) scale(.985)' },
              { opacity: 1, transform: 'translateY(0) scale(1)' },
            ];
        card.animate(frames, {
          duration: 420,
          delay: before ? 0 : Math.min(index * 25, 150),
          easing: 'cubic-bezier(.16,1,.3,1)',
        });
      });
    }
  }
  async function update(animate = true): Promise<void> {
    const id = ++request;
    const text = query.value.trim();
    notice.hidden = true;
    let matches = cards.filter(
      (card) =>
        (!category || card.dataset.categoryId === category) &&
        (!tag || cardTags.get(card)?.includes(tag)),
    );
    if (text) {
      form.setAttribute('aria-busy', 'true');
      try {
        const response = await searchArticles(text, category);
        const entries = await Promise.all(response.results.map((result) => result.data()));
        if (id !== request) return;
        const ranks = new Map(
          entries.map((entry, index) => [
            decodeURIComponent(new URL(entry.url, location.origin).pathname)
              .split('/')
              .filter(Boolean)
              .at(-1),
            index,
          ]),
        );
        matches = matches
          .filter((card) => ranks.has(card.dataset.article))
          .sort(
            (a, b) => (ranks.get(a.dataset.article) ?? 0) - (ranks.get(b.dataset.article) ?? 0),
          );
      } catch {
        if (id !== request) return;
        notice.textContent = 'Полнотекстовый поиск недоступен. Пока ищем по названиям и тегам.';
        notice.hidden = false;
        matches = matches.filter((card) =>
          normalizeTag(`${card.textContent} ${card.dataset.tags}`).includes(normalizeTag(text)),
        );
      } finally {
        if (id === request) form.removeAttribute('aria-busy');
      }
    } else form.removeAttribute('aria-busy');
    if (id === request) {
      paint(matches, animate);
      if (text || category || tag) root?.dispatchEvent(new CustomEvent('browse:results'));
    }
  }
  function clear(): void {
    clearTimeout(timer);
    query.value = '';
    category = '';
    tag = '';
    limit = 8;
    writeURL(true);
    void update();
  }
  root.addEventListener('click', (event) => {
    if (
      !(event instanceof MouseEvent) ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[data-category],a[data-tag]')
        : null;
    if (!link) return;
    event.preventDefault();
    clearTimeout(timer);
    if (link.hasAttribute('data-category')) category = link.dataset.category ?? '';
    else tag = tag === link.dataset.tag ? '' : (link.dataset.tag ?? '');
    limit = 8;
    writeURL(true);
    void update();
  });
  query.addEventListener('input', () => {
    ++request;
    clearTimeout(timer);
    limit = 8;
    writeURL();
    timer = setTimeout(() => void update(), 140);
  });
  query.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && query.value) {
      event.preventDefault();
      query.value = '';
      writeURL();
      void update();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      root.querySelector<HTMLAnchorElement>('.answer-card:not([hidden]) .answer-main')?.focus();
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTimeout(timer);
    writeURL();
    void update();
  });
  reset.addEventListener('click', clear);
  root.querySelector('#browse-clear')?.addEventListener('click', clear);
  more.addEventListener('click', () => {
    const previous = limit;
    limit += 12;
    void update(true).then(() => {
      grid
        .querySelectorAll<HTMLAnchorElement>('.answer-card:not([hidden]) .answer-main')
        [previous]?.focus({ preventScroll: true });
    });
  });
  window.addEventListener('popstate', () => {
    readURL();
    void update();
  });
  readURL();
  void update(false);
}
