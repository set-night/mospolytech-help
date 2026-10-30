import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { buildMetadata } from '../src/features/seo/metadata';

test('SEO: все страницы sitemap доступны и имеют уникальные метаданные без JS', async ({
  page,
  request,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const entries = await page.evaluate(
    (xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('Invalid sitemap XML');
      return [...doc.querySelectorAll('url')].map((item) => ({
        url: item.querySelector('loc')!.textContent!,
        modified: item.querySelector('lastmod')?.textContent,
      }));
    },
    await response.text(),
  );
  const articleCount = fs
    .readdirSync('src/content/articles')
    .filter((file) => file.endsWith('.md')).length;
  expect(entries).toHaveLength(articleCount + 13);
  expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);
  const seenTitles = new Set<string>(),
    seenDescriptions = new Set<string>();
  for (let offset = 0; offset < entries.length; offset += 10) {
    const batch = entries.slice(offset, offset + 10);
    const pages = await Promise.all(
      batch.map(async (entry) => {
        const url = new URL(entry.url);
        expect(url.origin).toBe('https://polytech.help');
        expect(url.search).toBe('');
        expect(Number.isFinite(Date.parse(entry.modified ?? ''))).toBe(true);
        const result = await request.get(url.pathname);
        expect(result.status(), url.pathname).toBe(200);
        return { url: entry.url, html: await result.text() };
      }),
    );
    const metadata = await page.evaluate(
      (pages) =>
        pages.map(({ url, html }) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const data = JSON.parse(
            doc.querySelector('script[type="application/ld+json"]')!.textContent!,
          ) as { '@graph': Record<string, unknown>[] };
          return {
            url,
            title: doc.title,
            description: doc.querySelector('meta[name="description"]')?.getAttribute('content'),
            canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
            robots: doc.querySelector('meta[name="robots"]')?.getAttribute('content'),
            h1: [...doc.querySelectorAll('h1')].map((item) => item.textContent?.trim()),
            og: doc.querySelector('meta[property="og:url"]')?.getAttribute('content'),
            graph: data['@graph'],
          };
        }),
      pages,
    );
    for (const item of metadata) {
      expect(item.canonical).toBe(item.url);
      expect(item.og).toBe(item.url);
      expect(item.robots).toContain('index,follow');
      expect(item.title).toMatch(/Московск.+Политех/);
      expect(item.description!.length).toBeGreaterThan(30);
      expect(item.h1).toHaveLength(1);
      expect(item.h1[0]!.length).toBeGreaterThan(5);
      expect(seenTitles.has(item.title), item.url).toBe(false);
      expect(seenDescriptions.has(item.description!), item.url).toBe(false);
      seenTitles.add(item.title);
      seenDescriptions.add(item.description!);
      expect(item.graph.some((node) => node['@type'] === 'WebSite')).toBe(true);
      if (new URL(item.url).pathname !== '/')
        expect(item.graph.some((node) => node['@type'] === 'BreadcrumbList')).toBe(true);
      if (
        new URL(item.url).pathname.startsWith('/articles/') &&
        new URL(item.url).pathname !== '/articles/'
      ) {
        const article = item.graph.find((node) => node['@type'] === 'Article')!;
        expect(article.headline).toBe(item.h1[0]);
        expect(article.citation).toEqual(
          expect.arrayContaining([expect.stringMatching(/^https?:\/\//)]),
        );
        expect(Number.isFinite(Date.parse(String(article.dateModified)))).toBe(true);
      }
    }
  }
});

test('SEO: 404 закрыт от индексации, query-параметры не меняют canonical', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response!.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await page.goto('/?tag=Wi-Fi');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://polytech.help/',
  );
  await page.goto('/articles/campus-wifi/');
  await expect(page.getByRole('navigation', { name: 'Хлебные крошки' })).toBeVisible();
});

test('JSON-LD не допускает закрыть script через текст статьи', () => {
  const title = '</script><script>alert("test")</script>';
  const result = buildMetadata({
    title,
    description: 'Проверка безопасной сериализации метаданных.',
    pathname: '/articles/test/',
  });
  expect(result.jsonLd).not.toContain('<');
  const parsed = JSON.parse(result.jsonLd) as Record<string, unknown>;
  expect(parsed).toHaveProperty('@graph');
  expect(parsed['@graph']).toEqual(
    expect.arrayContaining([expect.objectContaining({ name: title })]),
  );
});
