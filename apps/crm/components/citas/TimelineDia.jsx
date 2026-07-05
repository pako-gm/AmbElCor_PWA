import { useState, useEffect, useRef } from 'react'
import {
  TIPOS_CITA, HORA_INICIO_MIN, HORA_FIN_MIN, PX_MIN, SNAP_MIN,
  toHHMM, resolverColumnas,
} from './citasUtils'

const ALTO_TIMELINE = (HORA_FIN_MIN - HORA_INICIO_MIN) * PX_MIN

function NowLine() {
  const [min, setMin] = useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })

  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date()
      setMin(n.getHours() * 60 + n.getMinutes())
    }, 30000)
    return () => clearInterval(t)
  }, [])

  if (min < HORA_INICIO_MIN || min > HORA_FIN_MIN) return null

  return (
    <div
      className="absolute left-[-48px] right-0 flex items-center z-10 pointer-events-none"
      style={{ top: (min - HORA_INICIO_MIN) * PX_MIN }}
    >
      <span className="w-9 text-right pr-2 text-[8px] font-bold text-[#E0245E] flex-shrink-0">
        {toHHMM(min)}
      </span>
      <div className="flex-1 h-0.5 bg-[#E0245E]" />
      <div className="w-[7px] h-[7px] rounded-full bg-[#E0245E] -ml-1 flex-shrink-0" />
    </div>
  )
}

// Timeline del día: rejilla 8:00–20:00, tarjetas posicionadas por minutos,
// columnas paralelas en solapes y drag vertical con snap de 15 min
export default function TimelineDia({ citasDia, esHoy, onAbrirCita, onMoverCita }) {
  const dragRef = useRef(null) // { id, startY, startInicio, dur, moved }
  const guardandoRef = useRef(false)
  const [dragSnap, setDragSnap] = useState({}) // id → delta de minutos snapeado
  const [dragId, setDragId] = useState(null)

  const { colMap, numCols } = resolverColumnas(citasDia)

  const limpiarDrag = id => {
    dragRef.current = null
    setDragId(null)
    setDragSnap(p => {
      const n = { ...p }
      delete n[id]
      return n
    })
  }

  const onCardPointerDown = (e, c) => {
    if (guardandoRef.current) return
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* no-op */ }
    dragRef.current = { id: c.id, startY: e.clientY, startInicio: c.minInicio, dur: c.minFin - c.minInicio, moved: false }
    setDragId(c.id)
    setDragSnap(p => ({ ...p, [c.id]: 0 }))
  }

  const onCardPointerMove = (e, c) => {
    const d = dragRef.current
    if (!d || d.id !== c.id) return
    const rawDeltaY = e.clientY - d.startY
    if (Math.abs(rawDeltaY) > 4) d.moved = true
    const snapped = Math.round(rawDeltaY / PX_MIN / SNAP_MIN) * SNAP_MIN
    const maxDelta = HORA_FIN_MIN - d.dur - d.startInicio
    const minDelta = HORA_INICIO_MIN - d.startInicio
    const clamped = Math.max(minDelta, Math.min(maxDelta, snapped))
    setDragSnap(p => ({ ...p, [c.id]: clamped }))
  }

  const onCardPointerUp = async (e, c) => {
    const d = dragRef.current
    if (!d || d.id !== c.id) return
    const delta = dragSnap[c.id] || 0
    const moved = d.moved
    limpiarDrag(c.id)
    if (moved && delta !== 0) {
      guardandoRef.current = true
      try {
        await onMoverCita(c, d.startInicio + delta)
      } finally {
        guardandoRef.current = false
      }
    } else if (!moved) {
      onAbrirCita(c)
    }
  }

  const onCardPointerCancel = (e, c) => {
    const d = dragRef.current
    if (!d || d.id !== c.id) return
    limpiarDrag(c.id)
  }

  const lineas = []
  for (let m = HORA_INICIO_MIN; m <= HORA_FIN_MIN; m += 30) lineas.push(m)

  return (
    <div className="relative ml-12 mr-2.5" style={{ height: ALTO_TIMELINE + 32 }}>
      {lineas.map(m => (
        <div
          key={m}
          className="absolute left-[-48px] right-0 flex items-start"
          style={{ top: (m - HORA_INICIO_MIN) * PX_MIN }}
        >
          <span
            className={`w-9 text-right pr-2 pt-2 text-[9px] text-[--text-light] flex-shrink-0 ${
              m % 60 === 0 ? 'font-bold' : ''
            }`}
          >
            {toHHMM(m)}
          </span>
          <div className="flex-1 h-px bg-[--border]" />
        </div>
      ))}

      {esHoy && <NowLine />}

      {citasDia.length === 0 && (
        <p className="absolute inset-x-0 top-32 text-center text-sm text-[--text-light] pointer-events-none">
          No hay citas este día
        </p>
      )}

      {citasDia.map(c => {
        const delta = dragSnap[c.id] ?? 0
        const esDrag = dragId === c.id
        const liveInicio = c.minInicio + delta
        const liveFin = c.minFin + delta
        const dur = c.minFin - c.minInicio
        // Clamp de render para citas que salen del rango 8–20h (las horas reales se conservan)
        const topMin = Math.max(liveInicio, HORA_INICIO_MIN)
        const bottomMin = Math.min(liveFin, HORA_FIN_MIN)
        if (bottomMin <= HORA_INICIO_MIN || topMin >= HORA_FIN_MIN) return null
        const top = (topMin - HORA_INICIO_MIN) * PX_MIN
        const height = Math.max((bottomMin - topMin) * PX_MIN, 26)
        const tipo = TIPOS_CITA[c.tipo] || TIPOS_CITA.consulta
        const col = colMap[c.id] || 0
        const cols = numCols || 1

        return (
          <div
            key={c.id}
            data-testid="cita-card"
            className="absolute flex flex-col justify-start gap-px overflow-hidden px-1.5 py-0.5 cursor-grab touch-none select-none"
            style={{
              top,
              height,
              left: `calc(${col} * (100% / ${cols}) + ${col * 3}px)`,
              width: `calc((100% - ${(cols - 1) * 3}px) / ${cols})`,
              background: `${tipo.color}10`,
              borderLeft: `3px solid ${tipo.color}`,
              borderTop: `1px solid ${tipo.color}22`,
              borderRight: `1px solid ${tipo.color}22`,
              borderBottom: `1px solid ${tipo.color}22`,
              borderRadius: '0 7px 7px 0',
              zIndex: esDrag ? 20 : 1,
              boxShadow: esDrag ? `0 8px 24px ${tipo.color}55` : 'none',
              opacity: esDrag ? 0.92 : 1,
              transition: esDrag ? 'box-shadow 0.1s' : 'top 0.15s, box-shadow 0.1s',
            }}
            onPointerDown={e => onCardPointerDown(e, c)}
            onPointerMove={e => onCardPointerMove(e, c)}
            onPointerUp={e => onCardPointerUp(e, c)}
            onPointerCancel={e => onCardPointerCancel(e, c)}
          >
            <span
              className="text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ color: tipo.color }}
            >
              {tipo.emoji} {tipo.label}
            </span>
            {height > 32 && (
              <span
                className="text-[9px] opacity-75 whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ color: tipo.color }}
              >
                {toHHMM(liveInicio)}–{toHHMM(liveFin)}
              </span>
            )}
            {height > 52 && (
              <span
                className="text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ color: tipo.color }}
              >
                {c.cliente_nombre}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
