import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Share2, FileText, Copy, Check,
  Trash2, PlusCircle, Pencil, Plus
} from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchEncargo, avanzarEstado, registrarPago, eliminarPago, eliminarLinea, agregarLinea, fetchCatalogo, eliminarEncargo } from '@/hooks/useEncargos'
import { supabase } from '@/lib/supabase'
import { generarPresupuestoPDF, generarFacturaPDF } from '@/utils/pdfGenerator'
import {
  formatFecha, formatImporte,
  ESTADO_LABELS,
  TIPO_PAGO_LABELS, FORMA_PAGO_LABELS
} from '@/utils/formatters'

const ESTADOS = ['presupuestado', 'confirmado', 'en_confeccion', 'listo', 'entregado']

const TIPOS_PAGO = ['señal', 'parcial', 'final', 'devolucion']
const FORMAS_PAGO = ['efectivo', 'transferencia', 'tarjeta', 'bizum']

export default function EncargoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [encargo, setEncargo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avanzando, setAvanzando] = useState(false)

  // Modal compartir
  const [modalCompartir, setModalCompartir] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Modal PDF
  const [modalPdf, setModalPdf] = useState(null) // 'presupuesto' | 'factura' | null

  // Modal líneas
  const [modalLineas, setModalLineas] = useState(false)
  const [catalogo, setCatalogo] = useState([])
  const [nuevaLinea, setNuevaLinea] = useState({ prenda_id: '', descripcion: '', cantidad: 1, precio_unitario: '', medidas_ajuste: '', notas: '' })
  const [guardandoLinea, setGuardandoLinea] = useState(false)

  // Modal confirmación eliminar
  const [confirmDelete, setConfirmDelete] = useState(null) // { tipo: 'encargo' | 'pago', pagoId? }

  // WhatsApp
  const [notificarWA, setNotificarWA] = useState(true)
  const [enviandoWA, setEnviandoWA] = useState(false)
  const [resultadoWA, setResultadoWA] = useState(null) // 'ok' | 'error' | null

  // Formulario pago
  const [mostrarFormPago, setMostrarFormPago] = useState(false)
  const [pago, setPago] = useState({ fecha: new Date().toISOString().split('T')[0], importe: '', tipo: 'señal', forma_pago: 'efectivo', referencia: '', notas: '' })
  const [guardandoPago, setGuardandoPago] = useState(false)
  const [errorPago, setErrorPago] = useState('')

  const cargar = () => {
    setLoading(true)
    fetchEncargo(id).then(setEncargo).catch(console.error).finally(() => setLoading(false))
  }

  const abrirModalLineas = () => {
    fetchCatalogo().then(setCatalogo).catch(console.error)
    setNuevaLinea({ prenda_id: '', descripcion: '', cantidad: 1, precio_unitario: '', medidas_ajuste: '', notas: '' })
    setModalLineas(true)
  }

  const handleEliminarLinea = async (lineaId, descripcion) => {
    await eliminarLinea(lineaId, id, descripcion)
    cargar()
  }

  const handleAgregarLinea = async () => {
    if (!nuevaLinea.descripcion.trim()) return
    setGuardandoLinea(true)
    try {
      await agregarLinea(id, nuevaLinea)
      setNuevaLinea({ prenda_id: '', descripcion: '', cantidad: 1, precio_unitario: '', medidas_ajuste: '', notas: '' })
      cargar()
    } catch (e) {
      console.error(e)
    } finally {
      setGuardandoLinea(false)
    }
  }

  const updateNuevaLinea = (campo, valor) => {
    setNuevaLinea(prev => {
      const updated = { ...prev, [campo]: valor }
      if (campo === 'prenda_id' && valor) {
        const prenda = catalogo.find(p => p.id === valor)
        if (prenda) {
          updated.descripcion = prenda.nombre
          updated.precio_unitario = (prenda.precio_base * (1 - (prenda.descuento ?? 0) / 100)).toFixed(2)
        }
      }
      return updated
    })
  }

  useEffect(cargar, [id])

  if (loading) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Cargando…</div></PageWrapper>
  if (!encargo) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Encargo no encontrado.</div></PageWrapper>

  const estadoActual = ESTADOS.indexOf(encargo.estado)
  const nombreCliente = encargo.clientes
    ? `${encargo.clientes.nombre} ${encargo.clientes.apellidos ?? ''}`.trim()
    : 'Sin cliente'

  const fechasPorEstado = {}
  if (encargo.historial_encargo) {
    const hCreado = encargo.historial_encargo.find(h => h.descripcion === 'Encargo creado')
    if (hCreado) fechasPorEstado['presupuestado'] = hCreado.fecha
    for (let i = 1; i < ESTADOS.length; i++) {
      const label = ESTADO_LABELS[ESTADOS[i]]
      const h = encargo.historial_encargo.find(h => h.descripcion?.includes(`→ ${label}`))
      if (h) fechasPorEstado[ESTADOS[i]] = h.fecha
    }
  }

  const handleCambiarEstado = async (nuevoEstado) => {
    const nuevoIndex = ESTADOS.indexOf(nuevoEstado)
    if (Math.abs(nuevoIndex - estadoActual) !== 1) return
    setAvanzando(true)
    try {
      await avanzarEstado(id, encargo.estado, nuevoEstado)
      if (nuevoIndex > estadoActual && nuevoEstado === 'confirmado') setModalPdf('presupuesto')
      if (nuevoIndex > estadoActual && nuevoEstado === 'entregado') setModalPdf('factura')

      // Notificación WhatsApp (solo al avanzar estado, no al retroceder)
      if (nuevoIndex > estadoActual && notificarWA && encargo.clientes?.telefono) {
        setEnviandoWA(true)
        const { error: waError } = await supabase.functions.invoke('notify-whatsapp', {
          body: {
            cliente_telefono: encargo.clientes.telefono,
            cliente_nombre: encargo.clientes.nombre,
            encargo_ref: encargo.numero,
            token_publico: encargo.token_publico,
            nuevo_estado: nuevoEstado,
          },
        })
        setEnviandoWA(false)
        setResultadoWA(waError ? 'error' : 'ok')
        setTimeout(() => setResultadoWA(null), 4000)
      }

      cargar()
    } catch (e) {
      console.error(e)
    } finally {
      setAvanzando(false)
    }
  }

  const handleEliminarEncargo = () => {
    setConfirmDelete({ tipo: 'encargo' })
  }

  const handleConfirmDelete = async () => {
    if (confirmDelete?.tipo === 'encargo') {
      await eliminarEncargo(id)
      navigate('/encargos')
    } else if (confirmDelete?.tipo === 'pago') {
      const pago = encargo.pagos?.find(p => p.id === confirmDelete.pagoId)
      await eliminarPago(confirmDelete.pagoId, id, pago?.importe)
      cargar()
    }
    setConfirmDelete(null)
  }

  const handleCopiarEnlace = () => {
    const url = `${window.location.origin}/seguimiento/${encargo.token_publico}`
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const handleRegistrarPago = async () => {
    if (!pago.importe || parseFloat(pago.importe) <= 0) return
    if (pago.tipo !== 'devolucion' && parseFloat(pago.importe) > pendiente) {
      setErrorPago(`El importe supera el pendiente (${formatImporte(pendiente)})`)
      return
    }
    setErrorPago('')
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

  const handleEliminarPago = (pagoId) => {
    setConfirmDelete({ tipo: 'pago', pagoId })
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
          <button
            onClick={handleEliminarEncargo}
            className="text-[--text-light] hover:text-red-500 transition-colors p-1"
            title="Eliminar encargo"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Estado + Timeline */}
        <div className="bg-white rounded-lg border border-[--border] p-4">
          {encargo.fecha_entrega_estimada && (
            <p className="text-xs text-[--text-light] mb-4">
              Entrega prevista: {formatFecha(encargo.fecha_entrega_estimada)}
            </p>
          )}
          <div>
            {ESTADOS.map((estado, i) => {
              const completado = i < estadoActual
              const esCurrent = i === estadoActual
              const esAdyacente = Math.abs(i - estadoActual) === 1
              const esUltimo = i === ESTADOS.length - 1
              const fecha = fechasPorEstado[estado]
              return (
                <div key={estado} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => !avanzando && esAdyacente && handleCambiarEstado(estado)}
                      disabled={!esAdyacente || avanzando}
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity ${
                        completado
                          ? 'bg-teal-800 text-white'
                          : esCurrent
                          ? 'border-2 border-primary bg-white'
                          : 'border-2 border-gray-200 bg-white'
                      } ${esAdyacente && !avanzando ? 'cursor-pointer hover:opacity-75' : 'cursor-default'}`}
                    >
                      {completado && <Check size={14} />}
                      {esCurrent && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </button>
                    {!esUltimo && <div className="w-px bg-gray-200 flex-1 my-1 min-h-6" />}
                  </div>
                  <div className={`${esUltimo ? 'pb-0' : 'pb-4'}`}>
                    <p className={`text-sm font-semibold leading-8 ${
                      completado ? 'text-[--text-dark]'
                      : esCurrent ? 'text-primary'
                      : 'text-[--text-light]'
                    }`}>
                      {ESTADO_LABELS[estado]}
                    </p>
                    {fecha && (completado || esCurrent) && (
                      <p className={`text-xs -mt-2 mb-1 ${esCurrent ? 'text-primary' : 'text-[--text-light]'}`}>
                        {esCurrent ? `Estado actual · desde ${formatFecha(fecha)}` : formatFecha(fecha)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notificación WhatsApp */}
        {encargo.clientes?.telefono && estadoActual < ESTADOS.length - 1 && (
          <div className="space-y-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notificarWA}
                onChange={e => setNotificarWA(e.target.checked)}
                className="w-4 h-4 accent-[--primary] cursor-pointer"
              />
              <span className="text-xs text-[--text-medium]">
                Notificar a {encargo.clientes.nombre} por WhatsApp al cambiar estado
              </span>
              {enviandoWA && (
                <span className="text-xs text-[--text-light] animate-pulse">Enviando…</span>
              )}
            </label>
            {resultadoWA === 'ok' && (
              <p className="text-xs text-green-700 pl-6">
                WhatsApp enviado a {encargo.clientes.nombre}
              </p>
            )}
            {resultadoWA === 'error' && (
              <p className="text-xs text-red-500 pl-6">
                No se pudo enviar el WhatsApp
              </p>
            )}
          </div>
        )}

        {/* PDFs manuales */}
        {estadoActual >= 1 && (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const e = await fetchEncargo(id)
                await generarPresupuestoPDF(e)
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
                  await generarFacturaPDF(e, fiscal)
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[--text-medium]">
              Prendas ({encargo.encargo_lineas?.length ?? 0})
            </h2>
            <button
              onClick={abrirModalLineas}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark"
            >
              <Pencil size={13} />
              Editar
            </button>
          </div>
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
                  <label className="block text-xs text-[--text-light] mb-1">
                    Importe (€) *
                    {pago.tipo !== 'devolucion' && (
                      <span className="ml-1 text-[--text-light]">— disponible: {formatImporte(pendiente)}</span>
                    )}
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    value={pago.importe}
                    onChange={e => { setPago(v => ({ ...v, importe: e.target.value })); setErrorPago('') }}
                    className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${errorPago ? 'border-red-400' : 'border-[--border]'}`}
                    placeholder="0.00"
                  />
                  {errorPago && <p className="text-xs text-red-500 mt-0.5">{errorPago}</p>}
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
                  onClick={() => { setMostrarFormPago(false); setErrorPago('') }}
                  className="text-xs text-[--text-light] hover:text-[--text-medium]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historial */}
        {encargo.historial_encargo?.length > 0 && (
          <div className="bg-white rounded-lg border border-[--border] p-4 space-y-2">
            <h2 className="text-sm font-semibold text-[--text-medium]">Historial</h2>
            {[...encargo.historial_encargo]
              .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
              .map(h => (
                <div key={h.id} className="text-xs text-[--text-medium] flex justify-between gap-4">
                  <span>{h.descripcion}</span>
                  <span className="text-[--text-light] flex-shrink-0">{formatFecha(h.fecha)}</span>
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

      {/* Modal líneas */}
      {modalLineas && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setModalLineas(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[--border]">
              <h3 className="font-display text-lg">Editar prendas</h3>
              <button onClick={() => setModalLineas(false)} className="text-[--text-light] hover:text-[--text-dark]">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-2">
              {/* Líneas existentes */}
              {encargo.encargo_lineas?.map(l => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-[--border] last:border-0 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[--text-dark] truncate">
                      {l.descripcion || l.prendas_catalogo?.nombre || '—'}
                      {l.cantidad > 1 && <span className="text-[--text-light] ml-1">×{l.cantidad}</span>}
                    </p>
                    <p className="text-xs text-[--text-light]">{formatImporte((parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1))}</p>
                  </div>
                  <button
                    onClick={() => handleEliminarLinea(l.id, l.descripcion || l.prendas_catalogo?.nombre)}
                    className="text-[--text-light] hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              {/* Formulario nueva línea */}
              <div className="pt-3 space-y-2">
                <p className="text-xs font-semibold text-[--text-medium]">Añadir prenda</p>

                {catalogo.length > 0 && (
                  <select
                    value={nuevaLinea.prenda_id}
                    onChange={e => updateNuevaLinea('prenda_id', e.target.value)}
                    className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="">— Del catálogo (opcional) —</option>
                    {catalogo.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({formatImporte(p.precio_base * (1 - (p.descuento ?? 0) / 100))})
                      </option>
                    ))}
                  </select>
                )}

                <input
                  value={nuevaLinea.descripcion}
                  onChange={e => updateNuevaLinea('descripcion', e.target.value)}
                  placeholder="Descripción *"
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex gap-2">
                  <input
                    type="number" min="1"
                    value={nuevaLinea.cantidad}
                    onChange={e => updateNuevaLinea('cantidad', e.target.value)}
                    placeholder="Cant."
                    className="w-20 border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number" step="0.01" min="0"
                    value={nuevaLinea.precio_unitario}
                    onChange={e => updateNuevaLinea('precio_unitario', e.target.value)}
                    placeholder="Precio (€)"
                    className="flex-1 border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <input
                  value={nuevaLinea.medidas_ajuste}
                  onChange={e => updateNuevaLinea('medidas_ajuste', e.target.value)}
                  placeholder="Medidas de ajuste"
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  value={nuevaLinea.notas}
                  onChange={e => updateNuevaLinea('notas', e.target.value)}
                  placeholder="Notas de esta prenda"
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <button
                  onClick={handleAgregarLinea}
                  disabled={guardandoLinea || !nuevaLinea.descripcion.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  <Plus size={14} />
                  {guardandoLinea ? 'Guardando…' : 'Añadir prenda'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {modalPdf && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display text-base text-[--text-dark]">
                  {modalPdf === 'presupuesto' ? 'Descargar presupuesto' : 'Descargar factura'}
                </h3>
                <p className="text-xs text-[--text-light]">
                  {modalPdf === 'presupuesto'
                    ? 'El encargo ha sido confirmado.'
                    : 'El encargo ha sido entregado.'}
                  {' '}¿Quieres descargar el PDF ahora?
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModalPdf(null)}
                className="flex-1 text-sm border border-[--border] px-4 py-2 rounded-md text-[--text-medium] hover:bg-[--bg-alt] transition-colors"
              >
                Ahora no
              </button>
              <button
                onClick={async () => {
                  setModalPdf(null)
                  const actualizado = await fetchEncargo(id)
                  if (modalPdf === 'presupuesto') {
                    await generarPresupuestoPDF(actualizado)
                  } else {
                    const { data: fiscal } = await supabase.from('datos_fiscales').select('*').limit(1).maybeSingle()
                    await generarFacturaPDF(actualizado, fiscal)
                  }
                }}
                className="flex-1 text-sm bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
              >
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-display text-base text-[--text-dark]">
                  {confirmDelete.tipo === 'encargo' ? 'Eliminar encargo' : 'Eliminar pago'}
                </h3>
                <p className="text-xs text-[--text-light]">
                  {confirmDelete.tipo === 'encargo'
                    ? `¿Eliminar el encargo ${encargo.numero}? Esta acción no se puede deshacer.`
                    : '¿Eliminar este pago? Esta acción no se puede deshacer.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 text-sm border border-[--border] px-4 py-2 rounded-md text-[--text-medium] hover:bg-[--bg-alt] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

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
