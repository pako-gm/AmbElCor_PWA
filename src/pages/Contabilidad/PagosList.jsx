import { useEffect, useState } from 'react'
import { Download, Plus, Trash2, X } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { useContabilidad } from '@/hooks/useContabilidad'
import { formatFecha, formatImporte, FORMA_PAGO_LABELS, CATEGORIA_GASTO_LABELS } from '@/utils/formatters'
import { exportarLibroPagos } from '@/utils/exportExcel'

const AÑO_ACTUAL = new Date().getFullYear()
const AÑOS = [AÑO_ACTUAL, AÑO_ACTUAL - 1, AÑO_ACTUAL - 2]
const FORMAS_PAGO = ['efectivo', 'transferencia', 'tarjeta', 'bizum']

const formVacio = {
  proveedor_id: '',
  fecha: new Date().toISOString().slice(0, 10),
  concepto: '',
  importe: '',
  forma_pago: 'efectivo',
  referencia: '',
  categoria: 'material',
  base_imponible: '',
  iva_porcentaje: 21,
  iva_importe: '',
  desglosarIva: false,
}

export default function PagosList() {
  const {
    fetchPagosProveedor,
    registrarPagoProveedor,
    eliminarPagoProveedor,
    fetchProveedores,
    crearProveedor,
    loading,
  } = useContabilidad()

  const [pagos, setPagos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [año, setAño] = useState(AÑO_ACTUAL)
  const [trimestre, setTrimestre] = useState(0)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(formVacio)
  const [guardando, setGuardando] = useState(false)
  const [errForm, setErrForm] = useState('')

  const [modalEliminar, setModalEliminar] = useState(null)
  const [modalProveedor, setModalProveedor] = useState(false)
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: '', telefono: '', email: '' })
  const [guardandoProv, setGuardandoProv] = useState(false)

  const cargar = () =>
    fetchPagosProveedor({ año, trimestre: trimestre || undefined }).then(setPagos)

  useEffect(() => { cargar() }, [año, trimestre])
  useEffect(() => { fetchProveedores().then(setProveedores) }, [])

  const totalGastado = pagos.reduce((s, p) => s + parseFloat(p.importe || 0), 0)

  // Recalcular importe cuando cambia base o IVA (con desglose activo)
  const handleBaseIvaChange = (campo, valor) => {
    setForm(f => {
      const next = { ...f, [campo]: valor }
      if (next.desglosarIva && next.base_imponible !== '') {
        const base = parseFloat(next.base_imponible) || 0
        const pct = parseFloat(next.iva_porcentaje) || 0
        const iva = Math.round(base * pct) / 100
        next.iva_importe = iva.toFixed(2)
        next.importe = (base + iva).toFixed(2)
      }
      return next
    })
  }

  const handleToggleIva = () => {
    setForm(f => {
      const desglosarIva = !f.desglosarIva
      if (!desglosarIva) {
        return { ...f, desglosarIva, base_imponible: '', iva_importe: '' }
      }
      return { ...f, desglosarIva }
    })
  }

  const handleGuardar = async () => {
    if (!form.concepto.trim()) return setErrForm('El concepto es obligatorio.')
    if (!form.importe || isNaN(form.importe)) return setErrForm('Importe inválido.')
    setErrForm('')
    setGuardando(true)
    try {
      const payload = {
        proveedor_id: form.proveedor_id || null,
        fecha: form.fecha,
        concepto: form.concepto,
        importe: parseFloat(form.importe),
        forma_pago: form.forma_pago,
        referencia: form.referencia || null,
        categoria: form.categoria,
        base_imponible: form.base_imponible !== '' ? parseFloat(form.base_imponible) : null,
        iva_porcentaje: form.desglosarIva ? parseFloat(form.iva_porcentaje) : null,
        iva_importe: form.iva_importe !== '' ? parseFloat(form.iva_importe) : null,
      }
      await registrarPagoProveedor(payload)
      setForm(formVacio)
      setMostrarForm(false)
      await cargar()
    } catch (e) {
      setErrForm(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    if (!modalEliminar) return
    try {
      await eliminarPagoProveedor(modalEliminar.id)
      setModalEliminar(null)
      await cargar()
    } catch (e) {
      console.error(e)
    }
  }

  const handleCrearProveedor = async () => {
    if (!nuevoProveedor.nombre.trim()) return
    setGuardandoProv(true)
    try {
      const prov = await crearProveedor(nuevoProveedor)
      setProveedores(prev => [...prev, prov].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setForm(f => ({ ...f, proveedor_id: prov.id }))
      setModalProveedor(false)
      setNuevoProveedor({ nombre: '', telefono: '', email: '' })
    } catch (e) {
      console.error(e)
    } finally {
      setGuardandoProv(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {/* Cabecera filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="font-display text-2xl text-[--text-dark] mr-auto">Pagos a Proveedores</h1>
          <select
            value={año}
            onChange={e => setAño(Number(e.target.value))}
            className="border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
          >
            {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={trimestre}
            onChange={e => setTrimestre(Number(e.target.value))}
            className="border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value={0}>Todos</option>
            <option value={1}>T1 (Ene–Mar)</option>
            <option value={2}>T2 (Abr–Jun)</option>
            <option value={3}>T3 (Jul–Sep)</option>
            <option value={4}>T4 (Oct–Dic)</option>
          </select>

          <button
            onClick={() => exportarLibroPagos(pagos, { trimestre: trimestre || undefined, año })}
            className="flex items-center gap-2 border border-[--border] bg-white text-[--text-medium] px-4 py-2 rounded-md text-sm hover:border-primary hover:text-primary transition-colors"
          >
            <Download size={15} />
            Exportar Excel
          </button>

          <button
            onClick={() => setMostrarForm(v => !v)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors"
          >
            <Plus size={15} />
            Registrar gasto
          </button>
        </div>

        {/* Tarjeta resumen */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-[--border] rounded-lg px-4 py-3">
            <p className="text-xs text-[--text-light] mb-0.5">Total gastado</p>
            <p className="text-base font-bold text-amber-600">{formatImporte(totalGastado)}</p>
          </div>
        </div>

        {/* Formulario inline */}
        {mostrarForm && (
          <div className="bg-white border border-[--border] rounded-xl p-5 mb-6 space-y-4">
            <h3 className="font-semibold text-[--text] text-sm">Nuevo gasto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proveedor (opcional) */}
              <div>
                <label className="block text-xs text-[--text-light] mb-1">Proveedor (opcional)</label>
                <div className="flex gap-2">
                  <select
                    value={form.proveedor_id}
                    onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))}
                    className="flex-1 border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="">— Sin proveedor (gasto general) —</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setModalProveedor(true)}
                    className="text-xs border border-dashed border-[--border] px-2 rounded-md text-[--text-light] hover:border-primary hover:text-primary transition-colors"
                    title="Nuevo proveedor"
                  >＋</button>
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs text-[--text-light] mb-1">Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
                />
              </div>

              {/* Categoría (obligatorio) */}
              <div>
                <label className="block text-xs text-[--text-light] mb-1">Categoría *</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
                >
                  {Object.entries(CATEGORIA_GASTO_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-xs text-[--text-light] mb-1">Concepto *</label>
                <input
                  type="text"
                  value={form.concepto}
                  onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
                  placeholder="Descripción del gasto"
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
                />
              </div>

              {/* Toggle IVA + Importe */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-xs text-[--text-light]">Desglosar IVA</label>
                  <button
                    type="button"
                    onClick={handleToggleIva}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.desglosarIva ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.desglosarIva ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>

                {form.desglosarIva ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-[--text-light] mb-1">Base imponible (€)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.base_imponible}
                        onChange={e => handleBaseIvaChange('base_imponible', e.target.value)}
                        className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[--text-light] mb-1">% IVA</label>
                      <input
                        type="number" min="0" step="0.5"
                        value={form.iva_porcentaje}
                        onChange={e => handleBaseIvaChange('iva_porcentaje', e.target.value)}
                        className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[--text-light] mb-1">Total (auto)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.importe}
                        readOnly
                        className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-[--text-light] mb-1">Importe (€) *</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={form.importe}
                      onChange={e => setForm(f => ({ ...f, importe: e.target.value }))}
                      className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Forma de pago */}
              <div>
                <label className="block text-xs text-[--text-light] mb-1">Forma de pago</label>
                <select
                  value={form.forma_pago}
                  onChange={e => setForm(f => ({ ...f, forma_pago: e.target.value }))}
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
                >
                  {FORMAS_PAGO.map(fp => (
                    <option key={fp} value={fp}>{FORMA_PAGO_LABELS[fp]}</option>
                  ))}
                </select>
              </div>

              {/* Referencia */}
              <div>
                <label className="block text-xs text-[--text-light] mb-1">Referencia</label>
                <input
                  type="text"
                  value={form.referencia}
                  onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
                  placeholder="Nº factura, albarán…"
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            {errForm && <p className="text-xs text-red-500">{errForm}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setMostrarForm(false); setForm(formVacio); setErrForm('') }}
                className="px-4 py-2 text-sm rounded-md border border-[--border] text-[--text-medium] hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de pagos */}
        {loading ? (
          <p className="text-sm text-[--text-light] text-center py-12">Cargando...</p>
        ) : pagos.length === 0 ? (
          <p className="text-sm text-[--text-light] text-center py-12">No hay gastos registrados en este período.</p>
        ) : (
          <div className="bg-white border border-[--border] rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[100px_130px_120px_1fr_110px_90px_40px] gap-4 px-4 py-3 bg-gray-50 border-b border-[--border] text-xs font-semibold text-[--text-light] uppercase tracking-wide">
              <span>Fecha</span>
              <span>Proveedor</span>
              <span>Categoría</span>
              <span>Concepto</span>
              <span>Forma pago</span>
              <span className="text-right">Importe</span>
              <span />
            </div>

            {pagos.map((p, i) => (
              <div
                key={p.id}
                className={`grid md:grid-cols-[100px_130px_120px_1fr_110px_90px_40px] gap-1 md:gap-4 px-4 py-3 text-sm border-b border-[--border] last:border-0 items-center ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
              >
                <span className="text-[--text-light] text-xs md:text-sm">{formatFecha(p.fecha)}</span>
                <span className="text-[--text]">{p.proveedores?.nombre ?? <span className="text-[--text-light] italic text-xs">Sin proveedor</span>}</span>
                <span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-[--text-light]">
                    {CATEGORIA_GASTO_LABELS[p.categoria] ?? p.categoria ?? '—'}
                  </span>
                </span>
                <span className="text-[--text-medium]">{p.concepto}</span>
                <span className="text-[--text-light] text-xs md:text-sm">{FORMA_PAGO_LABELS[p.forma_pago] ?? p.forma_pago}</span>
                <span className="md:text-right font-semibold text-amber-700">{formatImporte(p.importe)}</span>
                <button
                  onClick={() => setModalEliminar({ id: p.id, concepto: p.concepto })}
                  className="text-gray-300 hover:text-red-400 transition-colors justify-self-end"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmar eliminar */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-[--text] mb-2">Eliminar gasto</h3>
            <p className="text-sm text-[--text-medium] mb-6">
              ¿Eliminar <strong>{modalEliminar.concepto}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar(null)}
                className="flex-1 border border-[--border] rounded-md px-4 py-2 text-sm text-[--text-medium] hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                className="flex-1 bg-red-500 text-white rounded-md px-4 py-2 text-sm hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini-modal nuevo proveedor */}
      {modalProveedor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[--text]">Nuevo proveedor</h3>
              <button onClick={() => setModalProveedor(false)}><X size={18} className="text-[--text-light]" /></button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre *"
                value={nuevoProveedor.nombre}
                onChange={e => setNuevoProveedor(p => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={nuevoProveedor.telefono}
                onChange={e => setNuevoProveedor(p => ({ ...p, telefono: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={nuevoProveedor.email}
                onChange={e => setNuevoProveedor(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModalProveedor(false)}
                className="flex-1 border border-[--border] rounded-md px-4 py-2 text-sm text-[--text-medium] hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearProveedor}
                disabled={guardandoProv || !nuevoProveedor.nombre.trim()}
                className="flex-1 bg-primary text-white rounded-md px-4 py-2 text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {guardandoProv ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
