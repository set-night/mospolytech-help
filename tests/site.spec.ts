import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('главная: сервисы, разделы, участие и отсутствие ошибок', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#browse-query')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('link', { name: /МосРасписание/ })).toHaveAttribute(
    'href',
    'https://mosrasp.ru',
  );
  await expect(page.getByRole('link', { name: /МПУ Навигатор/ })).toHaveAttribute(
    'href',
    'https://mpunav.ru',
  );
  await expect(page.locator('.topic')).toHaveCount(8);
  await expect(page.locator('.sidebar-helpers a').last()).toHaveAttribute(
    'href',
    /CONTRIBUTING.md$/,
  );
  expect(errors).toEqual([]);
});

test('поиск: шорткаты, синонимы, русская раскладка, фильтр и клавиатура', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const input = page.getByRole('dialog').getByRole('searchbox');
  await input.fill('общага');
  await expect(page.locator('.search-result').first()).toBeVisible();
  await expect(page.locator('#search-status')).toContainText('Найдено');
  await input.fill('стипуха');
  await expect(page.locator('.search-result').first()).toContainText(/стипенд/i);
  await page.getByLabel('Раздел', { exact: true }).selectOption('money');
  await expect(page.locator('.search-result').first()).toBeVisible();
  await page.getByLabel('Раздел', { exact: true }).selectOption('');
  await input.fill('j,ofuf');
  await expect(page.locator('.search-result').first()).toBeVisible();
  await input.fill('стипендия');
  await expect(page.locator('.search-result').first()).toContainText(/стипенд/i);
  await input.press('ArrowDown');
  await expect(page.locator('.search-result').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/articles\//);
  await expect(page.locator('.sources a').first()).toBeVisible();
});

test('поиск: пустые результаты, закрытие и возврат фокуса', async ({ page }) => {
  await page.goto('/resources/');
  await page.locator('.header-search').click();
  await page.getByRole('dialog').getByRole('searchbox').fill('фывапролджэщзхънесуществующий');
  await expect(page.locator('#search-status')).toContainText('Ничего не нашлось');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.header-search')).toBeFocused();
  await page.keyboard.press('/');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('поиск: ?q= и недоступный индекс', async ({ page }) => {
  await page.goto('/resources/?q=расписание');
  await expect(page.locator('.search-result').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.route('**/pagefind/pagefind.js', (route) => route.abort());
  await page.reload();
  await expect(page.locator('#search-status')).toContainText('Не удалось загрузить поиск');
  await expect(page.getByRole('link', { name: 'Все материалы →' })).toBeVisible();
});

test('статьи: источники, отметки и редактура', async ({ page }) => {
  await page.goto('/articles/scholarships/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/стипенд/i);
  await expect(page.locator('.status-verified')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Исправить на GitHub ↗' })).toHaveAttribute(
    'href',
    /edit\/main\/src\/content\/articles\/scholarships.md/,
  );
  await expect(page.locator('.sources a').first()).toHaveAttribute('href', /^https:\/\//);
  await page.goto('/articles/guide-dorm-4-rooms/');
  await expect(page.locator('.review-notice')).toContainText('ещё нужно проверить');
  await expect(page.locator('.sources a')).toHaveCount(3);
});

test('меню открывается и ведёт к чатам на любом экране', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('#menu-toggle');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await page
    .locator('#mobile-nav')
    .getByRole('link', { name: 'Чаты и медиа', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Чаты и медиа');
  await expect(page.getByRole('link', { name: /Студенческий чат/ })).toHaveAttribute(
    'href',
    'https://t.me/+FnrRLqRwubY0MDFi',
  );
});

for (const width of [320, 375, 390, 768, 844, 1024, 1920]) {
  test(`адаптация ${width}px: нет горизонтальной прокрутки`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of [
      '/',
      '/articles/',
      '/articles/guide-dorm-4-rooms/',
      '/community/',
      '/resources/',
    ]) {
      await page.goto(path);
      const size = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(size.content, path).toBeLessThanOrEqual(size.viewport);
      if (path === '/') {
        await page.locator('.stage-more').click();
        await expect(page.locator('html')).toHaveClass(/search-docked/);
        await page.locator('#browse-query').click({ trial: true });
        await page.locator('.brand').click({ trial: true });
        await page.locator('#theme-toggle').click({ trial: true });
      }
    }
  });
}

test('доступность основных страниц и диалога поиска', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/', '/articles/scholarships/', '/community/', '/resources/']) {
    await page.goto(path);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations, path).toEqual([]);
  }
  await page.getByRole('button', { name: 'Открыть поиск' }).click();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('контент доступен без JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(new URL('/articles/schedule/', baseURL).href);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.sources a').first()).toBeVisible();
  await context.close();
});

