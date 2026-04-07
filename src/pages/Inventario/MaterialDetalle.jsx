import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Plus, Minus, Settings, Edit2, AlertTriangle, Download, X } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { useInventario } from '@/hooks/useInventario'
import { formatFecha, formatImporte } from '@/utils/formatters'
import { exportarMovimientosMaterial } from '@/utils/exportInventario'

const UNIDAD_LABELS = {
  unidad: 'ud.', metro: 'm', metro_cuadrado: 'm²', kilogramo: 'kg',
  litro: 'l', par: 'par', rollo: 'rollo', caja: 'caja',
}

const TIPO_COLOR = {
  entrada: 'bg-green-100 text-green-700',
  salida: 'bg-red-100 text-red-600',
  ajuste: 'bg-gray-100 text-gray-600',
}

const MOTIVO_SALIDA = [
  { value: 'consumo_encargo', label: 'Consumo en encargo' },
  { value: 'merma', label: 'Merma / desperdicio' },
  { value: 'devolucion', label: 'Devolución' },
  { value: 'otro', label: 'Otro' },
]

const formEntradaVacio = { cantidad: '', precio_unitario: '', proveedor_id: '', fecha: new Date().toISOString().slice(0,10), notas: '', crearGasto: true }
const formSalidaVacio = { cantidad: '', motivo: 'consumo_encargo', encargo_id: '', fecha: new Date().toISOString().slice(0,10), notas: '' }
const formAjusteVacio = { cantidad: '', motivo: '', fecha: new Date().toISOString().slice(0,10) }
const formEditarVacio = { codigo: '', nombre: '', descripcion: '', unidad: 'unidad', categoria: '', stock_minimo: '', precio_referencia: '', notas: '' }

