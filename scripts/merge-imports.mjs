import fs from 'node:fs';
import matter from 'gray-matter';
const directory = 'src/content/articles';
const redirects = [];
let merged = 0;
for (const file of fs.readdirSync(directory).filter((name) => name.startsWith('rozb-'))) {
  const other = `guide-${file.slice(5)}`;
  if (!fs.existsSync(`${directory}/${other}`)) continue;
  const faq = matter.read(`${directory}/${file}`);
  const guide = matter.read(`${directory}/${other}`);
  if (faq.data.title.trim() !== guide.data.title.trim()) continue;
  const sourceUrls = new Set(guide.data.sources.map((source) => source.url));
  guide.data.sources.push(...faq.data.sources.filter((source) => !sourceUrls.has(source.url)));
  guide.data.tags = [...new Set([...guide.data.tags, ...faq.data.tags])];
  const detail = faq.content
    .replace(/^\s*Материал перенесён[^\n]+\n/, '')
    .replace(/^\s*## Короткий ответ\s*\n/, '')
    .trim();
  const body = `${guide.content.trim()}\n\n## Подробности из студенческого FAQ\n\n${detail}\n`;
  fs.writeFileSync(`${directory}/${other}`, matter.stringify(body, guide.data));
  fs.unlinkSync(`${directory}/${file}`);
  redirects.push(`/articles/${file.slice(0, -3)}/ /articles/${other.slice(0, -3)}/ 301`);
  merged++;
}
if (redirects.length) fs.appendFileSync('public/_redirects', redirects.join('\n') + '\n');
console.log(`Объединены ${merged} совпадающих вопросов. Первичные снимки сохранены.`);
