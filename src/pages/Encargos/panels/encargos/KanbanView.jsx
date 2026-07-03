import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, FileText } from 'lucide-react'
import { actualizarEstado, eliminarEncargo, fetchEncargo } from '@/hooks/useEncargos'
import { ESTADO_LABELS } from '@/utils/formatters'
import { formatFechaCorta, formatImporte, formatNumeroEncargo } from '@/utils/formatters'
import SearchInput from '@/components/ui/SearchInput'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { generarPresupuestoPDF, generarFacturaPDF } from '@/utils/pdfGenerator'

const ESTADOS_ORDEN = ['presupuestado', 'confirmado', 'en_confeccion', 'listo', 'entregado']

const COL_STYLES = {
  presupuestado: { ink: '#5E6878', accent: '#7B8496', soft: '#F0F1F4', borderCol: '#DDE0E7', pillBg: '#EFF1F4' },
  confirmado:    { ink: '#5E48A8', accent: '#7559C2', soft: '#F1ECFB', borderCol: '#DCD0F2', pillBg: '#EFEAFB' },
  en_confeccion: { ink: '#2F5AA0', accent: '#3D6BB3', soft: '#EAF1FC', borderCol: '#CFE0F5', pillBg: '#E8F0FB' },
  listo:         { ink: '#8A6228', accent: '#B07D33', soft: '#F7F0E1', borderCol: '#E5D4AD', pillBg: '#F6EEDD' },
  entregado:     { ink: '#0F7A4A', accent: '#2E9D5B', soft: '#E9F5EE', borderCol: '#C6E4D2', pillBg: '#E6F4EC' },
}

