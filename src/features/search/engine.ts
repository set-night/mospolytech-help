let pagefind: Promise<Pagefind> | undefined;
export interface PagefindData {
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

export async function searchArticles(query: string, category?: string) {
  const engine = await loadSearch();
  const normalized = normalize(query);
  const options = category ? { filters: { category } } : undefined;
  let response = await engine.search(normalized, options);
  if (!response.results.length && /[a-z]/i.test(normalized))
    response = await engine.search(normalize(keyboardLayout(normalized)), options);
  return response;
}
