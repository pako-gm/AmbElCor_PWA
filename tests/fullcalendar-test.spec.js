import { test, expect } from '@playwright/test'

test('CitasCalendario with FullCalendar loads and displays', async ({ page }) => {
  // Go to citas page
  await page.goto('http://localhost:5173/citas', { waitUntil: 'networkidle' })

  // Wait for FullCalendar to render
  await page.waitForSelector('.fc-calendar-container, .fc-view-harness', { timeout: 10000 })

  console.log('✅ FullCalendar loaded successfully')

  // Check if title exists
  const title = await page.locator('text=Calendario de Citas')
  await expect(title).toBeVisible()

  console.log('✅ Title is visible')

  // Check if "Nueva cita" button exists
  const newButton = await page.locator('button:has-text("Nueva cita")')
  await expect(newButton).toBeVisible()

  console.log('✅ New cita button is visible')

  // Check if calendar header exists (with navigation buttons)
  const prevButton = await page.locator('.fc-prev-button')
  const nextButton = await page.locator('.fc-next-button')
  const todayButton = await page.locator('.fc-today-button')

  await expect(prevButton).toBeVisible()
  await expect(nextButton).toBeVisible()
  await expect(todayButton).toBeVisible()

  console.log('✅ Calendar navigation buttons are visible')

  // Take screenshot
  await page.screenshot({ path: 'fullcalendar-screenshot.png', fullPage: true })
  console.log('📸 Screenshot saved: fullcalendar-screenshot.png')
})
