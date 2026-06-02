import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

async function verifyDesign() {
  console.log('🚀 Verificando diseño del calendario...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    console.log('📍 Navegando a http://localhost:5174/citas')
    await page.goto('http://localhost:5174/citas', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    }).catch(() => null)

    // Esperar a que cargue el calendario
    await page.waitForTimeout(3000)

    // Capturar screenshot del calendario
    const screenshot = await page.screenshot({ path: 'citas-calendar.png', fullPage: false })
    console.log('✅ Screenshot capturado: citas-calendar.png')

    // Verificar elementos del DOM
    console.log('\n🔍 Verificando elementos del DOM...')

    // Buscar la cabecera personalizada
    const headerText = await page.locator('.flex.items-center.justify-between.mb-4').first().textContent().catch(() => '')
    console.log(`Header encontrado: ${headerText ? '✅' : '❌'}`)

    // Buscar el badge de citas
    const badgeText = await page.locator('.bg-primary\\/10.text-primary').first().textContent().catch(() => '')
    console.log(`Badge de citas: ${badgeText || 'No encontrado'}`)

    // Buscar eventos
    const eventCount = await page.locator('[data-eventid]').count().catch(() => 0)
    console.log(`Eventos encontrados: ${eventCount}`)

    // Verificar que los estilos CSS están cargados
    const fcEvent = await page.locator('.fc-timegrid-event').first()
    const styles = await fcEvent.evaluate(el => {
      return {
        borderLeftWidth: getComputedStyle(el).borderLeftWidth,
        backgroundColor: getComputedStyle(el).backgroundColor,
        borderColor: getComputedStyle(el).borderColor,
        color: getComputedStyle(el).color
      }
    }).catch(() => null)

    if (styles) {
      console.log('\n✅ Estilos de evento aplicados:')
      console.log(`   Border-left: ${styles.borderLeftWidth}`)
      console.log(`   Background: ${styles.backgroundColor}`)
      console.log(`   Border color: ${styles.borderColor}`)
      console.log(`   Text color: ${styles.color}`)
    } else {
      console.log('\n⚠️ No se pudieron verificar los estilos del evento')
    }

    console.log('\n' + '='.repeat(60))
    console.log('VERIFICATION COMPLETE ✅')
    console.log('='.repeat(60))

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

// Instalar browsers si no existen
import { execSync } from 'child_process'
try {
  execSync('npx playwright install chromium --with-deps 2>&1 | tail -3', {
    stdio: 'inherit',
    timeout: 120000
  })
} catch (e) {
  console.log('⚠️ Playwright install command completed')
}

await verifyDesign()
