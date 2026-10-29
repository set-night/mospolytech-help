import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('главная: сервисы, разделы, участие и отсутствие ошибок', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('по-человечески');
  await expect(page.getByRole('link', { name: /Какая сейчас пара/ })).toHaveAttribute(
    'href',
    'https://mosrasp.ru',
  );
  await expect(page.getByRole('link', { name: /А где эта аудитория/ })).toHaveAttribute(
    'href',
    'https://mpunav.ru',
  );
  await expect(page.locator('.topic')).toHaveCount(8);
  await expect(page.getByRole('link', { name: 'Как помочь проекту ↗' })).toHaveAttribute(
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
  const input = page.getByRole('searchbox');
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
  await page.goto('/');
  await page.locator('.hero-search').click();
  await page.getByRole('searchbox').fill('фывапролджэщзхънесуществующий');
  await expect(page.locator('#search-status')).toContainText('Ничего не нашлось');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.hero-search')).toBeFocused();
  await page.keyboard.press('/');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('поиск: ?q= и недоступный индекс', async ({ page }) => {
  await page.goto('/?q=расписание');
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

test('мобильное меню открывается и ведёт к чатам', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Меню используется на узких экранах');
  await page.goto('/');
  const button = page.locator('#menu-toggle');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#mobile-nav').getByRole('link', { name: 'Чаты и медиа ↗' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('На связи');
  await expect(page.getByRole('link', { name: /Студенческий чат/ })).toHaveAttribute(
    'href',
    'https://t.me/+FnrRLqRwubY0MDFi',
  );
});

for (const width of [320, 375, 390, 768, 1024, 1920]) {
  test(`адаптация ${width}px: нет горизонтальной прокрутки`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
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
