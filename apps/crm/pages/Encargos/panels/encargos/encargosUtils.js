/**
 * Calcula el progreso temporal de un encargo.
 * @returns {{ pct: number, diasRestantes: number, vencido: boolean } | null}
 */
export function calcularProgreso(fechaInicio, fechaFin) {
  if (!fechaFin) return null
  const inicio = new Date(fechaInicio).getTime()
  const fin = new Date(fechaFin).getTime()
  const hoy = Date.now()
  const total = fin - inicio
  if (total <= 0) return null
  const avance = ((hoy - inicio) / total) * 100
  const diasRestantes = Math.ceil((fin - hoy) / 86400000)
  return { pct: Math.max(0, avance), diasRestantes, vencido: hoy > fin }
}

/**
 * Devuelve la posición (0-100) del checkpoint "-7 días" como porcentaje de la barra.
 * @returns {number}
 */
export function calcularMarcoAviso(fechaInicio, fechaFin) {
  if (!fechaFin || !fechaInicio) return 0
  const inicio = new Date(fechaInicio).getTime()
  const fin = new Date(fechaFin).getTime()
  const total = fin - inicio
  if (total <= 0) return 0
  return Math.max(0, Math.min(100,
    ((fin - 7 * 86400000 - inicio) / total) * 100
  ))
}
