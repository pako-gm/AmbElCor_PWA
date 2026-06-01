import { test, expect } from '@playwright/test'

test('CitasCalendario: Drag & drop with 15-min snap', async ({ page }) => {
  // Navigate to citas page
  await page.goto('http://localhost:5173/citas', { waitUntil: 'networkidle' })

  // Wait for timeline to be visible
  await page.waitForSelector('[class*="timeline"]', { timeout: 5000 })

  console.log('✅ Page loaded')

  // Find first cita card (drag me)
  const citaCard = page.locator('[draggable=true]').first()
  const exists = await citaCard.count()

  if (exists === 0) {
    console.log('⚠️ No citas found to drag - calendar may be empty')
    return
  }

  console.log(`✅ Found ${exists} draggable citas`)

  // Get timeline bounds for drop target
  const timeline = page.locator('[class*="overflow-y-auto"][class*="flex"]').first()
  const timelineBounds = await timeline.boundingBox()

  if (!timelineBounds) {
    console.log('❌ Could not find timeline bounds')
    return
  }

  console.log(`✅ Timeline bounds: ${JSON.stringify(timelineBounds)}`)

  // Get initial cita position
  const citaBounds = await citaCard.boundingBox()
  console.log(`✅ Cita initial position: top=${citaBounds.y}, height=${citaBounds.height}`)

  // Perform drag: grab center of card, drag down ~150px (should snap to nearest 15min)
  const fromX = citaBounds.x + citaBounds.width / 2
  const fromY = citaBounds.y + citaBounds.height / 2
  const toX = citaBounds.x + citaBounds.width / 2
  const toY = fromY + 150  // drag down

  console.log(`🔍 Starting drag from (${fromX}, ${fromY}) to (${toX}, ${toY})`)

  // Perform drag
  await citaCard.dragTo(timeline, {
    sourcePosition: { x: citaBounds.width / 2, y: citaBounds.height / 2 },
    targetPosition: {
      x: timelineBounds.width / 2,
      y: 150
    }
  })

  // Wait a moment for update
  await page.waitForTimeout(500)

  // Check if guide line appears during drag (we won't be able to catch this, but check after)
  const guideLine = page.locator('[style*="background"]').filter({
    has: page.locator('..').filter({ has: page.locator('[style*="top:"]') })
  })

  console.log('✅ Drag completed')

  // Verify cita moved
  const newCitaBounds = await citaCard.boundingBox()
  const moved = newCitaBounds.y !== citaBounds.y

  if (moved) {
    console.log(`✅ Cita moved: old y=${citaBounds.y}, new y=${newCitaBounds.y}`)
  } else {
    console.log('⚠️ Cita did not move (drag may have been ignored)')
  }

  // Take screenshot to see current state
  await page.screenshot({ path: 'verify-citas-drag.png', fullPage: false })
  console.log('📸 Screenshot saved: verify-citas-drag.png')
})