function parseISO(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtShort(s) {
  if (!s) return ''
  const [y, m, d] = s.split('-').map(Number)
  return String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0')
}

function calcTimeline(fechaInicio, fechaFin, entregado) {
  if (!fechaInicio) return null
  const t0 = parseISO(fechaInicio).getTime()
  const now = Date.now()
  if (entregado) {
    return { pct: 100, label: 'Entregado', todayColor: '#2E9D5B', todayStroke: '#1F7A43', finColor: '#7B8496', overdue: false }
  }
  if (!fechaFin) return null
  const t1 = parseISO(fechaFin).getTime()
  let pct = t1 <= t0 ? 1 : (now - t0) / (t1 - t0)
  if (pct < 0) pct = 0
  if (pct > 1) pct = 1
  const daysLeft = Math.round((t1 - now) / 86400000)
  const overdue = daysLeft < 0
  const warn = !overdue && daysLeft < 7
  let todayColor, todayStroke, finColor, label
  if (overdue) {
    todayColor = '#D63A33'; todayStroke = '#A82A24'; finColor = '#D63A33'
    label = daysLeft === 0 ? 'Vence hoy' : 'Fuera de plazo'
  } else if (warn) {
    todayColor = '#C8902E'; todayStroke = '#9A6E1F'; finColor = '#C8902E'
    label = daysLeft === 1 ? 'Hoy · falta 1 día' : `Hoy · faltan ${daysLeft} días`
  } else {
    todayColor = '#5A6373'; todayStroke = '#454D5C'; finColor = '#7B8496'
    label = 'Hoy · ' + fmtShort(new Date().toISOString().split('T')[0])
  }
  return { pct: pct * 100, label, todayColor, todayStroke, finColor, overdue }
}

// ── Timeline visual ──────────────────────────────────────────────────────────

function TimelineCard({ encargo }) {
  const tl = calcTimeline(encargo.fecha_encargo, encargo.fecha_entrega_estimada, encargo.estado === 'entregado')
  if (!tl) return null
  return (
    <div style={{ marginTop: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.01em', color: tl.todayColor }}>
          {tl.label}
        </span>
      </div>
      <div style={{ position: 'relative', height: 15 }}>
        <span style={{ position: 'absolute', left: 5, right: 5, top: 11, height: 2, borderRadius: 2, background: '#A7ACB7' }} />
        <span style={{ position: 'absolute', left: 0, top: 6, width: 11, height: 11, borderRadius: '50%', border: '2.4px solid #A7ACB7', background: '#fff', boxSizing: 'border-box' }} />
        <span style={{ position: 'absolute', right: 0, top: 6, width: 11, height: 11, borderRadius: '50%', border: '2.4px solid #A7ACB7', background: '#fff', boxSizing: 'border-box' }} />
        <span style={{ position: 'absolute', top: 0, left: `${tl.pct}%`, transform: 'translateX(-50%)' }}>
          <svg width="14" height="12" viewBox="0 0 17 15" style={{ display: 'block' }}>
            <path d="M1.3 1.4 L15.7 1.4 L8.5 13.4 Z" fill={tl.todayColor} stroke={tl.todayStroke} strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ color: '#9098a8', fontWeight: 600 }}>{formatFechaCorta(encargo.fecha_encargo)}</span>
        <span style={{ color: tl.finColor, fontWeight: 700 }}>{formatFechaCorta(encargo.fecha_entrega_estimada)}</span>
      </div>
    </div>
  )
}

// ── Menú 3 puntos ────────────────────────────────────────────────────────────

function MenuTarjeta({ encargo, onCambiarEstado, onEliminar, onVer }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('menu')
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) { setOpen(false); setMode('menu') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const s = COL_STYLES[encargo.estado]

  const btnBase = { display: 'flex', alignItems: 'center', gap: 11, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: '9px 11px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#384152', textAlign: 'left', transition: 'background .12s' }

  return (
    <div ref={menuRef} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => { setOpen(v => !v); setMode('menu') }}
        style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid transparent', background: 'transparent', cursor: 'pointer', color: '#9098a8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
        onMouseOver={e => { e.currentTarget.style.background = '#F3F3F7'; e.currentTarget.style.borderColor = '#E8E8EF' }}
        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
      >
        <svg width="4" height="15" viewBox="0 0 4 16" fill="currentColor">
          <circle cx="2" cy="2" r="1.7" /><circle cx="2" cy="8" r="1.7" /><circle cx="2" cy="14" r="1.7" />
        </svg>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 200, background: '#fff', border: '1px solid #E8E8EF', borderRadius: 13, boxShadow: '0 16px 36px rgba(12,26,44,.18)', padding: 6, zIndex: 70, animation: 'kanban-popin .14s ease' }}>

          {mode === 'menu' && <>
            <button style={btnBase} onClick={() => { setOpen(false); setMode('menu'); onVer() }}
              onMouseOver={e => e.currentTarget.style.background = '#F3F3F7'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#7B8496' }}><path d="M1 8s2.6-4.5 7-4.5S15 8 15 8s-2.6 4.5-7 4.5S1 8 1 8Z" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.4" /></svg>
              Ver detalle
            </button>
            <button style={btnBase} onClick={() => setMode('status')}
              onMouseOver={e => e.currentTarget.style.background = '#F3F3F7'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#7B8496' }}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" /><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              Cambiar estado
            </button>
            <div style={{ height: 1, background: '#EFEFF3', margin: '5px 7px' }} />
            <button style={{ ...btnBase, color: '#B53E56' }} onClick={() => setMode('confirm')}
              onMouseOver={e => e.currentTarget.style.background = '#FAE9EC'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.6 9.5h6.8L12 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Eliminar
            </button>
          </>}

          {mode === 'status' && <>
            <button style={{ ...btnBase, fontSize: 11, fontWeight: 800, color: '#AAB0BD', letterSpacing: '.06em', textTransform: 'uppercase', padding: '7px 9px 9px', gap: 8 }}
              onClick={() => setMode('menu')}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M6 1.5 3 4.5 6 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Cambiar estado
            </button>
            {ESTADOS_ORDEN.map(est => {
              const sc = COL_STYLES[est]
              const activo = encargo.estado === est
              return (
                <button key={est} style={{ ...btnBase, justifyContent: 'space-between' }}
                  onClick={() => { setOpen(false); setMode('menu'); if (!activo) onCambiarEstado(encargo.id, est) }}
                  onMouseOver={e => e.currentTarget.style.background = '#F3F3F7'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: sc.accent, flexShrink: 0 }} />
                    {ESTADO_LABELS[est]}
                  </span>
                  {activo && <span style={{ color: '#1FB39A', fontWeight: 800 }}>✓</span>}
                </button>
              )
            })}
          </>}

          {mode === 'confirm' && (
            <div style={{ padding: '8px 9px' }}>
              <div style={{ fontSize: 13.5, color: '#384152', fontWeight: 600, marginBottom: 11, lineHeight: 1.4 }}>
                ¿Eliminar <b>{formatNumeroEncargo(encargo.numero)}</b>?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, border: '1px solid #E3E5EC', background: '#fff', cursor: 'pointer', padding: 8, borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: '#7B8496' }}
                  onClick={() => setMode('menu')}>Cancelar</button>
                <button style={{ flex: 1, border: 'none', background: '#B53E56', color: '#fff', cursor: 'pointer', padding: 8, borderRadius: 8, fontSize: 13.5, fontWeight: 700 }}
                  onClick={() => { setOpen(false); setMode('menu'); onEliminar(encargo.id, encargo.numero) }}>Eliminar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tarjeta individual ───────────────────────────────────────────────────────

function TarjetaEncargo({ encargo, onCambiarEstado, onEliminar, dragId, flashId }) {
  const navigate = useNavigate()
  const cardRef = useRef(null)
  const s = COL_STYLES[encargo.estado]
  const nombreCliente = encargo.clientes
    ? `${encargo.clientes.nombre} ${encargo.clientes.apellidos ?? ''}`.trim()
    : 'Sin cliente'
  const nPrendas = encargo.encargo_lineas?.length ?? 0
  const tl = calcTimeline(encargo.fecha_encargo, encargo.fecha_entrega_estimada, encargo.estado === 'entregado')
  const overdue = tl?.overdue ?? false
  const isDragging = dragId === encargo.id
  const isFlash = flashId === encargo.id

  const animStyle = isFlash
    ? { animation: 'kanban-flash .85s ease-in-out infinite' }
    : overdue
      ? { animation: 'kanban-overdue 1.4s ease-in-out infinite' }
      : { boxShadow: '0 1px 2px rgba(12,26,44,.05)' }

  return (
    <div
      ref={cardRef}
      data-encargo-id={encargo.id}
      style={{
        position: 'relative',
        background: '#fff',
        border: '1px solid #E8E8EF',
        borderRadius: 12,
        padding: '14px 15px',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        opacity: isDragging ? 0.4 : 1,
        transition: 'box-shadow .16s, opacity .16s, border-color .16s',
        ...animStyle,
      }}
      onPointerDown={e => {
        if (e.button !== 0) return
        if (e.target.closest('[data-keepopen]')) return
        const startX = e.clientX, startY = e.clientY
        const rect = cardRef.current.getBoundingClientRect()
        const offX = startX - rect.left, offY = startY - rect.top
        const width = rect.width
        let started = false, clone = null
        const accent = s.accent

        const onMove = ev => {
          const dx = ev.clientX - startX, dy = ev.clientY - startY
          if (!started) {
            if (Math.abs(dx) + Math.abs(dy) < 5) return
            started = true
            clone = cardRef.current.cloneNode(true)
            clone.style.cssText = `position:fixed;z-index:9999;left:${ev.clientX - offX}px;top:${ev.clientY - offY}px;width:${width}px;margin:0;opacity:1;pointer-events:none;transform:rotate(-1.5deg);box-shadow:0 18px 38px rgba(12,26,44,.26);border-color:${accent};border-radius:12px;border:1.5px solid ${accent};background:#fff;padding:14px 15px;`
            document.body.appendChild(clone)
            document.body.style.cursor = 'grabbing'
            document.body.style.userSelect = 'none'
            onCambiarEstado('__drag_start__', encargo.id)
          }
          clone.style.left = (ev.clientX - offX) + 'px'
          clone.style.top = (ev.clientY - offY) + 'px'
          clone.style.display = 'none'
          const under = document.elementFromPoint(ev.clientX, ev.clientY)
          clone.style.display = ''
          const colEl = under?.closest('[data-col-status]')
          const key = colEl?.getAttribute('data-col-status') ?? null
          onCambiarEstado('__drag_over__', key)
        }

        const onUp = ev => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          document.body.style.cursor = ''
          document.body.style.userSelect = ''
          if (clone) { try { clone.remove() } catch (_) {} }
          if (started) {
            onCambiarEstado('__drag_end__', encargo.id)
          }
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      }}
      onClick={() => navigate(`/encargos/${encargo.id}`)}
    >
      <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1B2433', letterSpacing: '.01em', fontVariantNumeric: 'tabular-nums' }}>
        {formatNumeroEncargo(encargo.numero)}
      </div>
      <div style={{ fontFamily: "'Lora',serif", fontWeight: 600, fontSize: 16.5, color: '#1B2433', marginTop: 3, lineHeight: 1.18 }}>
        {nombreCliente}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginTop: 9 }}>
        <span style={{ fontSize: 13, color: '#7B8496', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {nPrendas} {nPrendas === 1 ? 'prenda' : 'prendas'}
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1B2433', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>
          {formatImporte(encargo.precio_total)}
        </span>
      </div>

      <TimelineCard encargo={encargo} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: s.pillBg, color: s.ink }}>
          {ESTADO_LABELS[encargo.estado]}
        </span>
        <div data-keepopen="">
          <MenuTarjeta
            encargo={encargo}
            onCambiarEstado={onCambiarEstado}
            onEliminar={onEliminar}
            onVer={() => navigate(`/encargos/${encargo.id}`)}
          />
        </div>
      </div>
    </div>
  )
}