export default function MaterialDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    fetchMaterial, actualizarMaterial, desactivarMaterial,
    registrarEntrada, registrarSalida, registrarAjuste,
    fetchProveedores, fetchEncargosActivos,
  } = useInventario()

  const [material, setMaterial] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [proveedores, setProveedores] = useState([])
  const [encargos, setEncargos] = useState([])

  // Panel activo: null | 'entrada' | 'salida' | 'ajuste' | 'editar'
  const [panel, setPanel] = useState(null)

  const [formEntrada, setFormEntrada] = useState(formEntradaVacio)
  const [formSalida, setFormSalida] = useState(formSalidaVacio)
  const [formAjuste, setFormAjuste] = useState(formAjusteVacio)
  const [formEditar, setFormEditar] = useState(formEditarVacio)

  const [guardando, setGuardando] = useState(false)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState(location.state?.toastMsg ?? '')
  const [modalDesactivar, setModalDesactivar] = useState(false)

  const cargar = async () => {
    setLoading(true)
    const { material: m, movimientos: movs } = await fetchMaterial(id)
    setMaterial(m)
    setMovimientos(movs)
    if (m) setFormEditar({
      codigo: m.codigo ?? '',
      nombre: m.nombre,
      descripcion: m.descripcion ?? '',
      unidad: m.unidad,
      categoria: m.categoria ?? '',
      stock_minimo: m.stock_minimo ?? '',
      precio_referencia: m.precio_referencia ?? '',
      notas: m.notas ?? '',
    })
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    fetchProveedores().then(setProveedores)
    fetchEncargosActivos().then(setEncargos)
  }, [id])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const togglePanel = (nombre) => {
    setErr('')
    setPanel(p => p === nombre ? null : nombre)
  }

  // Cuando selecciona proveedor en entrada, activa crearGasto por defecto
  const handleProveedorEntrada = (val) => {
    setFormEntrada(f => ({ ...f, proveedor_id: val, crearGasto: !!val }))
  }

  const handleGuardarEntrada = async () => {
    if (!formEntrada.cantidad || isNaN(formEntrada.cantidad)) return setErr('Indica la cantidad.')
    setGuardando(true); setErr('')
    try {
      await registrarEntrada({
        materialId: id,
        materialNombre: material.nombre,
        cantidad: formEntrada.cantidad,
        precioUnitario: formEntrada.precio_unitario || null,
        proveedorId: formEntrada.proveedor_id || null,
        fecha: formEntrada.fecha,
        notas: formEntrada.notas || null,
        crearGasto: formEntrada.crearGasto,
      })
      setFormEntrada(formEntradaVacio)
      setPanel(null)
      await cargar()
    } catch (e) { setErr(e.message) } finally { setGuardando(false) }
  }

  const handleGuardarSalida = async () => {
    if (!formSalida.cantidad || isNaN(formSalida.cantidad)) return setErr('Indica la cantidad.')
    setGuardando(true); setErr('')
    try {
      await registrarSalida({
        materialId: id,
        cantidad: formSalida.cantidad,
        encargoId: formSalida.encargo_id || null,
        motivo: formSalida.motivo,
        fecha: formSalida.fecha,
        notas: formSalida.notas || null,
      })
      setFormSalida(formSalidaVacio)
      setPanel(null)
      await cargar()
    } catch (e) { setErr(e.message) } finally { setGuardando(false) }
  }

  const handleGuardarAjuste = async () => {
    if (!formAjuste.cantidad || isNaN(formAjuste.cantidad)) return setErr('Indica la diferencia.')
    if (!formAjuste.motivo.trim()) return setErr('El motivo es obligatorio.')
    setGuardando(true); setErr('')
    try {
      await registrarAjuste({
        materialId: id,
        cantidad: formAjuste.cantidad,
        motivo: formAjuste.motivo,
        fecha: formAjuste.fecha,
      })
      setFormAjuste(formAjusteVacio)
      setPanel(null)
      await cargar()
    } catch (e) { setErr(e.message) } finally { setGuardando(false) }
  }

  const handleGuardarEditar = async () => {
    if (!formEditar.nombre.trim()) return setErr('El nombre es obligatorio.')
    setGuardando(true); setErr('')
    try {
      await actualizarMaterial(id, {
        codigo: formEditar.codigo.trim() || null,
        nombre: formEditar.nombre.trim(),
        descripcion: formEditar.descripcion.trim() || null,
        unidad: formEditar.unidad,
        categoria: formEditar.categoria.trim() || null,
        stock_minimo: parseFloat(formEditar.stock_minimo) || 0,
        precio_referencia: formEditar.precio_referencia !== '' ? parseFloat(formEditar.precio_referencia) : null,
        notas: formEditar.notas.trim() || null,
      })
      setPanel(null)
      await cargar()
      setToast('Material actualizado.')
    } catch (e) { setErr(e.message) } finally { setGuardando(false) }
  }

  const handleDesactivar = async () => {
    try {
      await desactivarMaterial(id)
      navigate('/inventario')
    } catch (e) { console.error(e) }
  }

  if (loading) return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        <p className="text-sm text-[--text-light] text-center py-16">Cargando…</p>
      </div>
    </PageWrapper>
  )

  if (!material) return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        <p className="text-sm text-[--text-light] text-center py-16">Material no encontrado.</p>
      </div>
    </PageWrapper>
  )

  const stockBajo = parseFloat(material.stock_actual) < parseFloat(material.stock_minimo)
  const unidadLabel = UNIDAD_LABELS[material.unidad] ?? material.unidad

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-5">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        )}

        {/* Cabecera */}
        <div>
          <button onClick={() => navigate('/inventario')} className="text-xs text-primary hover:underline mb-2 block">
            ← Inventario
          </button>
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div>
              <h1 className="font-display text-2xl text-[--text-dark]">{material.nombre}</h1>
              {material.codigo && <p className="text-xs text-[--text-light] font-mono mt-0.5">{material.codigo}</p>}
              {material.categoria && <p className="text-xs text-[--text-light] mt-0.5">{material.categoria}</p>}
            </div>
            <div className="text-right">
              <p className={`text-4xl font-bold ${stockBajo ? 'text-red-500' : 'text-primary'}`}>
                {parseFloat(material.stock_actual).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-[--text-light]">{unidadLabel} en stock</p>
              {stockBajo && (
                <span className="inline-flex items-center gap-1 text-[10px] text-red-500 font-medium mt-1">
                  <AlertTriangle size={12} /> Stock bajo (mín. {parseFloat(material.stock_minimo).toLocaleString('es-ES')})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => togglePanel('entrada')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${panel === 'entrada' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
          >
            <Plus size={14} /> Entrada
          </button>
          <button
            onClick={() => togglePanel('salida')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${panel === 'salida' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
          >
            <Minus size={14} /> Salida
          </button>
          <button
            onClick={() => togglePanel('ajuste')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${panel === 'ajuste' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Settings size={14} /> Ajuste
          </button>
          <button
            onClick={() => togglePanel('editar')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${panel === 'editar' ? 'bg-primary text-white' : 'border border-[--border] text-[--text-medium] hover:border-primary hover:text-primary'}`}
          >
            <Edit2 size={14} /> Editar
          </button>
          <button
            onClick={() => setModalDesactivar(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-red-400 border border-red-100 hover:bg-red-50 transition-colors"
          >
            Desactivar
          </button>
        </div>

        {/* Error panel */}
        {err && panel && <p className="text-xs text-red-500">{err}</p>}

        {/* Panel Entrada */}
        {panel === 'entrada' && (
          <div className="border border-[--border] rounded-md p-3 space-y-2 bg-[--bg-alt]">
            <p className="text-xs font-semibold text-green-700 mb-1">Registrar entrada de stock</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Cantidad *</label>
                <input type="number" min="0.01" step="0.01" value={formEntrada.cantidad}
                  onChange={e => setFormEntrada(f => ({ ...f, cantidad: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Precio unitario (€)</label>
                <input type="number" min="0" step="0.01" value={formEntrada.precio_unitario}
                  onChange={e => setFormEntrada(f => ({ ...f, precio_unitario: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Fecha</label>
                <input type="date" value={formEntrada.fecha}
                  onChange={e => setFormEntrada(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-2 md:col-span-2">
                <label className="text-xs text-[--text-light] block mb-0.5">Proveedor</label>
                <select value={formEntrada.proveedor_id} onChange={e => handleProveedorEntrada(e.target.value)}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm bg-white">
                  <option value="">— Sin proveedor —</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Notas</label>
                <input type="text" value={formEntrada.notas}
                  onChange={e => setFormEntrada(f => ({ ...f, notas: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
            </div>
            {formEntrada.proveedor_id && (
              <label className="flex items-center gap-2 text-xs text-[--text-medium] cursor-pointer mt-1">
                <input type="checkbox" checked={formEntrada.crearGasto}
                  onChange={e => setFormEntrada(f => ({ ...f, crearGasto: e.target.checked }))}
                  className="accent-primary" />
                Registrar también como gasto contable
                {formEntrada.precio_unitario && formEntrada.cantidad && (
                  <span className="text-[--text-light]">
                    — {formatImporte(parseFloat(formEntrada.cantidad) * parseFloat(formEntrada.precio_unitario))}
                  </span>
                )}
              </label>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => { setPanel(null); setErr('') }}
                className="px-3 py-1.5 text-xs rounded-md border border-[--border] text-[--text-medium] hover:bg-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardarEntrada} disabled={guardando}
                className="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
                {guardando ? 'Guardando…' : 'Guardar entrada'}
              </button>
            </div>
          </div>
        )}

        {/* Panel Salida */}
        {panel === 'salida' && (
          <div className="border border-[--border] rounded-md p-3 space-y-2 bg-[--bg-alt]">
            <p className="text-xs font-semibold text-red-600 mb-1">Registrar salida de stock</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Cantidad *</label>
                <input type="number" min="0.01" step="0.01" value={formSalida.cantidad}
                  onChange={e => setFormSalida(f => ({ ...f, cantidad: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Motivo</label>
                <select value={formSalida.motivo}
                  onChange={e => setFormSalida(f => ({ ...f, motivo: e.target.value, encargo_id: '' }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm bg-white">
                  {MOTIVO_SALIDA.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Fecha</label>
                <input type="date" value={formSalida.fecha}
                  onChange={e => setFormSalida(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              {formSalida.motivo === 'consumo_encargo' && (
                <div className="col-span-2 md:col-span-2">
                  <label className="text-xs text-[--text-light] block mb-0.5">Encargo</label>
                  <select value={formSalida.encargo_id}
                    onChange={e => setFormSalida(f => ({ ...f, encargo_id: e.target.value }))}
                    className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm bg-white">
                    <option value="">— Seleccionar —</option>
                    {encargos.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.numero} — {e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Notas</label>
                <input type="text" value={formSalida.notas}
                  onChange={e => setFormSalida(f => ({ ...f, notas: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => { setPanel(null); setErr('') }}
                className="px-3 py-1.5 text-xs rounded-md border border-[--border] text-[--text-medium] hover:bg-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardarSalida} disabled={guardando}
                className="px-3 py-1.5 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                {guardando ? 'Guardando…' : 'Guardar salida'}
              </button>
            </div>
          </div>
        )}

        {/* Panel Ajuste */}
        {panel === 'ajuste' && (
          <div className="border border-[--border] rounded-md p-3 space-y-2 bg-[--bg-alt]">
            <p className="text-xs font-semibold text-gray-600 mb-1">Ajuste de inventario</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Diferencia (+/−) *</label>
                <input type="number" step="0.01" value={formAjuste.cantidad}
                  onChange={e => setFormAjuste(f => ({ ...f, cantidad: e.target.value }))}
                  placeholder="Ej: -2 o +5"
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
                <p className="text-[10px] text-[--text-light] mt-0.5">Negativo = corrección a la baja</p>
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Motivo *</label>
                <input type="text" value={formAjuste.motivo}
                  onChange={e => setFormAjuste(f => ({ ...f, motivo: e.target.value }))}
                  placeholder="Recuento, pérdida…"
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Fecha</label>
                <input type="date" value={formAjuste.fecha}
                  onChange={e => setFormAjuste(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => { setPanel(null); setErr('') }}
                className="px-3 py-1.5 text-xs rounded-md border border-[--border] text-[--text-medium] hover:bg-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardarAjuste} disabled={guardando}
                className="px-3 py-1.5 text-xs rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50">
                {guardando ? 'Guardando…' : 'Guardar ajuste'}
              </button>
            </div>
          </div>
        )}

        {/* Panel Editar */}
        {panel === 'editar' && (
          <div className="border border-[--border] rounded-md p-4 space-y-3 bg-[--bg-alt]">
            <p className="text-xs font-semibold text-[--text] mb-1">Editar material</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Código</label>
                <input type="text" value={formEditar.codigo}
                  onChange={e => setFormEditar(f => ({ ...f, codigo: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Nombre *</label>
                <input type="text" value={formEditar.nombre}
                  onChange={e => setFormEditar(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Categoría</label>
                <input type="text" value={formEditar.categoria}
                  onChange={e => setFormEditar(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Stock mínimo</label>
                <input type="number" min="0" step="0.01" value={formEditar.stock_minimo}
                  onChange={e => setFormEditar(f => ({ ...f, stock_minimo: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Precio referencia (€)</label>
                <input type="number" min="0" step="0.01" value={formEditar.precio_referencia}
                  onChange={e => setFormEditar(f => ({ ...f, precio_referencia: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[--text-light] block mb-0.5">Notas</label>
                <input type="text" value={formEditar.notas}
                  onChange={e => setFormEditar(f => ({ ...f, notas: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => { setPanel(null); setErr('') }}
                className="px-3 py-1.5 text-xs rounded-md border border-[--border] text-[--text-medium] hover:bg-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardarEditar} disabled={guardando}
                className="px-3 py-1.5 text-xs rounded-md bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}

        {/* Historial de movimientos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[--text-medium]">Historial de movimientos</h2>
            <button
              onClick={() => exportarMovimientosMaterial(material, movimientos)}
              className="flex items-center gap-1.5 text-xs text-[--text-light] hover:text-primary border border-[--border] px-2 py-1 rounded-md transition-colors"
            >
              <Download size={12} /> Exportar
            </button>
          </div>

          {movimientos.length === 0 ? (
            <p className="text-xs text-[--text-light] text-center py-8">Sin movimientos registrados.</p>
          ) : (
            <div className="bg-white border border-[--border] rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[90px_70px_80px_80px_1fr_1fr_90px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-[--border] text-xs font-semibold text-[--text-light] uppercase tracking-wide">
                <span>Fecha</span>
                <span>Tipo</span>
                <span className="text-right">Cantidad</span>
                <span className="text-right">Precio</span>
                <span>Proveedor / Encargo</span>
                <span>Motivo / Notas</span>
                <span></span>
              </div>

              {movimientos.map((mv, i) => (
                <div
                  key={mv.id}
                  className={`grid md:grid-cols-[90px_70px_80px_80px_1fr_1fr_90px] gap-1 md:gap-3 px-4 py-2.5 text-sm border-b border-[--border] last:border-0 items-center ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                >
                  <span className="text-xs text-[--text-light]">{formatFecha(mv.fecha)}</span>
                  <span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${TIPO_COLOR[mv.tipo]}`}>
                      {mv.tipo}
                    </span>
                  </span>
                  <span className={`text-right text-sm font-semibold ${mv.tipo === 'salida' ? 'text-red-500' : mv.tipo === 'entrada' ? 'text-green-700' : 'text-gray-600'}`}>
                    {mv.tipo === 'salida' ? '−' : mv.tipo === 'ajuste' && parseFloat(mv.cantidad) < 0 ? '' : '+'}{parseFloat(mv.cantidad).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-right text-xs text-[--text-light]">
                    {mv.precio_unitario ? formatImporte(mv.precio_unitario) : '—'}
                  </span>
                  <span className="text-xs text-[--text-medium]">
                    {mv.proveedores?.nombre ?? mv.encargos?.numero ?? '—'}
                  </span>
                  <span className="text-xs text-[--text-light]">{mv.motivo ?? mv.notas ?? '—'}</span>
                  <span />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal desactivar */}
      {modalDesactivar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[--text]">Desactivar material</h3>
              <button onClick={() => setModalDesactivar(false)}><X size={18} className="text-[--text-light]" /></button>
            </div>
            <p className="text-sm text-[--text-medium] mb-6">
              <strong>{material.nombre}</strong> dejará de aparecer en el inventario activo. El historial de movimientos se conserva.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalDesactivar(false)}
                className="flex-1 border border-[--border] rounded-md px-4 py-2 text-sm text-[--text-medium] hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleDesactivar}
                className="flex-1 bg-red-500 text-white rounded-md px-4 py-2 text-sm hover:bg-red-600 transition-colors">
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
