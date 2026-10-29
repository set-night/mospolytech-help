interface PagefindData {
  url: string;
  meta: { title?: string };
  excerpt: string;
  filters?: Record<string, string[]>;
}
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindData>;
}
interface Pagefind {
  search: (
    query: string,
    options?: { filters?: Record<string, string> },
  ) => Promise<{ results: PagefindResult[] }>;
  init?: () => Promise<void>;
}
const dialog = document.querySelector<HTMLDialogElement>('#search-dialog')!;
const input = document.querySelector<HTMLInputElement>('#search-input')!;
const category = document.querySelector<HTMLSelectElement>('#search-category')!;
const results = document.querySelector<HTMLDivElement>('#search-results')!;
const status = document.querySelector<HTMLParagraphElement>('#search-status')!;
let previousFocus: HTMLElement | null = null;
let pagefind: Promise<Pagefind> | undefined;
let request = 0;
let timer: ReturnType<typeof setTimeout>;
const aliases: Record<string, string> = {
  общага: 'общежитие',
  общагу: 'общежитие',
  общаге: 'общежитие',
  стипуха: 'стипендия',
  стипуху: 'стипендия',
  лк: 'личный кабинет',
  матпомощь: 'материальная помощь',
  физра: 'физкультура',
  физру: 'физкультура',
  академ: 'академический отпуск',
  пд: 'проектная деятельность',
};
function keyboardLayout(query: string): string {
  const en = "qwertyuiop[]asdfghjkl;'zxcvbnm,.",
    ru = 'йцукенгшщзхъфывапролджэячсмитьбю';
  return [...query].map((c) => (en.includes(c) ? ru[en.indexOf(c)] : c)).join('');
}
function normalize(query: string): string {
  const value = query.toLowerCase().trim().replaceAll('ё', 'е');
  return value
    .split(/\s+/)
    .map((word) => aliases[word] ?? word)
    .join(' ');
}
async function loadSearch(): Promise<Pagefind> {
  const modulePath = '/pagefind/pagefind.js';
  pagefind ??= import(/* @vite-ignore */ modulePath)
    .then((module) => module as Pagefind)
    .catch((error) => {
      pagefind = undefined;
      throw error;
    });
  return pagefind;
}
export function openSearch(query?: string): void {
  if (dialog.open) return;
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.showModal();
  document.body.classList.add('search-open');
  if (query !== undefined) input.value = query;
  input.focus();
  void runSearch();
}
function closeSearch(): void {
  dialog.close();
}
dialog.addEventListener('close', () => {
  document.body.classList.remove('search-open');
  previousFocus?.focus();
});
document.querySelector('#close-search')?.addEventListener('click', closeSearch);
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      closeSearch();
  }
});
document
  .querySelectorAll<HTMLElement>('[data-open-search]')
  .forEach((button) => button.addEventListener('click', () => openSearch(button.dataset.query)));
document.addEventListener('keydown', (event) => {
  const editing =
    event.target instanceof HTMLElement &&
    (event.target.matches('input,textarea,select') || event.target.isContentEditable);
  if (
    (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) ||
    (event.key === '/' && !editing)
  ) {
    event.preventDefault();
    openSearch();
  }
  if (dialog.open && event.key === 'Escape') {
    event.preventDefault();
    closeSearch();
    return;
  }
  if (!dialog.open || !['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
  if (event.target === category) return;
  const links = [...results.querySelectorAll<HTMLAnchorElement>('a')];
  if (!links.length) return;
  const current = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (event.key === 'Enter' && event.target === input) {
    event.preventDefault();
    links[0].click();
  } else if (event.key !== 'Enter') {
    event.preventDefault();
    links[(current + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus();
  }
});
async function runSearch(): Promise<void> {
  const id = ++request,
    query = normalize(input.value);
  results.replaceChildren();
  if (!query) {
    status.textContent = 'Ищите своими словами. Например: «общага», «справка», «пересдача».';
    return;
  }
  status.textContent = 'Ищем…';
  try {
    const engine = await loadSearch();
    let response = await engine.search(
      query,
      category.value ? { filters: { category: category.value } } : undefined,
    );
    if (!response.results.length && /[a-z]/i.test(query)) {
      response = await engine.search(
        normalize(keyboardLayout(query)),
        category.value ? { filters: { category: category.value } } : undefined,
      );
    }
    const entries = await Promise.all(response.results.slice(0, 20).map((result) => result.data()));
    if (id !== request) return;
    status.textContent = entries.length
      ? `Найдено: ${response.results.length}${response.results.length > 20 ? '. Показываем первые 20.' : ''}`
      : 'Ничего не нашлось. Попробуйте короче или выберите другой раздел.';
    for (const entry of entries) {
      const url = new URL(entry.url, location.origin);
      if (url.origin !== location.origin) continue;
      const link = document.createElement('a');
      link.href = url.pathname + url.hash;
      link.className = 'search-result';
      const title = document.createElement('strong');
      title.textContent = entry.meta.title ?? 'Статья';
      const excerpt = document.createElement('p');
      // Keep only Pagefind highlight elements; never insert result HTML into the document.
      const parsed = new DOMParser().parseFromString(entry.excerpt, 'text/html');
      for (const node of parsed.body.childNodes) {
        if (node instanceof HTMLElement && node.tagName === 'MARK') {
          const mark = document.createElement('mark');
          mark.textContent = node.textContent;
          excerpt.append(mark);
        } else excerpt.append(document.createTextNode(node.textContent ?? ''));
      }
      link.append(title, excerpt);
      results.append(link);
    }
  } catch {
    if (id === request)
      status.textContent =
        'Не удалось загрузить поиск. Попробуйте ещё раз или откройте все материалы по ссылке ниже.';
  }
}
input.addEventListener('input', () => {
  clearTimeout(timer);
  ++request;
  timer = setTimeout(() => void runSearch(), 120);
});
category.addEventListener('change', () => void runSearch());
const initial = new URLSearchParams(location.search).get('q');
if (initial) openSearch(initial);
