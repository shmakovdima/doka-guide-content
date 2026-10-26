import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: 'assets/raw',
    size: { width: 1280, height: 720 },
  },
});

const page = await context.newPage();
await page.goto('http://127.0.0.1:4173/');
await page.waitForTimeout(800);

await page.getByRole('button', { name: 'Ask agent to pay' }).click();
await page.waitForTimeout(450);
await page.getByRole('button', { name: 'Corrected $120' }).click();
await page.getByRole('heading', { name: 'The page is wrong by $1,080' }).waitFor();
await page.waitForTimeout(1100);

await page.getByRole('button', { name: 'Reset demo' }).click();
await page.getByRole('radio', { name: 'Coordinated: revision + reconciliation' }).check();
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Ask agent to pay' }).click();
await page.waitForTimeout(450);
await page.getByRole('button', { name: 'Corrected $120' }).click();
await page.locator('#conflict-kicker').getByText('Revision conflict detected').waitFor();
await page.waitForTimeout(1800);

const video = page.video();
await context.close();
await video.saveAs('assets/webmcp-shared-state-demo.webm');
await browser.close();
