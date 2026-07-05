// Utilidades compartidas del módulo Citas (agenda de día)

// Colores de la paleta de marca (tailwind.config); las tarjetas necesitan hex literales
export const TIPOS_CITA = {
  prueba: { label: 'Prueba de traje', color: '#d6536d', emoji: '👗' },
  entrega: { label: 'Entrega', color: '#b07d33', emoji: '🎁' },
  ajuste: { label: 'Ajuste / retoque', color: '#8b5cd6', emoji: '✂️' },
  consulta: { label: 'Consulta inicial', color: '#16a163', emoji: '💬' },
  pago: { label: 'Pago / seña', color: '#1fb39a', emoji: '💳' },
}

export const HORA_INICIO_MIN = 8 * 60   // 08:00
export const HORA_FIN_MIN = 20 * 60     // 20:00
export const PX_MIN = 2.2               // píxeles por minuto en el timeline
export const SNAP_MIN = 15              // snap del drag en minutos

export const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const toMin = h => {
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + mm
}

export const toHHMM = m =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

// Clave YYYY-MM-DD en hora LOCAL (toISOString daría el día UTC y rompe de madrugada)
export const claveFechaLocal = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Lunes a domingo de la semana que contiene `base`
export function semanaDesde(base) {
  const d = new Date(base)
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - dow + 1)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d)
    x.setDate(x.getDate() + i)
    return x
  })
}

// Reparte citas solapadas en columnas paralelas (greedy por hora de inicio)
export function resolverColumnas(citas) {
  const sorted = [...citas].sort((a, b) => a.minInicio - b.minInicio)
  const cols = []
  sorted.forEach(c => {
    let placed = false
    for (let i = 0; i < cols.length; i++) {
      const last = cols[i][cols[i].length - 1]
      if (last.minFin <= c.minInicio) {
        cols[i].push(c)
        placed = true
        break
      }
    }
    if (!placed) cols.push([c])
  })
  const colMap = {}
  cols.forEach((col, ci) => col.forEach(c => { colMap[c.id] = ci }))
  return { colMap, numCols: cols.length }
}
