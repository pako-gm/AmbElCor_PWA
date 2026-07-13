import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 200 } });
await page.goto('http://localhost:5183/web-publica', { waitUntil: 'networkidle' });
await page.mouse.wheel(0, 200); // trigger scrolled header state
await page.waitForTimeout(400);
await page.screenshot({ path: 'test-screenshots/header.png', fullPage: false });

const link = page.locator('.nav-crm, a[aria-label="Accés CRM"]').first();
console.log('href', await link.getAttribute('href'));
console.log('target', await link.getAttribute('target'));
console.log('aria-label', await link.getAttribute('aria-label'));

await browser.close();
