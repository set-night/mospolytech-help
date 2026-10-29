import { getCollection } from 'astro:content';
import { categories } from '../lib/data';
export async function GET(): Promise<Response> {
  const articles = await getCollection('articles');
  const paths = [
    '/',
    '/articles/',
    '/resources/',
    '/community/',
    '/about/',
    ...categories.map((c) => `/topics/${c.id}/`),
    ...articles.map((a) => `/articles/${a.id}/`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>https://polytech.help${path}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
