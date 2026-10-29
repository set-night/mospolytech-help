import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(10).max(240),
    category: z.enum([
      'start',
      'study',
      'campus',
      'money',
      'documents',
      'admission',
      'community',
      'career',
    ]),
    tags: z.array(z.string()).min(1),
    sources: z.array(z.object({ title: z.string(), url: z.url() })).min(1),
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['verified', 'community', 'needs-review']),
  }),
});
export const collections = { articles };
