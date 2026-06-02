# Configuración de Playwright para Verificación Visual

## Estado actual

✅ **Configuración completada:**
- `playwright.config.ts` — configuración centralizada creada
- `tests/screenshot.spec.ts` — spec para capturas de páginas principales creada
- `verify-design.mjs` — puerto corregido (5174 → 5173) e instalación automática eliminada
- `tests/fullcalendar-test.spec.js` — URL relativa + selector correcto
- `package.json` — scripts `test:e2e` y `screenshot` añadidos

## Instalación de Chromium

El primer paso es instalar el navegador Chromium:

```bash
npx playwright install chromium --with-deps
```

**Nota:** Este comando requiere conectividad de Internet para descargar binarios (~150 MB). En caso de fallos de descarga, se puede intentar con un proxy o en una máquina con acceso a Internet.

## Uso

### Opción 1: Captura rápida de screenshots (recomendado para desarrollo)

Con el dev server ejecutándose:

```bash
npm run screenshot
```

Esto genera PNG en `test-screenshots/`:
- `citas.png` — página de citas
- `encargos.png` — página de encargos
- `clientes.png` — página de clientes
- `dashboard.png` — página principal

Claude Code puede leer estos archivos con la herramienta `Read` para inspeccionar los cambios visualmente.

### Opción 2: Ejecutar todos los tests e2e

```bash
npm run test:e2e
```

### Opción 3: Verificación del calendario (script legacy)

```bash
node verify-design.mjs
```

Genera `citas-calendar.png` y verifica estilos CSS del evento.

## Flujo típico de trabajo

1. Hacer cambios en el código
2. `npm run dev` (si no está corriendo)
3. `npm run screenshot` en otra terminal
4. Revisar los PNG en `test-screenshots/` para verificar cambios visuales
5. Repetir hasta estar satisfecho

## Puertos

- **Vite dev server:** `http://localhost:5173` (por defecto)
- **Playwright baseURL:** `http://localhost:5173` (configurado en `playwright.config.ts`)
- **verify-design.mjs:** ahora también apunta a `5173`

Todos los scripts esperan que el dev server esté en `5173`.

## Archivos modificados

| Archivo | Cambios |
|---|---|
| `playwright.config.ts` | Creado |
| `tests/screenshot.spec.ts` | Creado |
| `verify-design.mjs` | Puerto 5174 → 5173; eliminado `execSync` para instalar Chromium |
| `tests/fullcalendar-test.spec.js` | URL relativa; selector `.fc-view-harness` |
| `package.json` | Scripts `test:e2e` y `screenshot` |