// ── Columna ──────────────────────────────────────────────────────────────────

function Columna({ estado, encargos, dragOverCol, onCambiarEstado, onEliminar, dragId, flashId }) {
  const s = COL_STYLES[estado]
  const isDragOver = dragOverCol === estado

  return (
    <div
      data-col-status={estado}
      style={{
        borderTop: `3px solid ${s.accent}`,
        borderLeft: `1.5px ${isDragOver ? 'dashed' : 'solid'} ${s.borderCol}`,
        borderRight: `1.5px ${isDragOver ? 'dashed' : 'solid'} ${s.borderCol}`,
        borderBottom: `1.5px ${isDragOver ? 'dashed' : 'solid'} ${s.borderCol}`,
        borderRadius: 14,
        minHeight: 420,
        background: isDragOver ? s.soft : '#F9FAFB',
        transition: 'background .15s, border-color .15s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '14px 16px 12px', background: `linear-gradient(180deg, ${s.soft} 0%, rgba(255,255,255,0) 100%)`, borderRadius: '11px 11px 0 0', display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: s.ink }}>{ESTADO_LABELS[estado]}</span>
        <span style={{ minWidth: 22, height: 22, padding: '0 7px', borderRadius: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, background: '#fff', color: s.ink, border: `1px solid ${s.borderCol}`, fontVariantNumeric: 'tabular-nums' }}>
          {encargos.length}
        </span>
      </div>

      <div style={{ padding: '6px 12px 14px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
        {encargos.length === 0 ? (
          <div style={{ border: '1.5px dashed #d8dbe3', borderRadius: 11, padding: '26px 12px', textAlign: 'center', fontSize: 12.5, color: '#AAB0BD', fontWeight: 600 }}>
            Sin encargos
          </div>
        ) : (
          encargos.map(enc => (
            <TarjetaEncargo
              key={enc.id}
              encargo={enc}
              onCambiarEstado={onCambiarEstado}
              onEliminar={onEliminar}
              dragId={dragId}
              flashId={flashId}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Vista Kanban principal ───────────────────────────────────────────────────

const cargarFiscal = () =>
  supabase.from('datos_fiscales').select('*').limit(1).maybeSingle().then(r => r.data)

export default function KanbanView({ encargos, loading, verEntregados, setVerEntregados, onRecargar }) {
  const toast = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [listaLocal, setListaLocal] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const dragOverColRef = useRef(null)
  const [flashId, setFlashId] = useState(null)
  const flashTimerRef = useRef(null)
  const [modalSenal, setModalSenal] = useState(null)
  const [modalCobro, setModalCobro] = useState(null)
  const [modalPdf, setModalPdf] = useState(null)
  const pendingAccionRef = useRef(null)
  const ejecutarRef = useRef(null)
  ejecutarRef.current = (id, nuevoEstado) => {
    const prevState = listaLocal ?? encargos
    const estadoActual = prevState.find(e => e.id === id)?.estado
    const avanzando = ESTADOS_ORDEN.indexOf(nuevoEstado) > ESTADOS_ORDEN.indexOf(estadoActual)
    setListaLocal(prevState.map(e => e.id === id ? { ...e, estado: nuevoEstado } : e))
    clearTimeout(flashTimerRef.current)
    setFlashId(id)
    flashTimerRef.current = setTimeout(() => setFlashId(null), 5000)
    if (avanzando && nuevoEstado === 'confirmado') setModalPdf({ tipo: 'presupuesto', encargoId: id })
    if (avanzando && nuevoEstado === 'entregado') setModalPdf({ tipo: 'factura', encargoId: id })
    actualizarEstado(id, nuevoEstado)
      .then(() => toast.success(`Estado actualizado a "${ESTADO_LABELS[nuevoEstado]}"`))
      .catch(() => { setListaLocal(null); setFlashId(null); toast.error('No se pudo cambiar el estado.') })
  }

  const lista = listaLocal ?? encargos

  const filtrados = lista.filter(e => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    const nombre = `${e.clientes?.nombre ?? ''} ${e.clientes?.apellidos ?? ''}`.toLowerCase()
    return nombre.includes(q) || (e.numero ?? '').toLowerCase().includes(q)
  })

  const porEstado = Object.fromEntries(
    ESTADOS_ORDEN.map(est => [
      est,
      filtrados
        .filter(e => e.estado === est)
        .sort((a, b) => {
          const fa = a.fecha_entrega_estimada, fb = b.fecha_entrega_estimada
          if (!fa && !fb) return 0; if (!fa) return 1; if (!fb) return -1
          return fa.localeCompare(fb)
        }),
    ])
  )

  const columnas = verEntregados ? ESTADOS_ORDEN : ESTADOS_ORDEN.filter(e => e !== 'entregado')

  // Handler unificado para drag (señales internas) y cambio de estado (menú)
  const handleCambiarEstado = useCallback(async (accion, payload) => {
    if (accion === '__drag_start__') { setDragId(payload); return }
    if (accion === '__drag_over__') { dragOverColRef.current = payload; setDragOverCol(payload); return }

    let id, nuevoEstado
    if (accion === '__drag_end__') {
      id = payload
      nuevoEstado = dragOverColRef.current
      setDragId(null); dragOverColRef.current = null; setDragOverCol(null)
      if (!nuevoEstado) return
    } else {
      id = accion; nuevoEstado = payload
    }

    const enc = (listaLocal ?? encargos).find(e => e.id === id)
    if (!enc || enc.estado === nuevoEstado) return

    if (nuevoEstado === 'en_confeccion') {
      const { data: pagosData } = await supabase.from('pagos').select('importe, tipo').eq('encargo_id', id)
      const cobrado = (pagosData ?? []).filter(p => p.tipo !== 'devolucion').reduce((s, p) => s + parseFloat(p.importe), 0)
      if (Math.round(cobrado * 100) < Math.round((enc.precio_total ?? 0) * 0.3 * 100)) {
        setModalSenal({ cantidadMinima: (enc.precio_total ?? 0) * 0.3 })
        return
      }
    }

    if (nuevoEstado === 'entregado') {
      const { data: pagosData } = await supabase.from('pagos').select('importe, tipo, estado').eq('encargo_id', id)
      const cobrado = (pagosData ?? []).filter(p => p.tipo !== 'devolucion' && p.estado !== 'pendiente').reduce((s, p) => s + parseFloat(p.importe), 0)
      const pendiente = Math.max(0, (enc.precio_total ?? 0) - cobrado)
      if (Math.round(pendiente * 100) > 0) {
        pendingAccionRef.current = { id, nuevoEstado }
        setModalCobro({ pendiente })
        return
      }
    }

    ejecutarRef.current(id, nuevoEstado)
  }, [listaLocal, encargos, toast])

  const handleEliminar = useCallback(async (id, numero) => {
    const prevState = listaLocal ?? encargos
    setListaLocal(prevState.filter(e => e.id !== id))
    try {
      await eliminarEncargo(id)
      toast.success(`Encargo ${numero} eliminado.`)
    } catch {
      setListaLocal(null)
      toast.error('No se pudo eliminar el encargo.')
    }
  }, [listaLocal, encargos, toast])

  useEffect(() => () => clearTimeout(flashTimerRef.current), [])

  if (loading) return <LoadingState />

  return (
    <>
      <style>{`
        @keyframes kanban-flash {
          0%,100% { box-shadow: 0 1px 2px rgba(12,26,44,.05) }
          50% { box-shadow: 0 0 0 4px rgba(31,179,154,.6), 0 8px 20px rgba(31,179,154,.18) }
        }
        @keyframes kanban-overdue {
          0%,100% { box-shadow: 0 1px 2px rgba(12,26,44,.05) }
          50% { box-shadow: 0 0 0 4px rgba(214,58,51,.45), 0 8px 20px rgba(214,58,51,.16) }
        }
        @keyframes kanban-popin {
          from { opacity: 0; transform: translateY(-5px) }
          to   { opacity: 1; transform: none }
        }
      `}</style>

      <div className="space-y-3">
        {/* Controles */}
        <div className="flex items-center gap-3">
          <div style={{ flex: '0 1 540px', minWidth: 260 }}>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por cliente, nº encargo..."
            />
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setVerEntregados(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #E3E5EC', cursor: 'pointer', background: '#fff', color: '#5E6878', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 11, whiteSpace: 'nowrap', transition: 'border-color .12s, color .12s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#C8CDD8'; e.currentTarget.style.color = '#1B2433' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#E3E5EC'; e.currentTarget.style.color = '#5E6878' }}
          >
            {verEntregados ? <EyeOff size={16} /> : <Eye size={16} />}
            {verEntregados ? 'Ocultar entregados' : 'Mostrar entregados'}
          </button>
        </div>

        {/* Tablero — grid sin scroll */}
        {filtrados.length === 0 && busqueda ? (
          <EmptyState titulo="Sin resultados para esa búsqueda." />
        ) : (
          <div
            className="grid gap-4 items-start"
            style={{ gridTemplateColumns: `repeat(${columnas.length}, 1fr)` }}
          >
            {columnas.map(est => (
              <Columna
                key={est}
                estado={est}
                encargos={porEstado[est] ?? []}
                dragOverCol={dragOverCol}
                onCambiarEstado={handleCambiarEstado}
                onEliminar={handleEliminar}
                dragId={dragId}
                flashId={flashId}
              />
            ))}
          </div>
        )}

        {filtrados.length === 0 && !busqueda && (
          <EmptyState titulo="Aún no hay encargos." />
        )}
      </div>

      {modalSenal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setModalSenal(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-display text-base text-[--text-dark]">Pago no registrado</h3>
                <p className="text-xs text-[--text-light] mt-0.5">Para confirmar el encargo es necesario que se haya pagado una reserva equivalente al 30 % del total del encargo.</p>
                <p className="text-xs text-[--text-dark] font-semibold mt-1">Cantidad a pagar: {formatImporte(modalSenal.cantidadMinima)}</p>
              </div>
            </div>
            <button onClick={() => setModalSenal(null)} className="w-full text-sm bg-[--primary] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Entendido</button>
          </div>
        </div>
      )}
      {modalCobro && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-display text-base text-[--text-dark]">Cobro pendiente</h3>
                <p className="text-xs text-[--text-light] mt-0.5">Este encargo tiene una cantidad pendiente de cobro. Si lo entregas igualmente, recuerda gestionar el cobro.</p>
                <p className="text-xs text-[--text-dark] font-semibold mt-1">Pendiente: {formatImporte(modalCobro.pendiente)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { const a = pendingAccionRef.current; setModalCobro(null); pendingAccionRef.current = null; if (a) ejecutarRef.current(a.id, a.nuevoEstado) }}
                className="flex-1 text-sm bg-[--primary] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              >Aceptar</button>
              <button onClick={() => { setModalCobro(null); pendingAccionRef.current = null }} className="flex-1 text-sm border border-[--border] text-[--text-medium] px-4 py-2 rounded-md hover:bg-[--bg-alt] transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {modalPdf && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display text-base text-[--text-dark]">{modalPdf.tipo === 'presupuesto' ? 'Descargar presupuesto' : 'Descargar factura'}</h3>
                <p className="text-xs text-[--text-light]">{modalPdf.tipo === 'presupuesto' ? 'El encargo ha sido confirmado.' : 'El encargo ha sido entregado.'}{' '}¿Quieres descargar el PDF ahora?</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setModalPdf(null)} className="flex-1 text-sm border border-[--border] px-4 py-2 rounded-md text-[--text-medium] hover:bg-[--bg-alt] transition-colors">Ahora no</button>
              <button
                onClick={async () => {
                  const { tipo, encargoId } = modalPdf
                  setModalPdf(null)
                  const enc = await fetchEncargo(encargoId)
                  const fiscal = await cargarFiscal()
                  if (tipo === 'presupuesto') await generarPresupuestoPDF(enc, fiscal)
                  else await generarFacturaPDF(enc, fiscal)
                }}
                className="flex-1 text-sm bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
              >Descargar PDF</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
