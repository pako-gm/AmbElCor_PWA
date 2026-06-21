// Validaciones de entrada compartidas por toda la app

const REGEX_TELEFONO = /^\d{9}$/
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Teléfono español: 9 dígitos (admite espacios/guiones de entrada)
export const validarTelefono = (valor) =>
  REGEX_TELEFONO.test(normalizarTelefono(valor))

export const validarEmail = (valor) => REGEX_EMAIL.test(valor ?? '')

export const validarRequerido = (valor) =>
  typeof valor === 'string' ? valor.trim().length > 0 : valor != null

// Número >= 0 y no NaN (acepta string de input)
export const validarNumeroPositivo = (valor) => {
  if (valor === '' || valor == null) return false
  const n = Number(valor)
  return !isNaN(n) && n >= 0
}

// Número decimal >= 0 (acepta coma o punto como separador)
export const validarDecimal = (valor) => {
  if (valor === '' || valor == null) return false
  const n = Number(String(valor).replace(',', '.'))
  return !isNaN(n) && n >= 0
}

// Quita espacios y guiones antes de guardar en BD
export const normalizarTelefono = (valor) =>
  (valor ?? '').replace(/[\s-]/g, '')

/* ============================================================
   Saneadores de entrada (filtran "al escribir").
   Reciben el valor del input y devuelven el valor permitido.
   El objetivo es impedir caracteres incoherentes con el tipo
   de dato y neutralizar secuencias de inyección/control.
   Nota: la defensa real contra SQLi es Supabase (consultas
   parametrizadas); esto es calidad de dato + defensa en
   profundidad.
   ============================================================ */

// Caracteres de control (no imprimibles) a eliminar siempre
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g

// Texto libre permisivo: conserva letras acentuadas, ñ, espacios y
// puntuación normal; elimina caracteres peligrosos de inyección y
// secuencias de comentario SQL (--).
const sanitizarTexto = (valor) =>
  (valor ?? '')
    .replace(CONTROL_CHARS, '')
    .replace(/[<>;`'"\\]/g, '')
    .replace(/--+/g, '')

export const sanitizers = {
  // Solo dígitos, máximo 9 (teléfono español)
  telefono: (v) => (v ?? '').replace(/\D/g, '').slice(0, 9),

  // Juego de caracteres válido en un email (sin espacios)
  email: (v) => (v ?? '').replace(/[^a-zA-Z0-9@._+\-]/g, ''),

  // Solo dígitos
  entero: (v) => (v ?? '').replace(/\D/g, ''),

  // Dígitos con un único separador decimal (coma o punto)
  decimal: (v) => {
    let s = (v ?? '').replace(/[^\d.,]/g, '')
    const i = s.search(/[.,]/)
    if (i === -1) return s
    // conserva el primer separador, elimina los siguientes
    return s.slice(0, i + 1) + s.slice(i + 1).replace(/[.,]/g, '')
  },

  // Código de material/seguimiento: alfanumérico + guion, en mayúsculas
  codigo: (v) => (v ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, ''),

  // NIF/CIF: alfanumérico en mayúsculas
  nif: (v) => (v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, ''),

  // Código TOTP de 2FA: 6 dígitos
  otp: (v) => (v ?? '').replace(/\D/g, '').slice(0, 6),

  // Texto libre permisivo
  texto: sanitizarTexto,
}

// Escapa un término de búsqueda para usarlo dentro de un patrón
// `.or(col.ilike.%valor%)` de PostgREST: elimina los caracteres con
// significado estructural en el filtro (`, ( ) *` y backslash) para
// evitar inyección de condiciones en el filtro.
export const escaparBusqueda = (valor) =>
  (valor ?? '').replace(CONTROL_CHARS, '').replace(/[,()*\\]/g, '')
