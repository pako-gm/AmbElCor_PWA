import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, CalendarDays, ChevronDown } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchEncargos, updateFechasEncargo } from '@/hooks/useEncargos'
import { ESTADO_LABELS } from '@/utils/formatters'

const PX_PER_DAY = 20
const ROW_HEIGHT = 40
const LEFT_COL = 170
const HDR_MES = 20
const HDR_DIA = 18
const HDR_LETRA = 16

const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

const ESTADO_BAR_COLORS = {
  presupuestado: '#9ca3af',
  confirmado: '#14b8a6',
  en_confeccion: '#3b82f6',
  listo: '#f59e0b',
  entregado: '#16a34a',
}

const ESTADO_ORDER = ['presupuestado', 'confirmado', 'en_confeccion', 'listo', 'entregado']

function toLocalDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function diffDays(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmtShort(date) {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function toISO(date) {
  return date.toISOString().split('T')[0]
}

function generateDays(start, end) {
  const days = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function groupByMonth(days) {
  const groups = []
  let cur = null
  days.forEach(d => {
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!cur || cur.key !== key) {
      cur = { key, label: d.toLocaleDateString('es-ES', { month: 'long' }), count: 0 }
      groups.push(cur)
    }
    cur.count++
  })
  return groups
}

function clamp(v, min, max) { return Math.min(Math.max(v, min), max) }

function progressPct(inicioStr, finStr, today) {
  const inicio = toLocalDate(inicioStr)
  const fin    = toLocalDate(finStr)
  if (!inicio || !fin) return 0
  const total = diffDays(inicio, fin)
  if (total <= 0) return 100
  return clamp(diffDays(inicio, today) / total, 0, 1) * 100
}

function urgencyColor(dias) {
  if (dias < 0)  return { text: 'text-red-800',   label: 'Vencido' }
  if (dias <= 3) return { text: 'text-red-500',   label: `${dias}d` }
  if (dias <= 7) return { text: 'text-amber-500', label: `${dias}d` }
  return           { text: 'text-teal-600',  label: `${dias}d` }
}

export default function Cronograma() {
  const navigate = useNavigate()
  const [encargos, setEncargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarEntregados, setMostrarEntregados] = useState(false)
  const [dragState, setDragState] = useState(null)
  const [vista, setVista] = useState('fecha') // 'fecha' | 'estado' | 'gantt'
  const [gruposColapsados, setGruposColapsados] = useState(new Set())
  const dragRef = useRef(null)
  const todayRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    fetchEncargos()
      .then(setEncargos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && todayRef.current && scrollRef.current) {
      const container = scrollRef.current
      const elLeft = todayRef.current.offsetLeft
      container.scrollLeft = elLeft - container.clientWidth / 2 + PX_PER_DAY / 2
    }
  }, [loading])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filtrados = encargos.filter(e =>
    mostrarEntregados ? true : e.estado !== 'entregado'
  )
  const conFecha = filtrados
    .filter(e => e.fecha_entrega_estimada)
    .sort((a, b) => new Date(a.fecha_entrega_estimada) - new Date(b.fecha_entrega_estimada))
  const sinFecha = filtrados.filter(e => !e.fecha_entrega_estimada)

  let rangoInicio = new Date(today)
  rangoInicio.setDate(rangoInicio.getDate() - 14)
  let rangoFin = new Date(today)
  rangoFin.setDate(rangoFin.getDate() + 45)

  if (conFecha.length > 0) {
    const fechas = conFecha.flatMap(e => [
      toLocalDate(e.fecha_encargo),
      toLocalDate(e.fecha_entrega_estimada),
    ].filter(Boolean))
    const minF = new Date(Math.min(...fechas.map(f => f.getTime())))
    const maxF = new Date(Math.max(...fechas.map(f => f.getTime())))
    minF.setDate(minF.getDate() - 7)
    maxF.setDate(maxF.getDate() + 14)
    if (minF < rangoInicio) rangoInicio = minF
    if (maxF > rangoFin) rangoFin = maxF
  }

  const days = generateDays(rangoInicio, rangoFin)
  const months = groupByMonth(days)
  const totalWidth = days.length * PX_PER_DAY
  const todayIdx = diffDays(rangoInicio, today)

  // ── Drag logic ──────────────────────────────────────────────
  const handleBarPointerDown = useCallback((e, encargo) => {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.touches ? e.touches[0].clientX : e.clientX
    const originalInicio = toLocalDate(encargo.fecha_encargo) ?? today
    const originalFin = toLocalDate(encargo.fecha_entrega_estimada)

    dragRef.current = { id: encargo.id, startX, originalInicio, originalFin, deltaDays: 0 }
    document.body.style.cursor = 'grabbing'

    const onMove = (ev) => {
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
      const deltaX = clientX - dragRef.current.startX
      const deltaDays = Math.round(deltaX / PX_PER_DAY)
      if (deltaDays !== dragRef.current.deltaDays) {
        dragRef.current.deltaDays = deltaDays
        setDragState({ id: dragRef.current.id, deltaDays })
      }
    }

    const onUp = async () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
      document.body.style.cursor = ''

      const { id, originalInicio, originalFin, deltaDays } = dragRef.current
      dragRef.current = null
      setDragState(null)

      if (deltaDays === 0) {
        navigate(`/encargos/${id}`)
        return
      }

      const newInicio = addDays(originalInicio, deltaDays)
      const newFin = addDays(originalFin, deltaDays)

      setEncargos(prev => prev.map(enc =>
        enc.id === id
          ? { ...enc, fecha_encargo: toISO(newInicio), fecha_entrega_estimada: toISO(newFin) }
          : enc
      ))

      try {
        await updateFechasEncargo(id, newInicio, newFin)
      } catch (err) {
        console.error(err)
        setEncargos(prev => prev.map(enc =>
          enc.id === id
            ? { ...enc, fecha_encargo: toISO(originalInicio), fecha_entrega_estimada: toISO(originalFin) }
            : enc
        ))
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onUp)
  }, [navigate, today])
  // ─────────────────────────────────────────────────────────────

  const toggleGrupo = (key) =>
    setGruposColapsados(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const stickyLeft = { position: 'sticky', left: 0, zIndex: 30, width: LEFT_COL, flexShrink: 0, background: 'white' }
  const stickyLeftGray = { ...stickyLeft, background: '#f9fafb' }

  // Shared "sin fecha" cards (used in both Por fecha and Gantt views)
  const sinFechaCards = sinFecha.length > 0 && (
    <div className="space-y-2">
      <p className="text-xs text-[--text-light] font-medium uppercase tracking-wide">Sin fecha de entrega</p>
      {sinFecha.map(e => {
        const cliente = e.clientes
          ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim()
          : 'Sin cliente'
        return (
          <button
            key={e.id}
            onClick={() => navigate(`/encargos/${e.id}`)}
            className="w-full bg-white rounded-lg border border-[--border] px-4 py-3 text-left flex items-center justify-between hover:border-primary transition-colors"
          >
            <div>
              <p className="text-[10px] text-[--text-light]">{e.numero}</p>
              <p className="text-sm font-medium text-[--text-dark]">{cliente}</p>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
              style={{ backgroundColor: ESTADO_BAR_COLORS[e.estado] }}
            >
              {ESTADO_LABELS[e.estado]}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <PageWrapper>
      <div className="px-4 py-6 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-[--text-light] hover:text-[--text-dark] transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h1 className="font-display text-2xl text-[--text-dark]">Cronograma</h1>
          </div>
          <button
            onClick={() => setMostrarEntregados(v => !v)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              mostrarEntregados ? 'bg-primary text-white border-primary' : 'bg-white text-[--text-medium] border-[--border]'
            }`}
          >
            {mostrarEntregados ? 'Ocultar entregados' : 'Ver entregados'}
          </button>
        </div>

        {/* ── Segmented control ── */}
        <div className="flex rounded-lg border border-[--border] bg-white overflow-hidden">
          {[
            { key: 'fecha',  label: 'Por fecha' },
            { key: 'estado', label: 'Por estado' },
            { key: 'gantt',  label: 'Gantt' },
          ].map(({ key, label }, i) => (
            <button
              key={key}
              onClick={() => setVista(key)}
              className={[
                'flex-1 px-3 py-1.5 text-xs font-medium transition-colors',
                i > 0 ? 'border-l border-[--border]' : '',
                vista === key ? 'bg-[#30BAAA] text-white' : 'text-[--text-medium] hover:bg-gray-50',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-[--text-light] text-sm">Cargando…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-[--text-light] text-sm">
            <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
            <p>No hay encargos activos.</p>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════
                VISTA: POR FECHA (urgencia)
            ══════════════════════════════════════════════ */}
            {vista === 'fecha' && (
              <div className="space-y-2">
                {[...conFecha]
                  .sort((a, b) => {
                    const dA = diffDays(today, toLocalDate(a.fecha_entrega_estimada))
                    const dB = diffDays(today, toLocalDate(b.fecha_entrega_estimada))
                    return dA - dB
                  })
                  .map(e => {
                    const cliente = e.clientes
                      ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim()
                      : 'Sin cliente'
                    const fin   = toLocalDate(e.fecha_entrega_estimada)
                    const inicio = toLocalDate(e.fecha_encargo) ?? today
                    const dias  = diffDays(today, fin)
                    const { text: urgColor } = urgencyColor(dias)
                    const pct   = progressPct(e.fecha_encargo, e.fecha_entrega_estimada, today)
                    const color = ESTADO_BAR_COLORS[e.estado] ?? '#9ca3af'

                    return (
                      <button
                        key={e.id}
                        onClick={() => navigate(`/encargos/${e.id}`)}
                        className="w-full bg-white rounded-lg border border-[--border] px-4 py-3 text-left space-y-2 hover:border-primary transition-colors"
                      >
                        {/* Top row: numero + estado badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[--text-light]">{e.numero}</span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                            style={{ backgroundColor: color }}
                          >
                            {ESTADO_LABELS[e.estado]}
                          </span>
                        </div>

                        {/* Client name */}
                        <p className="text-sm font-semibold text-[--text-dark]">{cliente}</p>

                        {/* Progress bar */}
                        <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                          <div
                            className="absolute top-0 h-full w-0.5 bg-red-400"
                            style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                          />
                        </div>

                        {/* Bottom row: inicio · entrega + urgency */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[--text-light]">Inicio {fmtShort(inicio)}</span>
                          <span className={`font-medium ${urgColor}`}>
                            Entrega {fmtShort(fin)} · {dias < 0 ? 'Vencido' : `${dias}d`}
                          </span>
                        </div>
                      </button>
                    )
                  })}

                {sinFechaCards}
              </div>
            )}

            {/* ══════════════════════════════════════════════
                VISTA: POR ESTADO (kanban colapsable)
            ══════════════════════════════════════════════ */}
            {vista === 'estado' && (
              <div className="space-y-3">
                {ESTADO_ORDER
                  .filter(key => key !== 'entregado' || mostrarEntregados)
                  .map(key => {
                    const grupo = filtrados
                      .filter(e => e.estado === key)
                      .sort((a, b) => {
                        if (!a.fecha_entrega_estimada) return 1
                        if (!b.fecha_entrega_estimada) return -1
                        return new Date(a.fecha_entrega_estimada) - new Date(b.fecha_entrega_estimada)
                      })
                    if (grupo.length === 0) return null

                    const colapsado = gruposColapsados.has(key)
                    const dot = ESTADO_BAR_COLORS[key] ?? '#9ca3af'

                    return (
                      <div key={key} className="bg-white rounded-lg border border-[--border] overflow-hidden">
                        {/* Group header */}
                        <button
                          onClick={() => toggleGrupo(key)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                            <span className="text-sm font-semibold text-[--text-dark]">{ESTADO_LABELS[key]}</span>
                            <span
                              className="text-[10px] text-white px-1.5 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: dot }}
                            >
                              {grupo.length}
                            </span>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`text-[--text-light] transition-transform ${colapsado ? '-rotate-90' : ''}`}
                          />
                        </button>

                        {/* Cards list */}
                        {!colapsado && (
                          <div className="divide-y divide-[--border]">
                            {grupo.map(e => {
                              const cliente = e.clientes
                                ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim()
                                : 'Sin cliente'
                              const fin  = toLocalDate(e.fecha_entrega_estimada)
                              const dias = fin ? diffDays(today, fin) : null
                              const { text: urgColor } = dias != null
                                ? urgencyColor(dias)
                                : { text: 'text-[--text-light]' }

                              return (
                                <button
                                  key={e.id}
                                  onClick={() => navigate(`/encargos/${e.id}`)}
                                  className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-[--text-light]">{e.numero}</p>
                                    <p className="text-sm font-medium text-[--text-dark] truncate">{cliente}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    {fin ? (
                                      <>
                                        <p className="text-[11px] text-[--text-light]">{fmtShort(fin)}</p>
                                        <p className={`text-[11px] font-medium ${urgColor}`}>
                                          {dias < 0 ? 'Vencido' : `${dias}d`}
                                        </p>
                                      </>
                                    ) : (
                                      <p className="text-[11px] text-[--text-light]">Sin fecha</p>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}

            {/* ══════════════════════════════════════════════
                VISTA: GANTT (existente, sin cambios)
            ══════════════════════════════════════════════ */}
            {vista === 'gantt' && (
              <>
                {conFecha.length > 0 && (
                  <div className="bg-white rounded-lg border border-[--border] overflow-hidden">
                    <div className="overflow-x-auto" ref={scrollRef}>
                      <div style={{ width: LEFT_COL + totalWidth, minWidth: LEFT_COL + totalWidth }}>

                        {/* ── Fila meses ── */}
                        <div className="flex border-b border-[--border]" style={{ height: HDR_MES }}>
                          <div style={{ ...stickyLeftGray, height: HDR_MES }} className="border-r border-[--border]" />
                          <div className="flex" style={{ width: totalWidth }}>
                            {months.map((g, i) => (
                              <div
                                key={g.key}
                                style={{ width: g.count * PX_PER_DAY, height: HDR_MES, flexShrink: 0 }}
                                className={`flex items-center px-1 overflow-hidden bg-gray-50 ${i > 0 ? 'border-l border-[--border]' : ''}`}
                              >
                                <span className="text-[10px] font-semibold text-[--text-medium] capitalize truncate">{g.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── Fila números día ── */}
                        <div className="flex border-b border-[--border]" style={{ height: HDR_DIA }}>
                          <div style={{ ...stickyLeftGray, height: HDR_DIA }} className="border-r border-[--border]" />
                          <div className="flex" style={{ width: totalWidth }}>
                            {days.map((d, i) => {
                              const isToday = i === todayIdx
                              const isMon = d.getDay() === 1
                              return (
                                <div
                                  key={i}
                                  ref={isToday ? todayRef : undefined}
                                  style={{ width: PX_PER_DAY, height: HDR_DIA, flexShrink: 0 }}
                                  className={`flex items-center justify-center overflow-hidden
                                    ${isMon && !isToday ? 'border-l border-gray-200' : ''}
                                    ${isToday ? 'bg-red-500' : 'bg-gray-50'}`}
                                >
                                  <span className={`text-[9px] font-bold leading-none ${isToday ? 'text-white' : 'text-[--text-medium]'}`}>
                                    {d.getDate()}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* ── Fila letra día semana ── */}
                        <div className="flex border-b border-[--border]" style={{ height: HDR_LETRA }}>
                          <div style={{ ...stickyLeftGray, height: HDR_LETRA }} className="border-r border-[--border]" />
                          <div className="flex" style={{ width: totalWidth }}>
                            {days.map((d, i) => {
                              const isToday = i === todayIdx
                              const isMon = d.getDay() === 1
                              const isWeekend = d.getDay() === 0 || d.getDay() === 6
                              return (
                                <div
                                  key={i}
                                  style={{ width: PX_PER_DAY, height: HDR_LETRA, flexShrink: 0 }}
                                  className={`flex items-center justify-center overflow-hidden
                                    ${isMon && !isToday ? 'border-l border-gray-200' : ''}
                                    ${isToday ? 'bg-red-400' : isWeekend ? 'bg-gray-100' : 'bg-gray-50'}`}
                                >
                                  <span className={`text-[8px] leading-none ${isToday ? 'text-white font-bold' : 'text-[--text-light]'}`}>
                                    {DAY_LETTERS[d.getDay()]}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* ── Filas Gantt ── */}
                        {conFecha.map(e => {
                          const inicio = toLocalDate(e.fecha_encargo) ?? today
                          const fin = toLocalDate(e.fecha_entrega_estimada)
                          const isDragging = dragState?.id === e.id
                          const delta = isDragging ? dragState.deltaDays : 0
                          const left = diffDays(rangoInicio, inicio) * PX_PER_DAY + delta * PX_PER_DAY
                          const width = Math.max(diffDays(inicio, fin) * PX_PER_DAY, PX_PER_DAY)
                          const color = ESTADO_BAR_COLORS[e.estado] ?? '#9ca3af'
                          const nombre = e.clientes?.nombre ?? e.numero
                          const cliente = e.clientes
                            ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim()
                            : 'Sin cliente'

                          const tooltipInicio = delta !== 0 ? addDays(inicio, delta) : null
                          const tooltipFin = delta !== 0 ? addDays(fin, delta) : null

                          return (
                            <div key={e.id} className="flex border-b border-[--border]" style={{ height: ROW_HEIGHT }}>
                              {/* Sticky left */}
                              <div
                                style={{ ...stickyLeft, height: ROW_HEIGHT }}
                                className="flex flex-col justify-center px-3 border-r border-[--border]"
                              >
                                <p className="text-[10px] text-[--text-light] truncate">{e.numero}</p>
                                <p className="text-xs font-medium text-[--text-dark] leading-tight">{cliente}</p>
                              </div>

                              {/* Timeline */}
                              <div style={{ width: totalWidth, height: ROW_HEIGHT, position: 'relative', flexShrink: 0 }}>
                                {/* Grid */}
                                {days.map((d, i) => {
                                  const isToday = i === todayIdx
                                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                                  const isMon = d.getDay() === 1
                                  return (
                                    <div
                                      key={i}
                                      style={{ position: 'absolute', left: i * PX_PER_DAY, top: 0, width: PX_PER_DAY, height: ROW_HEIGHT }}
                                      className={
                                        isToday ? 'bg-red-50 border-l border-red-200'
                                        : isWeekend ? 'bg-gray-50'
                                        : isMon ? 'border-l border-gray-100'
                                        : ''
                                      }
                                    />
                                  )
                                })}

                                {/* Drag tooltip */}
                                {isDragging && tooltipInicio && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: Math.max(0, left),
                                      top: 2,
                                      zIndex: 50,
                                      pointerEvents: 'none',
                                    }}
                                    className="bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap shadow"
                                  >
                                    {fmtShort(tooltipInicio)} → {fmtShort(tooltipFin)}
                                  </div>
                                )}

                                {/* Bar */}
                                <div
                                  onMouseDown={(ev) => handleBarPointerDown(ev, e)}
                                  onTouchStart={(ev) => handleBarPointerDown(ev, e)}
                                  style={{
                                    position: 'absolute',
                                    left: left + 1,
                                    width: width - 2,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    height: 24,
                                    backgroundColor: color,
                                    borderRadius: 5,
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    userSelect: 'none',
                                    zIndex: 20,
                                    transition: isDragging ? 'none' : 'left 0.1s',
                                  }}
                                  className="flex items-center px-1.5 overflow-hidden hover:opacity-80"
                                  title={`${cliente} · ${ESTADO_LABELS[e.estado]}`}
                                >
                                  <span className="text-white text-[10px] font-medium truncate pointer-events-none">{nombre}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="px-4 py-2 border-t border-[--border] bg-gray-50 flex gap-3 flex-wrap">
                      {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div style={{ backgroundColor: ESTADO_BAR_COLORS[key], width: 10, height: 10, borderRadius: 3 }} />
                          <span className="text-[10px] text-[--text-light]">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sinFechaCards}
              </>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
