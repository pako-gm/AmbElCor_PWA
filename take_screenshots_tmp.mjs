import { chromium } from './node_modules/playwright/index.mjs';

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', e => errors.push(e.message));

const BASE = 'http://localhost:5176';

await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle', timeout: 20000 });
await page.screenshot({ path: 'C:/Users/Usuario/AppData/Local/Temp/screenshots_inv/inventario.png', fullPage: true });
console.log('done /inventario');

await page.goto(`${BASE}/inventario/nuevo`, { waitUntil: 'networkidle', timeout: 15000 });
await page.screenshot({ path: 'C:/Users/Usuario/AppData/Local/Temp/screenshots_inv/inventario_nuevo.png', fullPage: true });
console.log('done /inventario/nuevo');

await page.goto(`${BASE}/encargos`, { waitUntil: 'networkidle', timeout: 15000 });
await page.screenshot({ path: 'C:/Users/Usuario/AppData/Local/Temp/screenshots_inv/encargos.png', fullPage: true });
console.log('done /encargos');

if (errors.length) {
  console.log('ERRORS:');
  errors.slice(0,5).forEach(e => console.log(' -', e.substring(0,200)));
} else {
  console.log('NO_ERRORS');
}

await browser.close();
