import { execFileSync } from 'node:child_process';

const cache = new Map<string, string | undefined>();
const shared = ['src/layouts/Base.astro', 'src/features/seo'];

// Content and template commits are significant changes; a fresh build alone is not.
export function modifiedAt(paths: string[], reviewedAt?: string): string | undefined {
  const files = [...shared, ...paths].sort();
  const key = files.join('\n');
  if (!cache.has(key)) {
    let date: string | undefined;
    try {
      const result = execFileSync(
        'git',
        ['log', '-1', '--format=%cI', '--', ...files.map((file) => `:(literal)${file}`)],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        },
      ).trim();
      if (Number.isFinite(Date.parse(result))) date = result;
    } catch {
      /* Source archives can be built without Git. */
    }
    cache.set(key, date);
  }
  const committed = cache.get(key);
  const reviewed = reviewedAt ? `${reviewedAt}T00:00:00+03:00` : undefined;
  if (!committed) return reviewed;
  return reviewed && Date.parse(reviewed) > Date.parse(committed) ? reviewed : committed;
}
