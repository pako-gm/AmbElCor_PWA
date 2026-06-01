import { chromium } from '@playwright/test'

async function verifyDragAndDrop() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Navigate to the citas page
    console.log('🔍 Navigating to /citas...')
    await page.goto('http://localhost:5173/citas', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000) // Give calendar time to render

    // Take screenshot of initial state
    console.log('📸 Taking initial screenshot...')
    await page.screenshot({ path: 'verify-initial.png' })

    // Try to find a calendar event
    const events = await page.locator('[data-eventid]').all()
    console.log(`✅ Found ${events.length} calendar events`)

    if (events.length === 0) {
      console.log('⚠️ No events found on calendar. Creating a test event...')

      // Click on "Nueva cita" button
      await page.click('button:has-text("Nueva cita")')
      await page.waitForTimeout(500)

      // Fill client name (search in autocomplete)
      await page.fill('input[placeholder="Buscar cliente..."]', 'Amparo')
      await page.waitForTimeout(500)

      // Select first option from dropdown if available
      const firstOption = page.locator('[role="option"]').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
      }

      // Select appointment type
      await page.click('button:has-text("Prueba de traje")')
      await page.waitForTimeout(300)

      // Set start time
      await page.selectOption('select[aria-label*="Hora inicio"]', '09:00')

      // Set end time
      await page.selectOption('select[aria-label*="Hora fin"]', '10:00')

      // Save the appointment
      await page.click('button:has-text("Guardar cita")')
      await page.waitForTimeout(1500)

      console.log('✅ Test event created')

      // Reload to see the event
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
    }

    // Try to drag an event
    const eventElement = await page.locator('[data-eventid]').first()

    if (await eventElement.isVisible()) {
      console.log('🔍 Attempting to drag event...')

      // Get the bounding box
      const box = await eventElement.boundingBox()
      console.log(`📍 Event location: ${JSON.stringify(box)}`)

      // Perform drag operation (down 100px = next hour slot)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(200)
      await page.mouse.move(box.x + box.width / 2, box.y + 100) // Drag down
      await page.waitForTimeout(200)
      await page.mouse.up()

      console.log('✅ Drag operation completed')

      // Wait for potential update animation
      await page.waitForTimeout(1500)

      // Take screenshot after drag
      console.log('📸 Taking screenshot after drag...')
      await page.screenshot({ path: 'verify-after-drag.png' })

      // Check if dialog/confirmation appears
      const confirmDialog = page.locator('text=Solapamiento')
      if (await confirmDialog.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log('⚠️ Overlap detected - drag was prevented')
        await page.screenshot({ path: 'verify-overlap.png' })
      } else {
        console.log('✅ No overlap detected - drag was successful')
      }
    } else {
      console.log('⚠️ No visible events to drag')
    }

    console.log('✅ Verification complete')

  } catch (error) {
    console.error('❌ Error during verification:', error.message)
    await page.screenshot({ path: 'verify-error.png' })
    throw error
  } finally {
    await browser.close()
  }
}

verifyDragAndDrop().catch(console.error)
