import catalog from './resources.json';
import coverage from '../../../docs/sources/services-2026-10-30/coverage.json';

export interface Resource {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  label: string;
  official: boolean;
  featured: boolean;
  logo?: string;
  coverageUrl?: string;
}
export const resources: Resource[] = catalog;
export function resourceArticles(resource: Resource): string[] {
  return (
    coverage.find((item) => item.url === (resource.coverageUrl ?? resource.url))?.articles ?? []
  );
}
