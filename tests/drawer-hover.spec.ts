import { test, expect } from '@playwright/test'

test('drawer se abre con hover y se oculta tras 3 s', async ({ page }) => {
  await page.goto('/encargos')
  const drawer = page.locator('aside')
  const menuBtn = page.getByLabel('Abrir menú')

  // Cerrado inicialmente (translate-x-full)
  await expect(drawer).toHaveClass(/-translate-x-full/)

  // Hover sobre la hamburguesa → se abre
  await menuBtn.hover()
  await expect(drawer).toHaveClass(/translate-x-0/)

  // Cursor dentro del drawer → sigue abierto pasados 3 s
  await drawer.hover()
  await page.waitForTimeout(3300)
  await expect(drawer).toHaveClass(/translate-x-0/)

  // Cursor fuera → sigue abierto a los 2 s, oculto a los 3,5 s
  await page.mouse.move(900, 500)
  await page.waitForTimeout(2000)
  await expect(drawer).toHaveClass(/translate-x-0/)
  await page.waitForTimeout(1500)
  await expect(drawer).toHaveClass(/-translate-x-full/)

  // Reapertura por hover y cierre inmediato con la X
  await menuBtn.hover()
  await expect(drawer).toHaveClass(/translate-x-0/)
  await page.getByLabel('Cerrar menú').click()
  await expect(drawer).toHaveClass(/-translate-x-full/)
})
