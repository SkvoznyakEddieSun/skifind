import { test, expect, Page } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Pause so the video captures smooth transitions */
const wait = (page: Page, ms = 600) => page.waitForTimeout(ms);

/** Save a named screenshot */
const shot = (page: Page, path: string) =>
  page.screenshot({ path: `e2e/screenshots/${path}`, fullPage: false });

// ── Instructor flow ────────────────────────────────────────────────────────

test.describe('Instructor flow', () => {
  test('full instructor walkthrough', async ({ page }) => {
    // ── 1. Auth screen ──────────────────────────────────────────────────────
    await page.goto('/');
    await expect(page.getByText('Здравствуйте')).toBeVisible();
    await expect(page.getByText('Я ученик')).toBeVisible();
    await expect(page.getByText('Я инструктор')).toBeVisible();
    await shot(page, '001-auth.png');

    // ── 2. Select instructor role ───────────────────────────────────────────
    await page.getByText('Я инструктор').click();
    await wait(page);

    // ── 3. Dashboard ────────────────────────────────────────────────────────
    await expect(page.getByText('Алексей')).toBeVisible();
    // Bottom nav present with all 5 tabs
    await expect(page.getByText('Главная')).toBeVisible();
    await expect(page.getByText('Заявки')).toBeVisible();
    await expect(page.getByText('Чат')).toBeVisible();
    await expect(page.getByText('Расписание')).toBeVisible();
    await expect(page.getByText('Профиль')).toBeVisible();
    await shot(page, '002-instr-dashboard.png');

    // ── 4. Navigate to Расписание (Schedule) ───────────────────────────────
    await page.getByText('Расписание').click();
    await wait(page);
    await shot(page, '003-instr-schedule.png');

    // ── 5. Navigate to Заявки (Requests) ───────────────────────────────────
    await page.getByText('Заявки').click();
    await wait(page);
    await shot(page, '004-instr-requests.png');

    // ── 6. Navigate to Чат ─────────────────────────────────────────────────
    await page.getByText('Чат').click();
    await wait(page);
    await shot(page, '005-instr-chat-list.png');

    // ── 7. Navigate to Профиль ─────────────────────────────────────────────
    await page.getByText('Профиль').click();
    await wait(page);
    await shot(page, '006-instr-profile.png');

    // ── 8. Back to Dashboard, open notifications ────────────────────────────
    await page.getByText('Главная').click();
    await wait(page);
    // Bell button has aria-label "Уведомления"
    await page.getByRole('button', { name: 'Уведомления' }).click();
    await wait(page);
    await expect(page.getByText('Сегодня')).toBeVisible();
    await shot(page, '007-instr-notifications.png');

    // Navigate back via back button (‹)
    await page.locator('button', { hasText: '‹' }).first().click();
    await wait(page);
  });
});

// ── Guest flow ─────────────────────────────────────────────────────────────

test.describe('Guest flow', () => {
  test('full guest walkthrough', async ({ page }) => {
    // ── 1. Auth screen ──────────────────────────────────────────────────────
    await page.goto('/');
    await expect(page.getByText('Здравствуйте')).toBeVisible();
    await shot(page, '100-auth.png');

    // ── 2. Select guest (Горнолыжник / Ученик) role ─────────────────────────
    await page.getByText('Я ученик').click();
    await wait(page);

    // ── 3. Catalog screen ───────────────────────────────────────────────────
    // Header shows "Инструкторы" and "в Шерегеше"
    await expect(page.getByText('Инструкторы')).toBeVisible();
    // Bottom nav: Найти, Занятия, Чат, Профиль
    await expect(page.getByText('Найти')).toBeVisible();
    await expect(page.getByText('Занятия')).toBeVisible();
    await shot(page, '101-guest-catalog.png');

    // ── 4. Filter by level (Новички) ────────────────────────────────────────
    await page.getByText('Новички').first().click();
    await wait(page, 400);
    await shot(page, '102-guest-catalog-filtered-beginners.png');

    // Reset filter
    await page.getByText('Все уровни').first().click();
    await wait(page, 300);

    // ── 5. Tap on first instructor card ─────────────────────────────────────
    // Instructor cards show "Алексей Морозов" — tap on it
    await page.getByText('Алексей Морозов').first().click();
    await wait(page);
    // Instructor profile screen: expect name + rating
    await expect(page.getByText('Алексей Морозов').first()).toBeVisible();
    await shot(page, '103-guest-instr-profile.png');

    // Back to catalog
    await page.locator('button', { hasText: '‹' }).first().click();
    await wait(page);

    // ── 6. Navigate to Мастер-классы ────────────────────────────────────────
    // The catalog has a "Мастер-классы" button
    await page.getByText('Мастер-классы').first().click();
    await wait(page);
    await expect(page.getByText('Мастер-классы').first()).toBeVisible();
    await shot(page, '104-guest-mc-catalog.png');

    // ── 7. Open first masterclass detail ────────────────────────────────────
    // Cards are clickable divs — click the first one that isn't the header
    const mcCards = page.locator('text=Подробнее');
    const mcCardCount = await mcCards.count();
    if (mcCardCount > 0) {
      await mcCards.first().click();
    } else {
      // Fallback: click the first card in the list
      await page.locator('[class*="card"]').first().click();
    }
    await wait(page);
    await shot(page, '105-guest-mc-detail.png');

    // Back to mc-catalog
    await page.locator('button', { hasText: '‹' }).first().click();
    await wait(page);

    // Back to catalog
    await page.locator('button', { hasText: '‹' }).first().click();
    await wait(page);

    // ── 8. Navigate to Мои занятия (Bookings) via bottom nav ────────────────
    await page.getByText('Занятия').click();
    await wait(page);
    await shot(page, '106-guest-bookings.png');

    // ── 9. Navigate to Чат via bottom nav ────────────────────────────────────
    await page.getByText('Чат').last().click();
    await wait(page);
    await shot(page, '107-guest-chat-list.png');

    // ── 10. Navigate to Профиль via bottom nav ───────────────────────────────
    await page.getByText('Профиль').click();
    await wait(page);
    await shot(page, '108-guest-profile.png');
  });
});

// ── Shared assertions ──────────────────────────────────────────────────────

test.describe('No console errors', () => {
  test('instructor dashboard has no critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.getByText('Я инструктор').click();
    await wait(page, 800);
    // Filter out PWA/SW noise which is expected in preview mode
    const criticalErrors = errors.filter(
      e => !e.includes('service-worker') && !e.includes('workbox') && !e.includes('SW')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('guest catalog has no critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.getByText('Я ученик').click();
    await wait(page, 800);
    const criticalErrors = errors.filter(
      e => !e.includes('service-worker') && !e.includes('workbox') && !e.includes('SW')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
