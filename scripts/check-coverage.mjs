import fs from 'node:fs';
import matter from 'gray-matter';

const read = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const catalog = read('src/features/services/resources.json');
const coverage = read('docs/sources/services-2026-10-30/coverage.json');
const manifest = read('docs/sources/student-guide/manifest.json');
const faq = read('docs/sources/faq-rozb/snapshot.json').articles;
const articles = new Map(
  fs
    .readdirSync('src/content/articles')
    .filter((file) => file.endsWith('.md'))
    .map((file) => [file.slice(0, -3), matter.read(`src/content/articles/${file}`).data]),
);
const errors = [];
const seen = new Set();
for (const resource of catalog) {
  if (seen.has(resource.id)) errors.push(`Повтор id сервиса: ${resource.id}`);
  seen.add(resource.id);
  const matching = coverage.filter((item) => item.url === (resource.coverageUrl ?? resource.url));
  if (matching.length !== 1) {
    errors.push(`${resource.id}: нужна одна запись аудита`);
    continue;
  }
  const item = matching[0];
  if (!['covered', 'partial', 'unavailable'].includes(item.status))
    errors.push(`${resource.id}: неизвестный статус`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.checkedAt)) errors.push(`${resource.id}: нужна дата сверки`);
  if (
    !item.articles?.length ||
    !item.topics?.length ||
    !item.evidence?.length ||
    !item.limitations?.length
  )
    errors.push(`${resource.id}: неполное описание покрытия`);
  for (const slug of item.articles ?? [])
    if (!articles.has(slug)) errors.push(`${resource.id}: статья ${slug} не существует`);
  for (const evidence of item.evidence ?? [])
    if (!/^https?:\/\//.test(evidence)) errors.push(`${resource.id}: некорректный источник`);
  if (resource.coverageUrl && !item.evidence.includes(resource.url))
    errors.push(`${resource.id}: новый адрес не подтверждён аудитом`);
}
if (
  coverage.length !== catalog.length ||
  new Set(coverage.map((item) => item.url)).size !== coverage.length
)
  errors.push('Каталог и аудит должны содержать одинаковый набор сервисов без дублей');
for (const item of manifest)
  if (!articles.get(item.slug)?.sources.some((source) => source.url === item.sourceUrl))
    errors.push(`${item.slug}: потеряна статья или атрибуция гида`);
const sources = new Set(
  [...articles.values()].flatMap((article) => article.sources.map((source) => source.url)),
);
for (const item of faq)
  if (!sources.has(item.url)) errors.push(`Потеряна атрибуция FAQ: ${item.url}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Покрытие: ${catalog.length} сервисов, все связи со статьями существуют. Сохранены ${manifest.length} вопросов гида и ${faq.length} атрибуций FAQ.`,
);
