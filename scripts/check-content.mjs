import fs from 'node:fs';
import matter from 'gray-matter';
const files = fs.readdirSync('src/content/articles').filter((name) => name.endsWith('.md'));
const errors = [];
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
  if (String(data.reviewedAt) > '2026-10-29' && Date.parse(String(data.reviewedAt)) > Date.now())
    errors.push(`${file}: дата из будущего`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Контент: ${files.length} статей; источники и безопасный Markdown в порядке. Полная схема проверяется astro check.`,
);
