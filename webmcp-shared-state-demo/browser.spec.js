import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('unsafe mode exposes the late-response payment mismatch', async ({ page }) => {
  await page.getByRole('button', { name: 'Ask agent to pay' }).click();
  await page.getByRole('button', { name: 'Corrected $120' }).click();

  await expect(page.locator('#visible-draft')).toHaveText('$120');
  await expect(page.getByText('42', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The page is wrong by $1,080' })).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('#server-state')).toContainText('$1,200');
  await expect(page.locator('#visible-draft')).toContainText('$120');
});

test('coordinated mode preserves the corrected draft and offers reconciliation', async ({ page }) => {
  await page.getByRole('radio', { name: 'Coordinated: revision + reconciliation' }).check();
  await page.getByRole('button', { name: 'Ask agent to pay' }).click();
  await page.getByRole('button', { name: 'Corrected $120' }).click();

  await expect(page.locator('#conflict-kicker')).toHaveText('Revision conflict detected', { timeout: 5_000 });
  await expect(page.locator('#visible-draft')).toContainText('$120');
  await expect(page.getByRole('button', { name: 'Acknowledge $1,200' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refund $1,200' })).toBeVisible();

  await page.screenshot({
    path: 'assets/coordinated-conflict.png',
    fullPage: true,
  });
});

test('refund is represented as a new operation after payment', async ({ page }) => {
  await page.getByRole('radio', { name: 'Coordinated: revision + reconciliation' }).check();
  await page.getByRole('button', { name: 'Ask agent to pay' }).click();
  await page.getByRole('button', { name: 'Corrected $120' }).click();
  await page.getByRole('button', { name: 'Refund $1,200' }).click({ timeout: 5_000 });

  await expect(page.locator('#server-state')).toContainText('refunded');
  await expect(page.locator('#timeline')).toContainText('A separate refund operation completed.');
});

test('abort after commit enters unknown and reconciles from processor', async ({ page }) => {
  await page.getByRole('radio', { name: 'Abort after commit' }).check();
  await page.getByRole('button', { name: 'Ask agent to pay' }).click();
  await expect(page.locator('#server-state')).toContainText('succeeded', { timeout: 3_000 });
  await page.getByRole('button', { name: 'Stop' }).click();

  await expect(page.locator('#operation-status')).toHaveText('unknown');
  await page.getByRole('button', { name: 'Check payment status' }).click();
  await expect(page.getByText('Payment state reconciled')).toBeVisible();
});

test('mobile layout has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);
});
