import { test } from '@playwright/test'

test('Captura screenshot de /citas', async ({ page }) => {
  await page.goto('/citas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-screenshots/citas.png', fullPage: true })
})

test('Captura screenshot de /encargos', async ({ page }) => {
  await page.goto('/encargos', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-screenshots/encargos.png', fullPage: true })
})

test('Captura screenshot de /clientes', async ({ page }) => {
  await page.goto('/clientes', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-screenshots/clientes.png', fullPage: true })
})

test('Captura screenshot de / (dashboard)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-screenshots/dashboard.png', fullPage: true })
})

test('Captura screenshot de /inventario', async ({ page }) => {
  await page.goto('/inventario', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'test-screenshots/inventario.png', fullPage: true })
})

test('Captura screenshot de /inventario/proveedores', async ({ page }) => {
  await page.goto('/inventario/proveedores', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-screenshots/inventario-proveedores.png', fullPage: true })
})

test('Captura screenshot de /inventario/nuevo', async ({ page }) => {
  await page.goto('/inventario/nuevo', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-screenshots/inventario-nuevo.png', fullPage: true })
})