test('reduced motion отключает анимации и сохраняет контент', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const animations = await page.evaluate(
    () => document.getAnimations().filter((animation) => animation.playState === 'running').length,
  );
  expect(animations).toBe(0);
  await page.locator('.contribute').scrollIntoViewIfNeeded();
  await expect(page.locator('.contribute')).toHaveCSS('opacity', '1');
});

test('тема: тёмная по умолчанию, выбор сохраняется между страницами', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Включить светлую тему' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/articles/scholarships/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Включить тёмную тему' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('навигация: категории, теги, URL, сброс и ещё материалы', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.answer-card:visible');
  await expect(cards).toHaveCount(8);
  await page.locator('#browse-more').click();
  await expect(cards).toHaveCount(20);
  await page.locator('[data-category="money"]').click();
  await expect(page).toHaveURL(/category=money/);
  await expect(page.locator('#feed-title')).toHaveText('Деньги');
  expect(
    await cards.evaluateAll((elements) =>
      elements.every((element) => (element as HTMLElement).dataset.categoryId === 'money'),
    ),
  ).toBe(true);
  await page.locator('.tag-bar [data-tag="стипендия"]').click();
  await expect(cards.first()).toContainText('Какие стипендии');
  expect(
    await cards.evaluateAll((elements) =>
      elements.every((element) =>
        JSON.parse((element as HTMLElement).dataset.tags ?? '[]').includes('стипендия'),
      ),
    ),
  ).toBe(true);
  const matchingCount = await cards.count();
  expect(matchingCount).toBeGreaterThan(0);
  await page.reload();
  await expect(cards).toHaveCount(matchingCount);
  await page.locator('#browse-reset').click();
  await expect(cards).toHaveCount(8);
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(cards).toHaveCount(matchingCount);
});

test('главная: полнотекстовый поиск без модалки и переход из тега статьи', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Найти в справочнике' }).fill('общага');
  await expect(page.locator('#feed-title')).toHaveText('Результаты поиска');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.answer-card:visible').first()).toContainText(/общежит/i);
  await page.locator('.answer-card:visible .answer-main').first().click();
  await page.locator('.article-tags a').first().click();
  await expect(page).toHaveURL(/\?tag=/);
  await expect(page.locator('.answer-card:visible').first()).toBeVisible();
});

test('светлая тема: контраст и доступность', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Включить светлую тему' }).click();
  for (const url of ['/', '/articles/scholarships/', '/resources/', '/community/']) {
    await page.goto(url);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
      url,
    ).toEqual([]);
  }
});

