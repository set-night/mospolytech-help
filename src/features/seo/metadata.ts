export const siteUrl = 'https://polytech.help';
export const siteName = 'polytech.help';
export interface Breadcrumb {
  title: string;
  path: string;
}
export interface ArticleMetadata {
  section: string;
  tags: readonly string[];
  sources: readonly { url: string }[];
  modifiedAt: string;
}
export interface PageMetadata {
  title: string;
  description: string;
  pathname: string;
  kind?: 'WebPage' | 'CollectionPage' | 'AboutPage';
  breadcrumbs?: Breadcrumb[];
  article?: ArticleMetadata;
}

export function buildMetadata(page: PageMetadata) {
  const canonical = new URL(page.pathname, siteUrl);
  canonical.search = '';
  canonical.hash = '';
  const url = canonical.href;
  const contextualTitle = /московск.{0,10}политех/i.test(page.title)
    ? page.title
    : `${page.title} — Московский Политех`;
  const title = `${contextualTitle} | ${siteName}`;
  const breadcrumbs = page.breadcrumbs ?? [
    { title: 'Главная', path: '/' },
    { title: page.title, path: page.pathname },
  ];
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: siteName,
      alternateName: 'Справочник студентов Московского Политеха',
      inLanguage: 'ru-RU',
      publisher: { '@id': `${siteUrl}/#community` },
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#community`,
      name: 'Сообщество polytech.help',
      url: `${siteUrl}/about/`,
      description: 'Независимый студенческий проект. Не является официальным сайтом университета.',
      sameAs: ['https://github.com/set-night/mospolytech-help'],
    },
    {
      '@type': page.kind ?? 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': `${siteUrl}/#website` },
      ...(page.pathname !== '/' && { breadcrumb: { '@id': `${url}#breadcrumbs` } }),
      ...(page.article && { mainEntity: { '@id': `${url}#article` } }),
    },
  ];
  if (page.pathname !== '/')
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumbs`,
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        item: new URL(item.path, siteUrl).href,
      })),
    });
  if (page.article)
    graph.push({
      '@type': 'Article',
      '@id': `${url}#article`,
      url,
      headline: page.title,
      description: page.description,
      inLanguage: 'ru-RU',
      articleSection: page.article.section,
      keywords: page.article.tags.join(', '),
      dateModified: page.article.modifiedAt,
      mainEntityOfPage: { '@id': `${url}#webpage` },
      author: { '@id': `${siteUrl}/#community` },
      publisher: { '@id': `${siteUrl}/#community` },
      citation: page.article.sources.map((source) => source.url),
    });
  return {
    title,
    canonical: url,
    jsonLd: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll(
      '<',
      '\\u003c',
    ),
  };
}
