import fs from 'node:fs';
import matter from 'gray-matter';
const files = fs.readdirSync('src/content/articles').filter((name) => name.endsWith('.md'));
const errors = [];
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
for (const file of files) {
  const { data, content } = matter.read(`src/content/articles/${file}`);
  if (!/^[a-z0-9-]+\.md$/.test(file)) errors.push(`${file}: используйте slug-latin-kebab-case`);
  if (!content.trim() || content.trim().length < 100)
    errors.push(`${file}: нужен содержательный ответ`);
  if (/<\s*\/?\s*[a-z][^>]*>|\]\(\s*(javascript|data):/i.test(content))
    errors.push(`${file}: HTML и исполняемые ссылки в контенте запрещены`);
  if (!Array.isArray(data.sources) || !data.sources.length)
    errors.push(`${file}: добавьте источник`);
  for (const source of data.sources ?? []) {
    try {
      if (!['https:', 'http:'].includes(new URL(source.url).protocol)) throw Error();
    } catch {
      errors.push(`${file}: некорректный URL источника`);
    }
  }
  const date = typeof data.reviewedAt === 'string' ? data.reviewedAt : '';
  const timestamp = Date.parse(date);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== date
  )
    errors.push(`${file}: нужна действительная дата YYYY-MM-DD строкой`);
  else if (date > today) errors.push(`${file}: дата из будущего по Москве`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Контент: ${files.length} статей; источники и безопасный Markdown в порядке. Полная схема проверяется astro check.`,
);
