import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/encargos', { waitUntil: 'networkidle' });

    // Esperar a que se cargue el botón
    await page.waitForSelector('button', { timeout: 5000 });

    // Buscar el botón de ocultar entregados
    const buttons = await page.locator('button').all();
    console.log(`Total buttons found: ${buttons.length}`);

    // Tomar screenshot
    await page.screenshot({ path: 'encargos-page.png' });
    console.log('Screenshot saved: encargos-page.png');

    // Buscar el botón específico con Eye/EyeOff icon
    const hideDeliveredBtn = await page.locator('button[title*="entregado"]').first();
    if (await hideDeliveredBtn.isVisible()) {
      console.log('✓ "Ocultar Entregados" button found and visible');

      // Click the button
      await hideDeliveredBtn.click();
      await page.waitForTimeout(500);

      console.log('✓ Button click successful');

      // Take another screenshot after click
      await page.screenshot({ path: 'encargos-page-after-click.png' });
      console.log('Screenshot after click: encargos-page-after-click.png');
    } else {
      console.log('✗ Button not found or not visible');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
