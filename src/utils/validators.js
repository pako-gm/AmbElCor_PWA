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

// Quita espacios y guiones antes de guardar en BD
export const normalizarTelefono = (valor) =>
  (valor ?? '').replace(/[\s-]/g, '')
