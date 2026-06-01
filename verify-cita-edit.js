import { test, expect } from '@playwright/test'

test('Al editar una cita, debe mostrar el nombre del cliente en el campo', async ({ page }) => {
  // Navegar a la app
  await page.goto('http://localhost:5174/')

  // Esperar a que cargue la página
  await page.waitForURL(/.*/)

  // Si hay un botón de login, hacer click
  const loginButton = page.locator('button:has-text("Google")')
  if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Página requiere login')
    // Aquí habría que hacer login con Google, pero para esta prueba
    // asumimos que ya está autenticado
  }

  // Navegar a Citas
  await page.goto('http://localhost:5174/citas')

  // Esperar a que cargue el calendario
  await page.waitForSelector('[class*="fc-"]', { timeout: 5000 }).catch(() => null)

  // Esperar un poco para que carguen las citas
  await page.waitForTimeout(2000)

  // Buscar un evento de cita en el calendario
  const citaButton = page.locator('[role="button"]').filter({ hasText: /👗|🎁|✂️|💬|💳/ }).first()

  if (await citaButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Cita encontrada, haciendo click...')
    await citaButton.click()

    // Esperar a que se abra el modal
    await page.waitForSelector('h2:has-text("Prueba de traje"), h2:has-text("Entrega"), h2:has-text("Ajuste"), h2:has-text("Consulta"), h2:has-text("Pago")', { timeout: 2000 })

    // Obtener el nombre del cliente mostrado en modo view
    const clienteNombreView = await page.locator('p:has-text("Cliente")').locator('..').locator('p:last-child').textContent()
    console.log('Cliente en modo view:', clienteNombreView)

    // Hacer click en el botón Editar
    const editButton = page.locator('button:has-text("Editar")')
    await editButton.click()

    // Esperar a que el modal cambie a modo edit
    await page.waitForSelector('h2:has-text("Editar cita")', { timeout: 2000 })

    // Obtener el valor del input del cliente
    const inputCliente = page.locator('input[placeholder="Buscar o seleccionar cliente..."]')
    const valorInput = await inputCliente.inputValue()

    console.log('Valor en input:', valorInput)

    // Verificar que el input no esté vacío (excepto si era una nueva cita)
    if (clienteNombreView && clienteNombreView.trim()) {
      expect(valorInput).toBeTruthy()
      expect(valorInput).toBe(clienteNombreView.trim())
      console.log('✅ PASS: El nombre del cliente se muestra correctamente en el input de edición')
    } else {
      console.log('⚠️ No hay cliente en la vista, probablemente es una cita nueva sin cliente asignado')
    }
  } else {
    console.log('⚠️ No hay citas en el calendario. Creando una cita de prueba...')

    // Si no hay citas, crear una
    const newButton = page.locator('button:has-text("Nueva cita")')
    if (await newButton.isVisible()) {
      await newButton.click()

      // Esperar modal
      await page.waitForSelector('h2:has-text("Nueva cita")', { timeout: 2000 })

      // Seleccionar cliente
      const inputCliente = page.locator('input[placeholder="Buscar o seleccionar cliente..."]')
      await inputCliente.fill('Carmen')
      await page.waitForTimeout(500)

      // Click en el primer cliente de la lista
      const primerCliente = page.locator('[class*="hover:bg-gray-100"]').first()
      if (await primerCliente.isVisible({ timeout: 1000 }).catch(() => false)) {
        await primerCliente.click()

        // Seleccionar tipo de cita
        const typePrueba = page.locator('button:has-text("Prueba de traje")')
        await typePrueba.click()

        // Guardar
        const guardarButton = page.locator('button:has-text("Guardar cita")')
        await guardarButton.click()

        // Esperar a que se guarde
        await page.waitForTimeout(2000)

        console.log('Cita creada, ahora abriendo para editar...')

        // Volver a buscar la cita
        await page.waitForSelector('[class*="fc-"]', { timeout: 5000 }).catch(() => null)
        const nuevaCita = page.locator('[role="button"]').filter({ hasText: /👗|🎁|✂️|💬|💳/ }).first()

        if (await nuevaCita.isVisible()) {
          await nuevaCita.click()
          await page.waitForTimeout(500)

          // Click Editar
          const editBtn = page.locator('button:has-text("Editar")').first()
          await editBtn.click()

          // Esperar modal de edición
          await page.waitForSelector('h2:has-text("Editar cita")', { timeout: 2000 })

          // Verificar que el cliente está en el input
          const input = page.locator('input[placeholder="Buscar o seleccionar cliente..."]')
          const valor = await input.inputValue()

          console.log('Valor en input después de editar:', valor)
          expect(valor).toBeTruthy()
          expect(valor).toContain('Carmen')
          console.log('✅ PASS: El cliente se muestra correctamente al editar')
        }
      }
    }
  }
})
