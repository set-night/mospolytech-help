import { test, expect } from '@playwright/test';

test('стрелки поиска начинают с первого или последнего результата и идут по кругу', async ({
  page,
}) => {
  await page.goto('/resources/');
  await page.keyboard.press('Control+k');
  const input = page.getByRole('dialog').getByRole('searchbox');
  const links = page.locator('.search-result');
  await input.fill('стипендия');
  await expect(links.last()).toBeVisible();
  expect(await links.count()).toBeGreaterThan(2);
  await input.press('ArrowUp');
  await expect(links.last()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(links.first()).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(links.last()).toBeFocused();
  await input.focus();
  await input.press('ArrowDown');
  await expect(links.first()).toBeFocused();
});

test('главная: быстрый ввод и стрелка вниз дожидаются нового ответа', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Keep the first real index request in flight to exercise loading as well as debounce.
  await page.route('**/pagefind/pagefind.js', async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({ response });
  });
  await page.goto('/');
  const input = page.locator('#browse-query');
  const pending = await input.evaluate((element) => {
    const field = element as HTMLInputElement;
    field.focus();
    field.value = 'Wi-Fi';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    return {
      focused: document.activeElement === field,
      inert: document.querySelector<HTMLElement>('#answer-grid')?.inert,
    };
  });
  expect(pending).toEqual({ focused: true, inert: true });
  const result = page.locator('.answer-card:not([hidden]) .answer-main').first();
  await expect(result).toContainText(/Wi-Fi/i);
  await expect(result).toBeFocused();
  await expect(page.locator('#answer-grid')).not.toHaveAttribute('aria-busy');
  const destination = new URL((await result.getAttribute('href'))!, page.url()).href;
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(destination);
});

test('Escape во время задержки поиска сразу восстанавливает список', async ({ page }) => {
  await page.goto('/articles/');
  await page.locator('#browse-query').evaluate((element) => {
    const field = element as HTMLInputElement;
    field.focus();
    field.value = 'стипендия';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await expect(page.locator('#browse-query')).toHaveValue('');
  await expect(page.locator('.answer-card:not([hidden])')).toHaveCount(8);
  await expect(page.locator('#answer-grid')).not.toHaveAttribute('aria-busy');
  await expect(page.locator('#browse-count')).not.toContainText('Ищем');
  await expect(page).not.toHaveURL(/\?q=/);
});

test('поиск закрывает меню и возвращает фокус на доступную кнопку', async ({ page }) => {
  await page.goto('/resources/');
  const toggle = page.locator('#menu-toggle');
  await toggle.click();
  await page.locator('#mobile-nav a').first().focus();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#mobile-nav')).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.header-search')).toBeFocused();
});

test('телефон: основные кнопки, категории и теги имеют цели нажатия 44 px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.locator('.stage-more').click();
    await expect(page.locator('html')).toHaveClass(/search-docked/);
    const tooSmall = await page
      .locator(
        '.header-actions .icon-button, .hub-search button, .category-nav a, .tag-chip, .answer-card:not([hidden]) .answer-tags a, .footer-bottom nav a',
      )
      .evaluateAll((elements) =>
        elements.flatMap((element) => {
          if (!element.getClientRects().length) return [];
          const rect = element.getBoundingClientRect();
          return rect.width < 43.5 || rect.height < 43.5
            ? [
                {
                  text: element.getAttribute('aria-label') ?? element.textContent?.trim(),
                  width: rect.width,
                  height: rect.height,
                },
              ]
            : [];
        }),
      );
    expect(tooSmall, `${width}px`).toEqual([]);
  }
});
