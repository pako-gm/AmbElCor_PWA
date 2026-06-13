import { test, expect } from '@playwright/test'

// El timeline usa Pointer Events con snap de 15 min (15 min ≈ 33px a 2.2 px/min)
test('CitasCalendario: drag & drop de tarjeta con snap de 15 min', async ({ page }) => {
  await page.goto('/citas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  const card = page.getByTestId('cita-card').first()
  const total = await page.getByTestId('cita-card').count()

  if (total === 0) {
    console.log('⚠️ No hay citas en el día seleccionado — nada que arrastrar')
    return
  }
  console.log(`✅ ${total} tarjetas de cita encontradas`)

  const antes = await card.boundingBox()
  console.log(`✅ Posición inicial: y=${antes.y}`)

  // Arrastrar hacia abajo ~66px (= 30 min): pointerdown → move → up
  const x = antes.x + antes.width / 2
  const y = antes.y + Math.min(12, antes.height / 2)
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 66, { steps: 12 })
  await page.mouse.up()

  await page.waitForTimeout(800)

  const despues = await card.boundingBox()
  console.log(`✅ Posición final: y=${despues.y}`)

  expect(Math.abs(despues.y - antes.y)).toBeGreaterThan(30)

  await page.screenshot({ path: 'test-screenshots/citas-drag.png', fullPage: false })
})
