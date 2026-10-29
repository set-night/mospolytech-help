import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://polytech.help',
  output: 'static',
  trailingSlash: 'always',
  markdown: { syntaxHighlight: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
