import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Share2, FileText, Copy, Check,
  Trash2, PlusCircle, Pencil, Plus, MessageCircle, AlertCircle
} from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchEncargo, avanzarEstado, registrarPago, actualizarPago, eliminarPago, eliminarLinea, agregarLinea, actualizarLinea, fetchCatalogo, eliminarEncargo } from '@/hooks/useEncargos'
import { supabase } from '@/lib/supabase'
import { generarPresupuestoPDF, generarFacturaPDF } from '@/utils/pdfGenerator'
import { useToast } from '@/hooks/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingState from '@/components/ui/LoadingState'
import Badge from '@/components/ui/Badge'
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
  const toast = useToast()
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
  const [mostrarFormLinea, setMostrarFormLinea] = useState(false)
  const [catalogo, setCatalogo] = useState([])
  const [nuevaLinea, setNuevaLinea] = useState({ prenda_id: '', descripcion: '', cantidad: 1, precio_unitario: '', notas: '' })
  const [guardandoLinea, setGuardandoLinea] = useState(false)
  const [lineaEditando, setLineaEditando] = useState(null) // id de la línea en edición
  const [datosEdicion, setDatosEdicion] = useState({})
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [pagoEditando, setPagoEditando] = useState(null) // id del pago en edición
  const [datosPagoEdicion, setDatosPagoEdicion] = useState({})
  const [guardandoPagoEdicion, setGuardandoPagoEdicion] = useState(false)

  // Modal confirmación eliminar
  const [confirmDelete, setConfirmDelete] = useState(null) // { tipo: 'encargo' | 'pago', pagoId? }

  // Modal señal pendiente
  const [modalSenal, setModalSenal] = useState(false)

  // Timeline hover
  const [hoveredEstado, setHoveredEstado] = useState(null)

  // WhatsApp
  const [notificarWA, setNotificarWA] = useState(false)
  const [enviandoWA, setEnviandoWA] = useState(false)
  const [resultadoWA, setResultadoWA] = useState(null) // 'ok' | 'error' | null

  const handleNotificarWAManual = async () => {
    if (!encargo.clientes?.telefono) return
    setEnviandoWA(true)
    const { error: waError } = await supabase.functions.invoke('notify-whatsapp', {
      body: {
        cliente_telefono: encargo.clientes.telefono,
        cliente_nombre: encargo.clientes.nombre,
        encargo_ref: encargo.numero,
        token_publico: encargo.token_publico,
        nuevo_estado: encargo.estado,
      },
    })
    setEnviandoWA(false)
    setResultadoWA(waError ? 'error' : 'ok')
    setTimeout(() => setResultadoWA(null), 4000)
  }

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
    setNuevaLinea({ prenda_id: '', descripcion: '', cantidad: 1, precio_unitario: '', notas: '' })
    setModalLineas(true)
  }

  const handleEliminarLinea = async (lineaId, descripcion) => {
    try {
      await eliminarLinea(lineaId, id, descripcion)
      cargar()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo eliminar la línea.')
    }
  }

  const handleAgregarLinea = async () => {
    if (!nuevaLinea.prenda_id) return
    setGuardandoLinea(true)
    try {
      await agregarLinea(id, nuevaLinea)
      setNuevaLinea({ prenda_id: '', descripcion: '', cantidad: 1, precio_unitario: '', notas: '' })
      setMostrarFormLinea(false)
      cargar()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo añadir la línea.')
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

  if (loading) return <PageWrapper><LoadingState /></PageWrapper>
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

    // Bloquear avance a en_confeccion si no hay señal del 30%
    if (nuevoIndex > estadoActual && nuevoEstado === 'en_confeccion') {
      const cobrado = (encargo.pagos ?? []).filter(p => p.tipo !== 'devolucion').reduce((s, p) => s + parseFloat(p.importe), 0)
      if (cobrado < (encargo.precio_total ?? 0) * 0.3) {
        setModalSenal(true)
        return
      }
    }

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
      toast.error('No se pudo cambiar el estado del encargo.')
    } finally {
      setAvanzando(false)
    }
  }

  const handleEliminarEncargo = () => {
    setConfirmDelete({ tipo: 'encargo' })
  }

  const handleConfirmDelete = async () => {
    try {
      if (confirmDelete?.tipo === 'encargo') {
        await eliminarEncargo(id)
        toast.success('Encargo eliminado.')
        navigate('/encargos')
      } else if (confirmDelete?.tipo === 'pago') {
        const pago = encargo.pagos?.find(p => p.id === confirmDelete.pagoId)
        await eliminarPago(confirmDelete.pagoId, id, pago?.importe)
        toast.success('Pago eliminado.')
        cargar()
      }
    } catch (e) {
      console.error(e)
      toast.error('No se pudo completar la eliminación.')
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
    if (!pago.importe || parseFloat(pago.importe) <= 0) { setErrorPago('Indica un importe mayor que 0.'); return }
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
      toast.success('Pago registrado.')
      cargar()
    } catch (e) {
      console.error(e)
      toast.error('No se pudo registrar el pago.')
    } finally {
      setGuardandoPago(false)
    }
  }

  const handleEliminarPago = (pagoId) => {
    setConfirmDelete({ tipo: 'pago', pagoId })
  }

  const totalCobrado = (encargo.pagos ?? []).filter(p => p.tipo !== 'devolucion').reduce((s, p) => s + parseFloat(p.importe), 0)
  const totalDevuelto = (encargo.pagos ?? []).filter(p => p.tipo === 'devolucion').reduce((s, p) => s + parseFloat(p.importe), 0)
  const totalPagado = totalCobrado - totalDevuelto  // neto mostrado en "Cobrado"
  const pendiente = Math.max(0, (encargo.precio_total ?? 0) - totalCobrado)  // el cliente debe lo que no haya pagado

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/encargos')}
            aria-label="Volver"
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-[--border] rounded-lg bg-white text-[--text-medium] hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1">
            <p className="text-xs text-[--text-light]">{encargo.numero}</p>
            <h1 className="font-display text-2xl text-[--text-dark]">{nombreCliente}</h1>
          </div>
          {encargo.clientes?.telefono && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotificarWA(v => !v)}
                title={notificarWA ? 'Notificación automática activada' : 'Notificación automática desactivada'}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                  notificarWA ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  notificarWA ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
              <button
                onClick={handleNotificarWAManual}
                disabled={!notificarWA || enviandoWA}
                className="flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageCircle size={13} />
                {enviandoWA ? 'Enviando…' : 'Notificar WhatsApp'}
              </button>
            </div>
          )}
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
            aria-label="Eliminar encargo"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Estado + Timeline */}
        <div className="bg-white rounded-lg border border-[--border] p-4">
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
                      onMouseEnter={() => esAdyacente && !avanzando && setHoveredEstado(estado)}
                      onMouseLeave={() => setHoveredEstado(null)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        hoveredEstado === estado
                          ? 'border-2 border-primary bg-white'
                          : completado
                          ? 'bg-teal-800 text-white'
                          : esCurrent
                          ? 'border-2 border-primary bg-white'
                          : 'border-2 border-gray-200 bg-white'
                      } ${esAdyacente && !avanzando ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {completado && hoveredEstado !== estado && <Check size={14} />}
                      {(esCurrent || hoveredEstado === estado) && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
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
                    {estado === 'entregado' && encargo.estado !== 'entregado' && encargo.fecha_entrega_estimada && (() => {
                      const hoy = new Date(); hoy.setHours(0,0,0,0)
                      const fin = new Date(encargo.fecha_entrega_estimada + 'T00:00:00')
                      const dias = Math.round((fin - hoy) / 86400000)
                      const color = dias < 0 ? 'text-red-800' : dias <= 3 ? 'text-red-500' : dias <= 7 ? 'text-amber-500' : 'text-teal-600'
                      return (
                        <p className={`text-xs -mt-2 mb-1 ${color}`}>
                          {dias < 0
                            ? `Vencido · ${formatFecha(encargo.fecha_entrega_estimada)}`
                            : `Entrega prevista: ${formatFecha(encargo.fecha_entrega_estimada)}`}
                        </p>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Feedback envío WhatsApp */}
        {resultadoWA === 'ok' && (
          <p className="text-xs text-green-700">WhatsApp enviado a {encargo.clientes?.nombre}</p>
        )}
        {resultadoWA === 'error' && (
          <p className="text-xs text-red-500">No se pudo enviar el WhatsApp</p>
        )}

        {/* PDFs manuales */}
        {estadoActual >= 0 && (
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
            <div key={p.id} className="border-b border-[--border] last:border-0">
              {pagoEditando === p.id ? (
                <div className="py-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number" step="0.50" min="0"
                      value={datosPagoEdicion.importe}
                      onChange={e => setDatosPagoEdicion(v => ({ ...v, importe: e.target.value }))}
                      placeholder="Importe (€)"
                      aria-label="Importe del pago"
                      className="flex-1 border border-[--border] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="date"
                      value={datosPagoEdicion.fecha}
                      onChange={e => setDatosPagoEdicion(v => ({ ...v, fecha: e.target.value }))}
                      className="flex-1 border border-[--border] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={datosPagoEdicion.tipo}
                      onChange={e => setDatosPagoEdicion(v => ({ ...v, tipo: e.target.value }))}
                      className="flex-1 border border-[--border] rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {TIPOS_PAGO.map(t => <option key={t} value={t}>{TIPO_PAGO_LABELS[t]}</option>)}
                    </select>
                    <select
                      value={datosPagoEdicion.forma_pago}
                      onChange={e => setDatosPagoEdicion(v => ({ ...v, forma_pago: e.target.value }))}
                      className="flex-1 border border-[--border] rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {FORMAS_PAGO.map(f => <option key={f} value={f}>{FORMA_PAGO_LABELS[f]}</option>)}
                    </select>
                  </div>
                  <input
                    value={datosPagoEdicion.referencia}
                    onChange={e => setDatosPagoEdicion(v => ({ ...v, referencia: e.target.value }))}
                    placeholder="Referencia (opcional)"
                    aria-label="Referencia del pago"
                    className="w-full border border-[--border] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!datosPagoEdicion.importe || parseFloat(datosPagoEdicion.importe) <= 0) return
                        setGuardandoPagoEdicion(true)
                        try {
                          await actualizarPago(p.id, datosPagoEdicion)
                          await cargar()
                          setPagoEditando(null)
                        } catch (e) { console.error(e); toast.error('No se pudo actualizar el pago.') }
                        finally { setGuardandoPagoEdicion(false) }
                      }}
                      disabled={guardandoPagoEdicion}
                      className="flex-1 bg-primary text-white text-xs px-3 py-1.5 rounded hover:bg-primary-dark disabled:opacity-50 transition-colors"
                    >
                      {guardandoPagoEdicion ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setPagoEditando(null)}
                      className="flex-1 border border-[--border] text-xs px-3 py-1.5 rounded text-[--text-medium] hover:bg-[--bg-alt] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
              <div className="flex items-center justify-between py-1.5 gap-3">
              <div>
                <p className="text-sm text-[--text-dark]">
                  {TIPO_PAGO_LABELS[p.tipo] ?? p.tipo} · {FORMA_PAGO_LABELS[p.forma_pago] ?? p.forma_pago}
                </p>
                <p className="text-xs text-[--text-light]">{formatFecha(p.fecha)}{p.referencia && ` · ${p.referencia}`}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${p.tipo === 'devolucion' ? 'text-red-500' : 'text-[--text-dark]'}`}>
                  {p.tipo === 'devolucion' ? `-${formatImporte(p.importe)}` : formatImporte(p.importe)}
                </span>
                <button
                  onClick={() => { setPagoEditando(p.id); setDatosPagoEdicion({ importe: p.importe, fecha: p.fecha, tipo: p.tipo, forma_pago: p.forma_pago, referencia: p.referencia || '' }) }}
                  aria-label="Editar pago"
                  className="text-[--text-light] hover:text-primary transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleEliminarPago(p.id)} aria-label="Eliminar pago" className="text-[--text-light] hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
              </div>
              )}
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
                  <label className={`block text-xs mb-1 ${errorPago ? 'text-red-500' : 'text-[--text-light]'}`}>
                    Importe (€) *
                    {pago.tipo !== 'devolucion' && (
                      <span className="ml-1">— disponible: {formatImporte(pendiente)}</span>
                    )}
                  </label>
                  <input
                    type="number" step="0.50" min="0"
                    value={pago.importe}
                    onChange={e => { setPago(v => ({ ...v, importe: e.target.value })); setErrorPago('') }}
                    className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${errorPago ? 'border-red-400' : 'border-[--border]'}`}
                    placeholder="0.00"
                    aria-label="Importe del pago"
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
                aria-label="Referencia del pago"
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
        {false && encargo.historial_encargo?.length > 0 && (
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
                <div key={l.id} className="border-b border-[--border] last:border-0">
                  {lineaEditando === l.id ? (
                    <div className="py-3 space-y-2">
                      <p className="text-xs font-semibold text-[--text-medium] truncate">{l.descripcion || l.prendas_catalogo?.nombre || '—'}</p>
                      <div className="flex gap-2">
                        <input
                          type="number" min="1"
                          value={datosEdicion.cantidad}
                          onChange={e => setDatosEdicion(v => ({ ...v, cantidad: e.target.value }))}
                          placeholder="Cant."
                        aria-label="Cantidad"
                          className="w-20 border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="number" step="0.50" min="0"
                          value={datosEdicion.precio_unitario}
                          onChange={e => setDatosEdicion(v => ({ ...v, precio_unitario: e.target.value }))}
                          placeholder="Precio (€)"
                        aria-label="Precio unitario"
                          className="flex-1 border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <input
                        value={datosEdicion.notas}
                        onChange={e => setDatosEdicion(v => ({ ...v, notas: e.target.value }))}
                        placeholder="Notas de esta prenda"
                      aria-label="Notas de la prenda"
                        className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={async () => {
                            setGuardandoEdicion(true)
                            try {
                              await actualizarLinea(l.id, encargo.id, datosEdicion)
                              const updated = await fetchEncargo(encargo.id)
                              setEncargo(updated)
                              setLineaEditando(null)
                            } catch (e) { console.error(e); toast.error('No se pudo actualizar la línea.') }
                            finally { setGuardandoEdicion(false) }
                          }}
                          disabled={guardandoEdicion}
                          className="flex-1 bg-primary text-white text-xs px-3 py-1.5 rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
                        >
                          {guardandoEdicion ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => setLineaEditando(null)}
                          className="flex-1 border border-[--border] text-xs px-3 py-1.5 rounded-md text-[--text-medium] hover:bg-[--bg-alt] transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-2 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[--text-dark] truncate">
                          {l.descripcion || l.prendas_catalogo?.nombre || '—'}
                          {l.cantidad > 1 && <span className="text-[--text-light] ml-1">×{l.cantidad}</span>}
                        </p>
                        <p className="text-xs text-[--text-light]">{formatImporte((parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1))}</p>
                      </div>
                      <button
                        onClick={() => {
                          setLineaEditando(l.id)
                          setDatosEdicion({
                            cantidad: l.cantidad,
                            precio_unitario: l.precio_unitario,
                            notas: l.notas || '',
                          })
                        }}
                        aria-label="Editar línea"
                        className="text-[--text-light] hover:text-primary transition-colors flex-shrink-0"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleEliminarLinea(l.id, l.descripcion || l.prendas_catalogo?.nombre)}
                        aria-label="Eliminar línea"
                        className="text-[--text-light] hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Formulario nueva línea */}
              <div className="pt-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => setMostrarFormLinea(v => !v)}
                    className="flex items-center gap-1 text-xs text-primary hover:opacity-75 transition-opacity"
                  >
                    <Plus size={13} />
                    Añadir prenda
                  </button>
                </div>

                {mostrarFormLinea && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={nuevaLinea.prenda_id}
                      onChange={e => updateNuevaLinea('prenda_id', e.target.value)}
                      className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    >
                      <option value="">— Seleccionar prenda —</option>
                      {catalogo.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({formatImporte(p.precio_base * (1 - (p.descuento ?? 0) / 100))})
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <input
                        type="number" min="1"
                        value={nuevaLinea.cantidad}
                        onChange={e => updateNuevaLinea('cantidad', e.target.value)}
                        placeholder="Cant."
                        aria-label="Cantidad"
                        className="w-20 border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="number" step="0.50" min="0"
                        value={nuevaLinea.precio_unitario}
                        onChange={e => updateNuevaLinea('precio_unitario', e.target.value)}
                        placeholder="Precio (€)"
                        aria-label="Precio unitario"
                        className="flex-1 border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <input
                      value={nuevaLinea.notas}
                      onChange={e => updateNuevaLinea('notas', e.target.value)}
                      placeholder="Notas de esta prenda"
                      aria-label="Notas de la prenda"
                      className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    <button
                      onClick={handleAgregarLinea}
                      disabled={guardandoLinea || !nuevaLinea.prenda_id}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
                    >
                      <Plus size={14} />
                      {guardandoLinea ? 'Guardando…' : 'Añadir prenda'}
                    </button>
                  </div>
                )}
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
      <ConfirmDialog
        open={!!confirmDelete}
        title={confirmDelete?.tipo === 'encargo' ? 'Eliminar encargo' : 'Eliminar pago'}
        description={
          confirmDelete?.tipo === 'encargo'
            ? `¿Eliminar el encargo ${encargo.numero}? Esta acción no se puede deshacer.`
            : '¿Eliminar este pago? Esta acción no se puede deshacer.'
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

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
      {/* Modal señal pendiente */}
      {modalSenal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setModalSenal(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-display text-base text-[--text-dark]">Pago no registrado</h3>
                <p className="text-xs text-[--text-light] mt-0.5">
                  Para confirmar el encargo es necesario que se haya pagado una señal equivalente al 30 % del total del encargo.
                </p>
                <p className="text-xs text-[--text-dark] font-semibold mt-1">
                  Cantidad a pagar: {formatImporte((encargo.precio_total ?? 0) * 0.3)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setModalSenal(false)}
              className="w-full text-sm bg-[--primary] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </PageWrapper>
  )
}
