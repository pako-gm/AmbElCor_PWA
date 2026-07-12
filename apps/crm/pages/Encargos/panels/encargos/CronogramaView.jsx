import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ESTADO_LABELS, formatNumeroEncargo } from '@/utils/formatters'
import Badge from '@/components/ui/Badge'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'

const ESTADOS_ORDEN = ['presupuestado', 'confirmado', 'en_confeccion', 'listo', 'entregado']

const COL_COLOR = {
  presupuestado: '#7B8496',
  confirmado:    '#7559C2',
  en_confeccion: '#3D6BB3',
  listo:         '#B07D33',
  entregado:     '#2E9D5B',
}

const COL_W = 40
const N_DAYS = 28
const STEP = 7
const LEFT_TABLE_W = 138 + 148 + 140

const MONTHS_ES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function parseISO(s) {
  if (!s) return null
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function toISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function fmtRangeLabel(start, end) {
  const a = start.getDate() + ' ' + MONTHS_SHORT[start.getMonth()]
  const b = end.getDate() + ' ' + MONTHS_SHORT[end.getMonth()] + ' ' + end.getFullYear()
  return a + ' – ' + b
}

// ── Vista Cronograma ─────────────────────────────────────────────────────────

export default function CronogramaView({ encargos, loading }) {
  const navigate = useNavigate()
  const [panDays, setPanDays] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [estadosFiltro, setEstadosFiltro] = useState(() => Object.fromEntries(ESTADOS_ORDEN.map(k => [k, true])))
  const filterRef = useRef(null)
  const chartRef = useRef(null)
  const [nDays, setNDays] = useState(N_DAYS)

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = e => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFiltersOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Ajustar el nº de días visibles al ancho disponible para evitar hueco vacío
  useEffect(() => {
    const el = chartRef.current
    if (!el) return
    const update = () => {
      const fit = Math.ceil((el.clientWidth - LEFT_TABLE_W) / COL_W)
      setNDays(Math.max(N_DAYS, fit))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const colW = COL_W
  const step = STEP

  // Eje temporal: empieza 7 días antes de hoy + offset de pan
  const axisStart = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return addDays(today, -7 + panDays)
  }, [panDays])

  const axisEnd = useMemo(() => addDays(axisStart, nDays - 1), [axisStart, nDays])

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const hoyIdx = useMemo(() => diffDays(axisStart, today), [axisStart, today])
  const hoyX = hoyIdx * colW

  // Construir días del eje
  const days = useMemo(() => {
    const arr = []
    for (let i = 0; i < nDays; i++) {
      const d = addDays(axisStart, i)
      const dow = d.getDay()
      arr.push({ date: d, num: d.getDate(), weekend: dow === 0 || dow === 6 })
    }
    return arr
  }, [axisStart, nDays])

  // Construir cabecera de meses
  const months = useMemo(() => {
    const result = []
    days.forEach(d => {
      const key = d.date.getFullYear() + '-' + d.date.getMonth()
      const last = result[result.length - 1]
      if (last && last.key === key) last.count++
      else result.push({ key, label: MONTHS_ES[d.date.getMonth()] + ' ' + d.date.getFullYear(), count: 1 })
    })
    return result
  }, [days])

  // Posición X de una fecha ISO en px (centrada en la celda de ese día)
  const xOf = useCallback(isoStr => {
    if (!isoStr) return null
    const d = parseISO(isoStr)
    if (!d) return null
    const idx = diffDays(axisStart, d)
    return idx * colW + colW / 2
  }, [axisStart, colW])

  // Rango visible
  const rangeLabel = fmtRangeLabel(axisStart, axisEnd)

  // Encargos filtrados
  const rows = useMemo(() =>
    encargos
      .filter(e => estadosFiltro[e.estado] && e.fecha_encargo)
      .sort((a, b) => (a.fecha_encargo ?? '').localeCompare(b.fecha_encargo ?? ''))
      .map(e => {
        const color = COL_COLOR[e.estado] ?? '#7B8496'
        const startX = xOf(e.fecha_encargo)
        const endX   = xOf(e.fecha_entrega_estimada)
        // aviso = 7 días antes del fin
        const avisoISO = e.fecha_entrega_estimada
          ? toISO(addDays(parseISO(e.fecha_entrega_estimada), -7))
          : null
        const avisoX = xOf(avisoISO)
        const lineW = startX !== null && endX !== null ? Math.max(0, endX - startX) : 0
        const nombreCliente = e.clientes
          ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim()
          : '—'
        return { ...e, color, startX, endX, avisoX, lineW, nombreCliente }
      }),
    [encargos, estadosFiltro, xOf]
  )

  const filtersActive = ESTADOS_ORDEN.some(k => !estadosFiltro[k])

  const toggleEstado = k => setEstadosFiltro(prev => ({ ...prev, [k]: !prev[k] }))
  const resetFilters = () => setEstadosFiltro(Object.fromEntries(ESTADOS_ORDEN.map(k => [k, true])))

  const btnBase = { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, border: '1px solid #E3E5EC', background: '#fff', cursor: 'pointer', color: '#384152', fontSize: 14, fontWeight: 600, transition: 'border-color .12s' }

  if (loading) return <LoadingState />

  const totalW = nDays * colW

  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8EF', borderRadius: 16, overflow: 'hidden', margin: '0 auto' }}>

      {/* Título */}
      <div style={{ padding: '22px 26px 18px' }}>
        <span style={{ fontFamily: "'Lora',serif", fontWeight: 600, fontSize: 31, color: '#1B2433', letterSpacing: '-.01em' }}>
          Encargos (Vista Cronograma)
        </span>
        <div style={{ fontSize: 13.5, color: '#7B8496', marginTop: 6, fontWeight: 500 }}>
          Visualiza la planificación de todos los encargos en una línea de tiempo para identificar solapamientos y fechas clave.
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '0 26px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Nav prev/hoy/next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setPanDays(v => v - step)} style={{ ...btnBase, width: 36, height: 36 }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#cfd3dc'} onMouseOut={e => e.currentTarget.style.borderColor = '#E3E5EC'}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M6 1.5 3 4.5 6 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => setPanDays(0)} style={{ ...btnBase, height: 36, padding: '0 16px' }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#cfd3dc'} onMouseOut={e => e.currentTarget.style.borderColor = '#E3E5EC'}>
            Hoy
          </button>
          <button onClick={() => setPanDays(v => v + step)} style={{ ...btnBase, width: 36, height: 36 }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#cfd3dc'} onMouseOut={e => e.currentTarget.style.borderColor = '#E3E5EC'}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M3 1.5 6 4.5 3 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        {/* Rango */}
        <div style={{ ...btnBase, cursor: 'default', height: 36, padding: '0 14px', gap: 10, whiteSpace: 'nowrap' }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ color: '#7B8496' }}>
            <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M1.5 6h13M5 1.3v2.4M11 1.3v2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {rangeLabel}
        </div>

        <div style={{ flex: 1 }} />

        {/* Estado dropdown */}
        <div ref={filterRef} style={{ position: 'relative' }}>
          <button onClick={() => setFiltersOpen(v => !v)}
            style={{ ...btnBase, height: 36, padding: '0 15px', gap: 8 }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#cfd3dc'} onMouseOut={e => e.currentTarget.style.borderColor = '#E3E5EC'}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M1.6 3.2h11.8M3.6 7.5h7.8M6 11.8h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Estado
            {filtersActive && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1FB39A' }} />}
          </button>
          {filtersOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 7px)', right: 0, width: 230, background: '#fff', border: '1px solid #E8E8EF', borderRadius: 13, boxShadow: '0 16px 40px rgba(12,26,44,.16)', padding: 14, zIndex: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#7B8496', textTransform: 'uppercase', marginBottom: 9 }}>Estado</div>
              {ESTADOS_ORDEN.map(k => (
                <button key={k} onClick={e => { e.stopPropagation(); toggleEstado(k) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: '7px 6px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#384152', textAlign: 'left' }}
                  onMouseOver={e => e.currentTarget.style.background = '#F6F6FA'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  {estadosFiltro[k]
                    ? <span style={{ width: 19, height: 19, borderRadius: 6, background: '#1FB39A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>✓</span>
                    : <span style={{ width: 19, height: 19, borderRadius: 6, border: '1.6px solid #cfd3dc', background: '#fff', flexShrink: 0 }} />
                  }
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: COL_COLOR[k], flexShrink: 0 }} />
                  {ESTADO_LABELS[k]}
                </button>
              ))}
              <div style={{ borderTop: '1px solid #EFEFF3', marginTop: 11, paddingTop: 11 }}>
                <button onClick={e => { e.stopPropagation(); resetFilters() }}
                  style={{ width: '100%', border: '1px solid #E3E5EC', background: '#fff', cursor: 'pointer', padding: 8, borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: '#7B8496' }}
                  onMouseOver={e => e.currentTarget.style.background = '#F6F6FA'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                  Mostrar todos
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ borderTop: '1px solid #EEEFF3', overflowX: 'auto' }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>

          {/* LEFT STICKY TABLE */}
          <div style={{ flexShrink: 0, borderRight: '1px solid #E8E8EF', position: 'sticky', left: 0, zIndex: 10, background: '#fff', boxShadow: '6px 0 12px -8px rgba(12,26,44,.18)' }}>
            {/* Header */}
            <div style={{ height: 56, display: 'flex', alignItems: 'flex-end', paddingBottom: 9, borderBottom: '1px solid #EEEFF3' }}>
              <div style={{ width: 138, paddingLeft: 24, fontSize: 12, fontWeight: 700, color: '#7B8496' }}>Nº Encargo</div>
              <div style={{ width: 148, fontSize: 12, fontWeight: 700, color: '#7B8496' }}>Cliente</div>
              <div style={{ width: 140, fontSize: 12, fontWeight: 700, color: '#7B8496' }}>Estado</div>
            </div>
            {/* Rows */}
            {rows.length === 0 ? (
              <div style={{ height: 38, display: 'flex', alignItems: 'center', paddingLeft: 24, fontSize: 13, color: '#AAB0BD' }}>
                Sin encargos
              </div>
            ) : rows.map(r => (
              <div
                key={r.id}
                style={{ height: 38, display: 'flex', alignItems: 'center', borderBottom: '1px solid #F2F3F6', cursor: 'pointer' }}
                onClick={() => navigate(`/encargos/${r.id}`)}
              >
                <div style={{ width: 138, paddingLeft: 24, fontSize: 13, fontWeight: 700, color: '#1B2433', fontVariantNumeric: 'tabular-nums', letterSpacing: '.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatNumeroEncargo(r.numero)}</div>
                <div style={{ width: 148, fontSize: 13, fontWeight: 500, color: '#384152', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>{r.nombreCliente}</div>
                <div style={{ width: 140 }}><Badge estado={r.estado} className="whitespace-nowrap" /></div>
              </div>
            ))}
          </div>

          {/* TIMELINE AREA */}
          <div style={{ position: 'relative', width: totalW, flexShrink: 0 }}>

            {/* Cabecera: meses (26px) + días (30px) */}
            <div style={{ height: 56, borderBottom: '1px solid #EEEFF3' }}>
              {/* Meses */}
              <div style={{ display: 'flex', height: 26 }}>
                {months.map((m, i) => (
                  <div key={i} style={{ width: m.count * colW, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', color: '#7B8496', borderRight: '1px solid #EEEFF3', flexShrink: 0 }}>
                    {m.label}
                  </div>
                ))}
              </div>
              {/* Días */}
              <div style={{ display: 'flex', height: 30 }}>
                {days.map((d, i) => (
                  <div key={i} style={{ width: colW, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: colW < 30 ? 10.5 : 12, fontWeight: 600, color: d.weekend ? '#AAB0BD' : '#5E6878', background: d.weekend ? '#F5F6F9' : '#fff', fontVariantNumeric: 'tabular-nums' }}>
                    {d.num}
                  </div>
                ))}
              </div>
            </div>

            {/* Cuerpo */}
            <div style={{ position: 'relative' }}>
              {/* Línea Hoy */}
              {hoyIdx >= 0 && hoyIdx < nDays && (
                <>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: hoyX, borderLeft: '2px dashed #E5352B', zIndex: 5, pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: -1, left: hoyX, transform: 'translateX(-50%)', background: '#E5352B', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 6, zIndex: 6, boxShadow: '0 2px 6px rgba(229,53,43,.32)', pointerEvents: 'none' }}>
                    Hoy
                  </div>
                </>
              )}

              {/* Filas */}
              {rows.length === 0 ? (
                <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              ) : rows.map(r => (
                <div
                  key={r.id}
                  style={{ position: 'relative', height: 38, borderBottom: '1px solid #F2F3F6', cursor: 'pointer' }}
                  onClick={() => navigate(`/encargos/${r.id}`)}
                >
                  {/* Fondos weekend */}
                  {days.map((d, i) => d.weekend && (
                    <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * colW, width: colW, background: '#F5F6F9', borderRight: '1px solid #F2F3F6' }} />
                  ))}
                  {/* Grid vertical (días no-weekend) */}
                  {days.map((d, i) => !d.weekend && (
                    <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: (i + 1) * colW - 1, width: 1, background: '#F2F3F6' }} />
                  ))}

                  {/* Línea horizontal coloreada */}
                  {r.startX !== null && r.endX !== null && (
                    <span style={{ position: 'absolute', top: '50%', left: r.startX, width: r.lineW, height: 2, transform: 'translateY(-50%)', background: r.color, borderRadius: 2 }} />
                  )}
                  {/* Nodo inicio */}
                  {r.startX !== null && (
                    <span style={{ position: 'absolute', top: '50%', left: r.startX, transform: 'translate(-50%,-50%)', width: 11, height: 11, borderRadius: '50%', border: `2px solid ${r.color}`, background: '#fff', boxSizing: 'border-box' }} />
                  )}
                  {/* Nodo fin */}
                  {r.endX !== null && (
                    <span style={{ position: 'absolute', top: '50%', left: r.endX, transform: 'translate(-50%,-50%)', width: 11, height: 11, borderRadius: '50%', border: `2px solid ${r.color}`, background: '#fff', boxSizing: 'border-box' }} />
                  )}
                  {/* Triángulo aviso (-7d) apuntando arriba */}
                  {r.avisoX !== null && (
                    <span style={{ position: 'absolute', top: '50%', left: r.avisoX, transform: 'translate(-50%,-50%)', zIndex: 3 }}>
                      <svg width="17" height="15" viewBox="0 0 17 15" style={{ display: 'block' }}>
                        <path d="M8.5 1.4 L15.7 13.4 L1.3 13.4 Z" fill="#F6A623" stroke="#E08E12" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, padding: 18, borderTop: '1px solid #EEEFF3', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#5E6878' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #9AA1B0', background: '#fff', boxSizing: 'border-box', display: 'inline-block' }} />
          Inicio programado
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#5E6878' }}>
          <svg width="16" height="14" viewBox="0 0 17 15" style={{ display: 'block' }}>
            <path d="M8.5 1.4 L15.7 13.4 L1.3 13.4 Z" fill="#F6A623" stroke="#E08E12" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          Aviso -7 días
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#5E6878' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #9AA1B0', background: '#fff', boxSizing: 'border-box', display: 'inline-block' }} />
          Fin programada
        </span>
      </div>

      {rows.length === 0 && !loading && (
        <div style={{ padding: '20px 26px' }}>
          <EmptyState titulo="Sin encargos para mostrar." />
        </div>
      )}
    </div>
  )
}
