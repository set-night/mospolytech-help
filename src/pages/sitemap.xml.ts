import { getCollection } from 'astro:content';
import { categories } from '../lib/data';
import { modifiedAt } from '../features/seo/modified';
import { siteUrl } from '../features/seo/metadata';
const escapeXml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export async function GET(): Promise<Response> {
  const articles = await getCollection('articles');
  const collectionModified = modifiedAt([
    'src/pages',
    'src/features/browse',
    'src/lib/data.ts',
    'src/content/articles',
  ]);
  const entries = [
    { path: '/', date: collectionModified },
    { path: '/articles/', date: collectionModified },
    { path: '/resources/', date: modifiedAt(['src/pages/resources.astro', 'src/lib/data.ts']) },
    { path: '/community/', date: modifiedAt(['src/pages/community.astro', 'src/lib/data.ts']) },
    { path: '/about/', date: modifiedAt(['src/pages/about.astro']) },
    ...categories.map((category) => ({
      path: `/topics/${category.id}/`,
      date: collectionModified,
    })),
    ...articles.map((article) => ({
      path: `/articles/${article.id}/`,
      date: modifiedAt(
        ['src/pages/articles/[...id].astro', `src/content/articles/${article.id}.md`],
        article.data.reviewedAt,
      ),
    })),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(({ path, date }) => `<url><loc>${escapeXml(new URL(path, siteUrl).href)}</loc>${date ? `<lastmod>${escapeXml(date)}</lastmod>` : ''}</url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
