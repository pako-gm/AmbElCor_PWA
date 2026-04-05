import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Share2, FileText, Copy, Check,
  ChevronRight, Trash2, PlusCircle
} from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchEncargo, avanzarEstado, registrarPago, eliminarPago } from '@/hooks/useEncargos'
import { supabase } from '@/lib/supabase'
import { generarPresupuestoPDF, generarFacturaPDF } from '@/utils/pdfGenerator'
import {
  formatFecha, formatImporte,
  ESTADO_LABELS, ESTADO_COLORS,
  TIPO_PAGO_LABELS, FORMA_PAGO_LABELS
} from '@/utils/formatters'

const ESTADOS = ['presupuestado', 'confirmado', 'en_confeccion', 'listo', 'entregado']

const TIPOS_PAGO = ['señal', 'parcial', 'final', 'devolucion']
const FORMAS_PAGO = ['efectivo', 'transferencia', 'tarjeta']

export default function EncargoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [encargo, setEncargo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avanzando, setAvanzando] = useState(false)

  // Modal compartir
  const [modalCompartir, setModalCompartir] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Formulario pago
  const [mostrarFormPago, setMostrarFormPago] = useState(false)
  const [pago, setPago] = useState({ fecha: new Date().toISOString().split('T')[0], importe: '', tipo: 'señal', forma_pago: 'efectivo', referencia: '', notas: '' })
  const [guardandoPago, setGuardandoPago] = useState(false)

  const cargar = () => {
    setLoading(true)
    fetchEncargo(id).then(setEncargo).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(cargar, [id])

  if (loading) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Cargando…</div></PageWrapper>
  if (!encargo) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Encargo no encontrado.</div></PageWrapper>

  const estadoActual = ESTADOS.indexOf(encargo.estado)
  const siguienteEstado = estadoActual < ESTADOS.length - 1 ? ESTADOS[estadoActual + 1] : null
  const nombreCliente = encargo.clientes
    ? `${encargo.clientes.nombre} ${encargo.clientes.apellidos ?? ''}`.trim()
    : 'Sin cliente'

  const handleAvanzar = async () => {
    if (!siguienteEstado) return
    setAvanzando(true)
    try {
      await avanzarEstado(id, encargo.estado, siguienteEstado)
      // Auto-generar PDF al confirmar o al entregar
      if (siguienteEstado === 'confirmado') {
        const actualizado = await fetchEncargo(id)
        generarPresupuestoPDF(actualizado)
      }
      if (siguienteEstado === 'entregado') {
        const actualizado = await fetchEncargo(id)
        const { data: fiscal } = await supabase.from('datos_fiscales').select('*').limit(1).single()
        generarFacturaPDF(actualizado, fiscal)
      }
      cargar()
    } catch (e) {
      console.error(e)
    } finally {
      setAvanzando(false)
    }
  }

  const handleCopiarEnlace = () => {
    const url = `${window.location.origin}/seguimiento/${encargo.token_publico}`
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const handleRegistrarPago = async () => {
    if (!pago.importe || parseFloat(pago.importe) <= 0) return
    setGuardandoPago(true)
    try {
      await registrarPago({ ...pago, encargo_id: id })
      setPago({ fecha: new Date().toISOString().split('T')[0], importe: '', tipo: 'señal', forma_pago: 'efectivo', referencia: '', notas: '' })
      setMostrarFormPago(false)
      cargar()
    } catch (e) {
      console.error(e)
    } finally {
      setGuardandoPago(false)
    }
  }

  const handleEliminarPago = async (pagoId) => {
    if (!confirm('¿Eliminar este pago?')) return
    await eliminarPago(pagoId)
    cargar()
  }

  const totalPagado = (encargo.pagos ?? []).reduce((s, p) => s + parseFloat(p.importe), 0)
  const pendiente = (encargo.precio_total ?? 0) - totalPagado

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/encargos')} className="text-[--text-light] hover:text-[--text-dark]">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <p className="text-xs text-[--text-light]">{encargo.numero}</p>
            <h1 className="font-display text-xl text-[--text-dark]">{nombreCliente}</h1>
          </div>
          <button
            onClick={() => setModalCompartir(true)}
            className="flex items-center gap-1.5 text-xs border border-[--border] px-3 py-1.5 rounded-md text-[--text-medium] hover:border-primary hover:text-primary transition-colors"
          >
            <Share2 size={13} />
            Compartir
          </button>
        </div>

        {/* Estado + Timeline */}
        <div className="bg-white rounded-lg border border-[--border] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLORS[encargo.estado]}`}>
              {ESTADO_LABELS[encargo.estado]}
            </span>
            {encargo.fecha_entrega_estimada && (
              <span className="text-xs text-[--text-light]">
                Entrega: {formatFecha(encargo.fecha_entrega_estimada)}
              </span>
            )}
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center">
              {ESTADOS.map((estado, i) => (
                <div key={estado} className="flex items-center flex-1">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 transition-colors ${
                    i < estadoActual ? 'bg-primary border-primary' :
                    i === estadoActual ? 'bg-white border-primary' : 'bg-white border-[--border]'
                  }`} />
                  {i < ESTADOS.length - 1 && (
                    <div className={`h-0.5 flex-1 ${i < estadoActual ? 'bg-primary' : 'bg-[--border]'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex mt-1.5">
              {ESTADOS.map(estado => (
                <span key={estado} className={`flex-1 text-[9px] text-center leading-tight ${
                  estado === encargo.estado ? 'text-primary font-semibold' : 'text-[--text-light]'
                }`}>
                  {ESTADO_LABELS[estado]}
                </span>
              ))}
            </div>
          </div>

          {/* Botón avanzar */}
          {siguienteEstado && (
            <button
              onClick={handleAvanzar}
              disabled={avanzando}
              className="flex items-center gap-2 text-sm bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={15} />
              {avanzando ? 'Avanzando…' : `Marcar como "${ESTADO_LABELS[siguienteEstado]}"`}
            </button>
          )}
        </div>

        {/* PDFs manuales */}
        {estadoActual >= 1 && (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const e = await fetchEncargo(id)
                generarPresupuestoPDF(e)
              }}
              className="flex items-center gap-1.5 text-xs border border-[--border] px-3 py-2 rounded-md text-[--text-medium] hover:border-primary hover:text-primary bg-white transition-colors"
            >
              <FileText size={13} />
              Presupuesto PDF
            </button>
            {estadoActual >= 4 && (
              <button
                onClick={async () => {
                  const e = await fetchEncargo(id)
                  const { data: fiscal } = await supabase.from('datos_fiscales').select('*').limit(1).maybeSingle()
                  generarFacturaPDF(e, fiscal)
                }}
                className="flex items-center gap-1.5 text-xs border border-[--border] px-3 py-2 rounded-md text-[--text-medium] hover:border-primary hover:text-primary bg-white transition-colors"
              >
                <FileText size={13} />
                Factura PDF
              </button>
            )}
          </div>
        )}

        {/* Prendas */}
        <div className="bg-white rounded-lg border border-[--border] p-4 space-y-2">
          <h2 className="text-sm font-semibold text-[--text-medium] mb-3">
            Prendas ({encargo.encargo_lineas?.length ?? 0})
          </h2>
          {encargo.encargo_lineas?.map(l => (
            <div key={l.id} className="flex justify-between items-start py-2 border-b border-[--border] last:border-0">
              <div>
                <p className="text-sm text-[--text-dark]">
                  {l.descripcion || l.prendas_catalogo?.nombre || '—'}
                  {l.cantidad > 1 && <span className="text-[--text-light] ml-1">×{l.cantidad}</span>}
                </p>
                {l.medidas_ajuste?.notas && (
                  <p className="text-xs text-[--text-light] mt-0.5">{l.medidas_ajuste.notas}</p>
                )}
                {l.notas && <p className="text-xs text-[--text-light] italic">{l.notas}</p>}
              </div>
              <span className="text-sm font-medium text-[--text-dark] ml-4 flex-shrink-0">
                {formatImporte((parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1))}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-semibold text-primary">{formatImporte(encargo.precio_total)}</span>
          </div>
        </div>

        {/* Pagos */}
        <div className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[--text-medium]">Pagos</h2>
            <button
              onClick={() => setMostrarFormPago(v => !v)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark"
            >
              <PlusCircle size={13} />
              Registrar
            </button>
          </div>

          {/* Resumen importes */}
          <div className="flex gap-4 text-xs">
            <div>
              <p className="text-[--text-light]">Cobrado</p>
              <p className="font-semibold text-green-700">{formatImporte(totalPagado)}</p>
            </div>
            <div>
              <p className="text-[--text-light]">Pendiente</p>
              <p className={`font-semibold ${pendiente > 0 ? 'text-amber-700' : 'text-[--text-medium]'}`}>
                {formatImporte(Math.max(0, pendiente))}
              </p>
            </div>
          </div>

          {/* Lista de pagos */}
          {encargo.pagos?.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-[--border] last:border-0">
              <div>
                <p className="text-sm text-[--text-dark]">
                  {TIPO_PAGO_LABELS[p.tipo] ?? p.tipo} · {FORMA_PAGO_LABELS[p.forma_pago] ?? p.forma_pago}
                </p>
                <p className="text-xs text-[--text-light]">{formatFecha(p.fecha)}{p.referencia && ` · ${p.referencia}`}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[--text-dark]">{formatImporte(p.importe)}</span>
                <button onClick={() => handleEliminarPago(p.id)} className="text-[--text-light] hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {encargo.pagos?.length === 0 && !mostrarFormPago && (
            <p className="text-xs text-[--text-light]">Sin pagos registrados</p>
          )}

          {/* Formulario pago rápido */}
          {mostrarFormPago && (
            <div className="border border-[--border] rounded-md p-3 space-y-2 bg-[--bg-alt]">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-[--text-light] mb-1">Importe (€) *</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={pago.importe}
                    onChange={e => setPago(v => ({ ...v, importe: e.target.value }))}
                    className="w-full border border-[--border] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-[--text-light] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={pago.fecha}
                    onChange={e => setPago(v => ({ ...v, fecha: e.target.value }))}
                    className="w-full border border-[--border] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-[--text-light] mb-1">Tipo</label>
                  <select
                    value={pago.tipo}
                    onChange={e => setPago(v => ({ ...v, tipo: e.target.value }))}
                    className="w-full border border-[--border] rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {TIPOS_PAGO.map(t => <option key={t} value={t}>{TIPO_PAGO_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-[--text-light] mb-1">Forma de pago</label>
                  <select
                    value={pago.forma_pago}
                    onChange={e => setPago(v => ({ ...v, forma_pago: e.target.value }))}
                    className="w-full border border-[--border] rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {FORMAS_PAGO.map(f => <option key={f} value={f}>{FORMA_PAGO_LABELS[f]}</option>)}
                  </select>
                </div>
              </div>
              <input
                value={pago.referencia}
                onChange={e => setPago(v => ({ ...v, referencia: e.target.value }))}
                placeholder="Referencia (opcional)"
                className="w-full border border-[--border] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRegistrarPago}
                  disabled={guardandoPago}
                  className="bg-primary text-white text-xs px-4 py-1.5 rounded hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {guardandoPago ? 'Guardando…' : 'Guardar pago'}
                </button>
                <button
                  onClick={() => setMostrarFormPago(false)}
                  className="text-xs text-[--text-light] hover:text-[--text-medium]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historial de estados */}
        {encargo.historial_estados?.length > 0 && (
          <div className="bg-white rounded-lg border border-[--border] p-4 space-y-2">
            <h2 className="text-sm font-semibold text-[--text-medium]">Historial</h2>
            {[...encargo.historial_estados]
              .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
              .map(h => (
                <div key={h.id} className="text-xs text-[--text-medium] flex justify-between">
                  <span>
                    {ESTADO_LABELS[h.estado_anterior] ?? '—'} → <span className="font-medium">{ESTADO_LABELS[h.estado_nuevo]}</span>
                  </span>
                  <span className="text-[--text-light]">{formatFecha(h.fecha)}</span>
                </div>
              ))}
          </div>
        )}

        {/* Notas */}
        {encargo.notas && (
          <div className="bg-white rounded-lg border border-[--border] p-4">
            <h2 className="text-sm font-semibold text-[--text-medium] mb-1">Notas</h2>
            <p className="text-sm text-[--text-dark]">{encargo.notas}</p>
          </div>
        )}
      </div>

      {/* Modal compartir */}
      {modalCompartir && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setModalCompartir(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-display text-lg">Compartir seguimiento</h3>

            <div className="space-y-1">
              <p className="text-xs text-[--text-light]">Código corto (para comunicar por teléfono)</p>
              <p className="text-3xl font-bold tracking-widest text-primary text-center py-2">
                {encargo.codigo_corto}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[--text-light]">Enlace directo (para enviar por WhatsApp)</p>
              <button
                onClick={handleCopiarEnlace}
                className="w-full flex items-center justify-center gap-2 border border-[--border] rounded-md px-4 py-2.5 text-sm hover:bg-[--bg-alt] transition-colors"
              >
                {copiado ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                {copiado ? 'Enlace copiado' : 'Copiar enlace'}
              </button>
            </div>

            <button
              onClick={() => setModalCompartir(false)}
              className="w-full text-sm text-[--text-light] hover:text-[--text-medium]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
