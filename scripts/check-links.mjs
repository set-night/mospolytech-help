import fs from 'node:fs';
import path from 'node:path';
const walk = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
const files = walk('dist').filter((file) => file.endsWith('.html'));
const errors = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const url = new URL(href, `https://polytech.help/${file.slice(5).replace(/index\.html$/, '')}`);
    const target = path.join('dist', decodeURIComponent(url.pathname));
    const targetFile =
      fs.existsSync(target) && fs.statSync(target).isDirectory()
        ? path.join(target, 'index.html')
        : target;
    if (!fs.existsSync(targetFile)) {
      errors.push(`${file}: ${href}`);
      continue;
    }
    if (url.hash && targetFile.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      const html = fs.readFileSync(targetFile, 'utf8');
      if (!html.includes(`id="${id}"`)) errors.push(`${file}: якорь ${href}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Внутренние ссылки и якоря: ${files.length} страниц, ошибок нет.`);
