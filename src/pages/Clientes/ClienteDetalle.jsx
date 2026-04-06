import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Pencil, Trash2, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchCliente, actualizarCliente, eliminarCliente } from '@/hooks/useClientes'
import { formatFecha, formatImporte, ESTADO_LABELS, ESTADO_COLORS } from '@/utils/formatters'

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)

  // Edición datos contacto
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({})
  const [erroresEdit, setErroresEdit] = useState({})
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  // Edición medidas
  const [editandoMedidas, setEditandoMedidas] = useState(false)
  const [formMedidas, setFormMedidas] = useState({})
  const [guardandoMedidas, setGuardandoMedidas] = useState(false)

  // Sección medidas visible
  const [mostrarMedidas, setMostrarMedidas] = useState(false)

  // Confirmación eliminar
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = () => {
    setLoading(true)
    fetchCliente(id).then(c => {
      setCliente(c)
      setFormEdit({ nombre: c.nombre, apellidos: c.apellidos ?? '', telefono: c.telefono ?? '', email: c.email ?? '', notas: c.notas ?? '' })
      setFormMedidas(c.medidas_base ?? { pecho: '', cintura: '', cadera: '', talla: '', largo_espalda: '', notas: '' })
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [id])

  const validarEdit = () => {
    const errs = {}
    if (!formEdit.nombre?.trim()) errs.nombre = 'El nombre es obligatorio.'
    if (formEdit.telefono && !/^\d{9}$/.test(formEdit.telefono)) errs.telefono = 'Debe tener 9 dígitos.'
    if (formEdit.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEdit.email)) errs.email = 'Email no válido.'
    setErroresEdit(errs)
    return Object.keys(errs).length === 0
  }

  const handleGuardarDatos = async () => {
    if (!validarEdit()) return
    setGuardandoEdit(true)
    try {
      await actualizarCliente(id, {
        nombre: formEdit.nombre,
        apellidos: formEdit.apellidos || null,
        telefono: formEdit.telefono || null,
        email: formEdit.email || null,
        notas: formEdit.notas || null,
      })
      setEditando(false)
      cargar()
    } catch (e) { console.error(e) }
    finally { setGuardandoEdit(false) }
  }

  const handleGuardarMedidas = async () => {
    setGuardandoMedidas(true)
    try {
      await actualizarCliente(id, { medidas_base: formMedidas })
      setEditandoMedidas(false)
      cargar()
    } catch (e) { console.error(e) }
    finally { setGuardandoMedidas(false) }
  }

  const handleEliminar = async () => {
    try {
      await eliminarCliente(id)
      navigate('/clientes')
    } catch (e) {
      setErrorEliminar(e.message)
    }
  }

  if (loading) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Cargando…</div></PageWrapper>
  if (!cliente) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Cliente no encontrado.</div></PageWrapper>

  const nombreCompleto = `${cliente.nombre} ${cliente.apellidos ?? ''}`.trim()
  const encargos = (cliente.encargos ?? []).sort((a, b) => new Date(b.fecha_encargo) - new Date(a.fecha_encargo))
  const totalFacturado = encargos.reduce((s, e) => s + (parseFloat(e.precio_total) || 0), 0)
  const medidas = cliente.medidas_base ?? {}
  const tieneMedidas = Object.values(medidas).some(v => v)

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clientes')} className="text-[--text-light] hover:text-[--text-dark]">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl text-[--text-dark]">{nombreCompleto}</h1>
            <p className="text-xs text-[--text-light]">Cliente desde {formatFecha(cliente.created_at)}</p>
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
            title="Eliminar cliente"
          >
            <Trash2 size={17} />
          </button>
        </div>

        {/* Datos de contacto */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Datos de contacto</h2>

          {editando ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-xs text-[--text-light]">Apellidos</label>
                  <input
                    type="text"
                    value={formEdit.apellidos}
                    onChange={e => setFormEdit(v => ({ ...v, apellidos: e.target.value }))}
                    className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[--text-light]">Teléfono</label>
                  <input
                    type="tel"
                    value={formEdit.telefono}
                    onChange={e => setFormEdit(v => ({ ...v, telefono: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                    className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${erroresEdit.telefono ? 'border-red-400' : 'border-[--border]'}`}
                  />
                  {erroresEdit.telefono && <p className="text-xs text-red-500">{erroresEdit.telefono}</p>}
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
              {cliente.telefono && <p className="text-[--text-dark]">📞 {cliente.telefono}</p>}
              {cliente.email && <p className="text-[--text-dark]">✉️ {cliente.email}</p>}
              {cliente.notas && <p className="text-[--text-light] text-xs mt-2">{cliente.notas}</p>}
              {!cliente.telefono && !cliente.email && !cliente.notas && (
                <p className="text-[--text-light] text-xs">Sin datos de contacto</p>
              )}
            </div>
          )}
        </section>

        {/* Medidas base */}
        <section className="bg-white rounded-lg border border-[--border] overflow-hidden">
          <button
            type="button"
            onClick={() => setMostrarMedidas(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[--text-medium] hover:bg-[--bg-alt] transition-colors"
          >
            <span>Medidas base {tieneMedidas && <span className="text-xs font-normal text-primary ml-1">registradas</span>}</span>
            {mostrarMedidas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {mostrarMedidas && (
            <div className="px-4 pb-4 space-y-3 border-t border-[--border]">
              {editandoMedidas ? (
                <>
                  <p className="text-xs text-[--text-light] pt-3">Medidas en centímetros</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'pecho', label: 'Pecho' },
                      { key: 'cintura', label: 'Cintura' },
                      { key: 'cadera', label: 'Cadera' },
                      { key: 'largo_espalda', label: 'Largo espalda' },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-xs text-[--text-light]">{label} (cm)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={formMedidas[key] ?? ''}
                          onChange={e => setFormMedidas(v => ({ ...v, [key]: e.target.value }))}
                          className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                    <div className="space-y-1">
                      <label className="text-xs text-[--text-light]">Talla</label>
                      <input
                        type="text"
                        placeholder="38, M, L…"
                        value={formMedidas.talla ?? ''}
                        onChange={e => setFormMedidas(v => ({ ...v, talla: e.target.value }))}
                        className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[--text-light]">Notas de medidas</label>
                    <textarea
                      value={formMedidas.notas ?? ''}
                      onChange={e => setFormMedidas(v => ({ ...v, notas: e.target.value }))}
                      rows={2}
                      className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGuardarMedidas}
                      disabled={guardandoMedidas}
                      className="flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded hover:bg-primary-dark disabled:opacity-50 transition-colors"
                    >
                      <Check size={13} /> {guardandoMedidas ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => { setEditandoMedidas(false); setFormMedidas(cliente.medidas_base ?? {}) }}
                      className="flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
                    >
                      <X size={13} /> Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-3 space-y-2">
                  {tieneMedidas ? (
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      {medidas.pecho && <p><span className="text-xs text-[--text-light]">Pecho:</span> {medidas.pecho} cm</p>}
                      {medidas.cintura && <p><span className="text-xs text-[--text-light]">Cintura:</span> {medidas.cintura} cm</p>}
                      {medidas.cadera && <p><span className="text-xs text-[--text-light]">Cadera:</span> {medidas.cadera} cm</p>}
                      {medidas.largo_espalda && <p><span className="text-xs text-[--text-light]">Largo espalda:</span> {medidas.largo_espalda} cm</p>}
                      {medidas.talla && <p><span className="text-xs text-[--text-light]">Talla:</span> {medidas.talla}</p>}
                      {medidas.notas && <p className="col-span-2 text-xs text-[--text-light]">{medidas.notas}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-[--text-light]">Sin medidas registradas.</p>
                  )}
                  <button
                    onClick={() => { setEditandoMedidas(true); setFormMedidas(medidas) }}
                    className="text-xs text-primary hover:underline"
                  >
                    {tieneMedidas ? 'Editar medidas' : 'Añadir medidas'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Encargos */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[--text-medium]">Encargos</h2>
            <div className="text-right">
              <p className="text-xs text-[--text-light]">Total facturado</p>
              <p className="text-sm font-semibold text-[--text-dark]">{formatImporte(totalFacturado)}</p>
            </div>
          </div>

          {encargos.length === 0 ? (
            <p className="text-xs text-[--text-light]">Sin encargos registrados.</p>
          ) : (
            <div className="space-y-2">
              {encargos.map(e => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/encargos/${e.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-md border border-[--border] hover:border-primary transition-colors text-left"
                >
                  <div>
                    <p className="text-xs text-[--text-light]">{e.numero}</p>
                    <p className="text-xs text-[--text-light] mt-0.5">
                      {formatFecha(e.fecha_encargo)}
                      {e.encargo_lineas?.length > 0 && ` · ${e.encargo_lineas.length} prenda${e.encargo_lineas.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[e.estado]}`}>
                      {ESTADO_LABELS[e.estado]}
                    </span>
                    <p className="text-sm font-semibold text-[--text-dark]">{formatImporte(e.precio_total)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

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
                <h3 className="font-display text-base text-[--text-dark]">Eliminar cliente</h3>
                <p className="text-xs text-[--text-light]">¿Eliminar a {nombreCompleto}? Esta acción no se puede deshacer.</p>
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
