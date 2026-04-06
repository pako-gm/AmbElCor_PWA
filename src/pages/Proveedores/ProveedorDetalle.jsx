import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Pencil, Trash2, Check, X, AlertTriangle } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchProveedor, actualizarProveedor, eliminarProveedor } from '@/hooks/useProveedores'
import { formatFecha, formatImporte, FORMA_PAGO_LABELS } from '@/utils/formatters'

export default function ProveedorDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proveedor, setProveedor] = useState(null)
  const [loading, setLoading] = useState(true)

  // Edición
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({})
  const [erroresEdit, setErroresEdit] = useState({})
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  // Confirmación eliminar
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = () => {
    setLoading(true)
    fetchProveedor(id).then(p => {
      setProveedor(p)
      setFormEdit({
        nombre: p.nombre,
        contacto: p.contacto ?? '',
        telefono: p.telefono ?? '',
        email: p.email ?? '',
        notas: p.notas ?? '',
      })
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [id])

  const validarEdit = () => {
    const errs = {}
    if (!formEdit.nombre?.trim()) errs.nombre = 'El nombre es obligatorio.'
    if (formEdit.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEdit.email)) errs.email = 'Email no válido.'
    setErroresEdit(errs)
    return Object.keys(errs).length === 0
  }

  const handleGuardarDatos = async () => {
    if (!validarEdit()) return
    setGuardandoEdit(true)
    try {
      await actualizarProveedor(id, {
        nombre: formEdit.nombre,
        contacto: formEdit.contacto || null,
        telefono: formEdit.telefono || null,
        email: formEdit.email || null,
        notas: formEdit.notas || null,
      })
      setEditando(false)
      cargar()
    } catch (e) { console.error(e) }
    finally { setGuardandoEdit(false) }
  }

  const handleEliminar = async () => {
    try {
      await eliminarProveedor(id)
      navigate('/proveedores')
    } catch (e) {
      setErrorEliminar(e.message)
    }
  }

  if (loading) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Cargando…</div></PageWrapper>
  if (!proveedor) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Proveedor no encontrado.</div></PageWrapper>

  const pagos = (proveedor.pagos_proveedor ?? []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  const totalGastado = pagos.reduce((s, p) => s + parseFloat(p.importe || 0), 0)
  const inventario = proveedor.inventario ?? []

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/proveedores')} className="text-[--text-light] hover:text-[--text-dark]">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl text-[--text-dark]">{proveedor.nombre}</h1>
            <p className="text-xs text-[--text-light]">Proveedor desde {formatFecha(proveedor.created_at)}</p>
          </div>
          <button
            onClick={() => { setEditando(true); setErroresEdit({}) }}
            className="text-[--text-light] hover:text-primary transition-colors"
            title="Editar datos"
          >
            <Pencil size={17} />
          </button>
          <button
            onClick={() => { setConfirmDelete(true); setErrorEliminar('') }}
            className="text-[--text-light] hover:text-red-500 transition-colors"
            title="Eliminar proveedor"
          >
            <Trash2 size={17} />
          </button>
        </div>

        {/* Datos de contacto */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Datos de contacto</h2>

          {editando ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-[--text-light]">Nombre *</label>
                <input
                  type="text"
                  value={formEdit.nombre}
                  onChange={e => setFormEdit(v => ({ ...v, nombre: e.target.value }))}
                  className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${erroresEdit.nombre ? 'border-red-400' : 'border-[--border]'}`}
                />
                {erroresEdit.nombre && <p className="text-xs text-red-500">{erroresEdit.nombre}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[--text-light]">Persona de contacto</label>
                <input
                  type="text"
                  value={formEdit.contacto}
                  onChange={e => setFormEdit(v => ({ ...v, contacto: e.target.value }))}
                  className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[--text-light]">Teléfono</label>
                  <input
                    type="tel"
                    value={formEdit.telefono}
                    onChange={e => setFormEdit(v => ({ ...v, telefono: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                    className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[--text-light]">Email</label>
                  <input
                    type="email"
                    value={formEdit.email}
                    onChange={e => setFormEdit(v => ({ ...v, email: e.target.value }))}
                    className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${erroresEdit.email ? 'border-red-400' : 'border-[--border]'}`}
                  />
                  {erroresEdit.email && <p className="text-xs text-red-500">{erroresEdit.email}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[--text-light]">Notas</label>
                <textarea
                  value={formEdit.notas}
                  onChange={e => setFormEdit(v => ({ ...v, notas: e.target.value }))}
                  rows={2}
                  className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGuardarDatos}
                  disabled={guardandoEdit}
                  className="flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  <Check size={13} /> {guardandoEdit ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  onClick={() => { setEditando(false); setErroresEdit({}) }}
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
                >
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-sm">
              {proveedor.contacto && <p className="text-[--text-dark]">👤 {proveedor.contacto}</p>}
              {proveedor.telefono && <p className="text-[--text-dark]">📞 {proveedor.telefono}</p>}
              {proveedor.email && <p className="text-[--text-dark]">✉️ {proveedor.email}</p>}
              {proveedor.notas && <p className="text-[--text-light] text-xs mt-2">{proveedor.notas}</p>}
              {!proveedor.contacto && !proveedor.telefono && !proveedor.email && !proveedor.notas && (
                <p className="text-[--text-light] text-xs">Sin datos de contacto.</p>
              )}
            </div>
          )}
        </section>

        {/* Historial de pagos */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[--text-medium]">Historial de pagos</h2>
            <div className="text-right">
              <p className="text-xs text-[--text-light]">Total gastado</p>
              <p className="text-sm font-semibold text-[--text-dark]">{formatImporte(totalGastado)}</p>
            </div>
          </div>

          {pagos.length === 0 ? (
            <p className="text-xs text-[--text-light]">Sin pagos registrados.</p>
          ) : (
            <div className="space-y-2">
              {pagos.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-md border border-[--border] text-sm">
                  <div>
                    <p className="text-[--text-dark] font-medium">{p.concepto}</p>
                    <p className="text-xs text-[--text-light] mt-0.5">
                      {formatFecha(p.fecha)} · {FORMA_PAGO_LABELS[p.forma_pago] ?? p.forma_pago}
                      {p.referencia && ` · ${p.referencia}`}
                    </p>
                  </div>
                  <p className="font-semibold text-[--text-dark]">{formatImporte(p.importe)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Inventario asociado */}
        {inventario.length > 0 && (
          <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[--text-medium]">Materiales / Inventario</h2>
            <div className="space-y-2">
              {inventario.map(item => {
                const stockBajo = item.stock_minimo != null && item.stock < item.stock_minimo
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-md border border-[--border] text-sm">
                    <div className="flex items-center gap-2">
                      {stockBajo && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />}
                      <p className="text-[--text-dark]">{item.nombre}</p>
                    </div>
                    <p className={`text-sm font-medium ${stockBajo ? 'text-amber-600' : 'text-[--text-dark]'}`}>
                      {item.stock} {item.unidad ?? ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </div>

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setConfirmDelete(false)}
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
                <h3 className="font-display text-base text-[--text-dark]">Eliminar proveedor</h3>
                <p className="text-xs text-[--text-light]">¿Eliminar a {proveedor.nombre}? Esta acción no se puede deshacer.</p>
              </div>
            </div>
            {errorEliminar && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded">{errorEliminar}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 text-sm border border-[--border] px-4 py-2 rounded-md text-[--text-medium] hover:bg-[--bg-alt] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                className="flex-1 text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