test('тема и материалы работают при заблокированном localStorage', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get: () => {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('#browse-query')).toBeVisible();
  await page.getByRole('button', { name: 'Включить светлую тему' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('страница категории сохраняет раздел, поиск и явный сброс после перезагрузки', async ({
  page,
}) => {
  await page.goto('/topics/money/');
  const cards = page.locator('.answer-card:visible');
  await expect(page.locator('#feed-title')).toHaveText('Деньги');
  expect(
    await cards.evaluateAll((elements) =>
      elements.every((element) => (element as HTMLElement).dataset.categoryId === 'money'),
    ),
  ).toBe(true);
  await page.getByRole('searchbox', { name: 'Найти в справочнике' }).fill('стипендия');
  await expect(page.locator('#feed-title')).toHaveText('Результаты поиска');
  await page.locator('#browse-reset').click();
  await expect(page.locator('#feed-title')).toHaveText('Нужно сейчас');
  await page.reload();
  await expect(page.locator('#feed-title')).toHaveText('Нужно сейчас');
});

test('главная: недоступный индекс оставляет рабочий поиск по названиям', async ({ page }) => {
  await page.route('**/pagefind/pagefind.js', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Найти в справочнике' }).fill('стипенд');
  await expect(page.locator('#browse-notice')).toContainText('поиск недоступен');
  await expect(page.locator('.answer-card:visible').first()).toContainText(/стипенд/i);
});

test('быстрое двойное переключение темы не теряет выбор', async ({ page }) => {
  await page.goto('/');
  await page.locator('#theme-toggle').click({ clickCount: 2, delay: 30 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('поисковая сцена: простор, доступные ссылки и закрепление поля', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const input = page.locator('#browse-query');
  const before = await input.boundingBox();
  const viewport = page.viewportSize()!;
  expect(before!.y).toBeGreaterThan(viewport.height * 0.35);
  expect(before!.y).toBeLessThan(viewport.height * 0.6);
  const intro = await page.locator('.guide-intro').boundingBox();
  expect(intro!.y).toBeGreaterThanOrEqual(viewport.height);
  for (const link of await page.locator('.float-link').all()) {
    const rect = await link.boundingBox();
    expect(rect!.y).toBeGreaterThan(68);
    expect(rect!.y + rect!.height).toBeLessThan(viewport.height);
    expect(rect!.y + rect!.height <= before!.y || rect!.y >= before!.y + before!.height).toBe(true);
    await link.click({ trial: true });
  }
  await page.locator('.stage-more').click();
  await expect(page.locator('html')).toHaveClass(/search-docked/);
  const docked = await input.boundingBox();
  expect(docked!.y).toBeLessThan(145);
  expect(docked!.y).toBeGreaterThan(0);
  // Bounding boxes alone miss fields painted behind the fixed header.
  expect(
    await input.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === element
      );
    }),
  ).toBe(true);
  await input.click();
  await expect(input).toBeFocused();
  await input.fill('вайфай');
  await expect(page.locator('.answer-card:visible').first()).toContainText(/Wi-Fi/i);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(page.locator('html')).not.toHaveClass(/search-docked/);
  await page.locator('.float-link').first().click({ trial: true });
});

test('ссылка на тег сразу открывает материалы под поисковой сценой', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?tag=Wi-Fi');
  await expect(page.locator('html')).toHaveClass(/search-docked/);
  await expect(page.locator('#feed-title')).toHaveText('#wi-fi');
  const first = page.locator('.answer-card:visible').first();
  await expect(first).toContainText(/Wi-Fi/i);
  const rect = await first.boundingBox();
  expect(rect!.y).toBeLessThan(page.viewportSize()!.height);
  await first.locator('.answer-main').click();
  await expect(page).toHaveURL(/\/articles\//);
});

test('бренд: текст в шапке, прозрачный вопрос и доступная анимация favicon', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveText('polytech.help');
  await expect(page.locator('.brand svg, .brand img')).toHaveCount(0);
  const icon = page.locator('link[rel="icon"]');
  const fallback = await icon.getAttribute('href');
  expect(fallback).toMatch(/^\/favicon.svg\?v=/);
  const alpha = await page.evaluate(async (url) => {
    const image = new Image();
    image.src = url!;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0, 96, 96);
    const pixels = context.getImageData(0, 0, 96, 96).data;
    let body = 0;
    for (let index = 3; index < 96 * 70 * 4; index += 4) body = Math.max(body, pixels[index]);
    return { corner: pixels[3], body };
  }, fallback);
  expect(alpha.corner).toBe(0);
  expect(alpha.body).toBeGreaterThan(100);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(icon).toHaveAttribute('href', /^data:image\/svg\+xml,/);
  const first = await icon.getAttribute('href');
  await expect.poll(() => icon.getAttribute('href')).not.toBe(first);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(icon).toHaveAttribute('href', fallback!);
});

test('единая шапка и меню из кнопок на основных страницах', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let expected: { x: number; y: number; width: number; height: number } | null = null;
  for (const path of ['/', '/articles/', '/articles/schedule/', '/resources/', '/community/']) {
    await page.goto(path);
    const actions = page.locator('.header-actions');
    await expect(actions.locator('.icon-button')).toHaveCount(4);
    const rect = await actions.boundingBox();
    if (!expected) expected = rect;
    expect(rect, path).toEqual(expected);
    const toggle = page.locator('#menu-toggle');
    await toggle.click();
    const menu = page.locator('#mobile-nav');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveCSS('display', 'grid');
    await expect(menu.locator('a')).toHaveCount(5);
    await expect(menu.locator('a').first()).toHaveCSS('border-top-style', 'solid');
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.locator('#main').click({ position: { x: 5, y: 200 } });
    await expect(menu).not.toBeVisible();
  }
});
