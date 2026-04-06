import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronLeft, UserPlus } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import {
  crearEncargo, buscarClientes, crearClienteRapido, fetchCatalogo
} from '@/hooks/useEncargos'
import { formatImporte } from '@/utils/formatters'

function lineaVacia() {
  return { _id: Date.now() + Math.random(), prenda_id: '', descripcion: '', cantidad: 1, precio_unitario: '', medidas_ajuste: '', notas: '' }
}

export default function NuevoEncargo() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Cliente
  const [clienteQuery, setClienteQuery] = useState('')
  const [sugerencias, setSugerencias] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', apellidos: '', telefono: '', email: '' })
  const [erroresCliente, setErroresCliente] = useState({})
  const sugerenciasRef = useRef(null)

  // Catálogo
  const [catalogo, setCatalogo] = useState([])

  // Formulario encargo
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState([lineaVacia()])

  useEffect(() => {
    fetchCatalogo().then(setCatalogo).catch(console.error)
  }, [])

  // Búsqueda de clientes con debounce
  useEffect(() => {
    if (!clienteQuery || clienteSeleccionado) { setSugerencias([]); return }
    const t = setTimeout(() => {
      buscarClientes(clienteQuery).then(setSugerencias).catch(() => setSugerencias([]))
    }, 250)
    return () => clearTimeout(t)
  }, [clienteQuery, clienteSeleccionado])

  const seleccionarCliente = (c) => {
    setClienteSeleccionado(c)
    setClienteQuery(`${c.nombre} ${c.apellidos ?? ''}`.trim())
    setSugerencias([])
  }

  const validarCliente = () => {
    const errs = {}
    if (!nuevoCliente.telefono || !/^\d{9}$/.test(nuevoCliente.telefono))
      errs.telefono = 'El teléfono debe tener exactamente 9 dígitos'
    if (nuevoCliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCliente.email))
      errs.email = 'Correo electrónico no válido'
    setErroresCliente(errs)
    return Object.keys(errs).length === 0
  }

  const crearCliente = async () => {
    if (!nuevoCliente.nombre.trim()) return
    if (!validarCliente()) return
    try {
      const c = await crearClienteRapido(nuevoCliente)
      seleccionarCliente(c)
      setMostrarFormCliente(false)
      setNuevoCliente({ nombre: '', apellidos: '', telefono: '', email: '' })
      setErroresCliente({})
    } catch (e) {
      setError('Error al crear cliente: ' + e.message)
    }
  }

  // Líneas
  const addLinea = () => setLineas(l => [...l, lineaVacia()])
  const removeLinea = (id) => setLineas(l => l.filter(x => x._id !== id))
  const updateLinea = (id, campo, valor) => {
    setLineas(l => l.map(x => {
      if (x._id !== id) return x
      const updated = { ...x, [campo]: valor }
      // Pre-rellenar precio si se selecciona prenda del catálogo
      if (campo === 'prenda_id' && valor) {
        const prenda = catalogo.find(p => p.id === valor)
        if (prenda) {
          const precio = prenda.precio_base * (1 - (prenda.descuento ?? 0) / 100)
          updated.descripcion = prenda.nombre
          updated.precio_unitario = precio.toFixed(2)
        }
      }
      return updated
    }))
  }

  const total = lineas.reduce(
    (s, l) => s + (parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1), 0
  )

  const handleGuardar = async () => {
    if (!clienteSeleccionado) { setError('Selecciona un cliente.'); return }
    if (lineas.some(l => !l.descripcion.trim())) { setError('Todas las líneas deben tener descripción.'); return }
    setSaving(true)
    setError('')
    try {
      const encargo = await crearEncargo({
        cliente_id: clienteSeleccionado.id,
        fecha_entrega_estimada: fechaEntrega || undefined,
        notas,
        lineas,
      })
      navigate(`/encargos/${encargo.id}`)
    } catch (e) {
      setError('Error al guardar: ' + e.message)
      setSaving(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/encargos')} className="text-[--text-light] hover:text-[--text-dark]">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-display text-2xl text-[--text-dark]">Nuevo encargo</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
            {error}
          </div>
        )}

        {/* Cliente */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Cliente</h2>
          <div className="relative" ref={sugerenciasRef}>
            <input
              type="text"
              placeholder="Buscar cliente por nombre…"
              value={clienteQuery}
              onChange={e => { setClienteQuery(e.target.value); setClienteSeleccionado(null) }}
              className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {sugerencias.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-[--border] rounded-md shadow-lg text-sm overflow-hidden">
                {sugerencias.map(c => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => seleccionarCliente(c)}
                      className="w-full text-left px-3 py-2 hover:bg-primary-light"
                    >
                      {c.nombre} {c.apellidos ?? ''}
                      {c.telefono && <span className="text-[--text-light] ml-2">{c.telefono}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {clienteSeleccionado && (
            <p className="text-xs text-primary">
              ✓ {clienteSeleccionado.nombre} {clienteSeleccionado.apellidos ?? ''}
            </p>
          )}
          <button
            type="button"
            onClick={() => setMostrarFormCliente(v => !v)}
            className="flex items-center gap-1.5 text-xs text-[--text-medium] hover:text-primary"
          >
            <UserPlus size={13} />
            Crear cliente nuevo
          </button>
          {mostrarFormCliente && (
            <div className="border border-[--border] rounded-md p-3 space-y-2 bg-[--bg-alt]">
              <input
                placeholder="Nombre *"
                value={nuevoCliente.nombre}
                onChange={e => setNuevoCliente(v => ({ ...v, nombre: e.target.value }))}
                className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                placeholder="Apellidos"
                value={nuevoCliente.apellidos}
                onChange={e => setNuevoCliente(v => ({ ...v, apellidos: e.target.value }))}
                className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div>
                <input
                  placeholder="Teléfono *"
                  value={nuevoCliente.telefono}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9)
                    setNuevoCliente(v => ({ ...v, telefono: val }))
                    setErroresCliente(prev => ({ ...prev, telefono: undefined }))
                  }}
                  className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${erroresCliente.telefono ? 'border-red-400' : 'border-[--border]'}`}
                />
                {erroresCliente.telefono && <p className="text-xs text-red-500 mt-0.5">{erroresCliente.telefono}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={nuevoCliente.email}
                  onChange={e => {
                    setNuevoCliente(v => ({ ...v, email: e.target.value }))
                    setErroresCliente(prev => ({ ...prev, email: undefined }))
                  }}
                  className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${erroresCliente.email ? 'border-red-400' : 'border-[--border]'}`}
                />
                {erroresCliente.email && <p className="text-xs text-red-500 mt-0.5">{erroresCliente.email}</p>}
              </div>
              <button
                type="button"
                onClick={crearCliente}
                className="bg-primary text-white text-xs px-4 py-1.5 rounded hover:bg-primary-dark transition-colors"
              >
                Guardar cliente
              </button>
            </div>
          )}
        </section>

        {/* Detalles */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Detalles</h2>
          <div>
            <label className="block text-xs text-[--text-light] mb-1">Fecha de entrega estimada</label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={e => setFechaEntrega(e.target.value)}
              className="border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-[--text-light] mb-1">Notas del encargo</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              placeholder="Observaciones generales…"
              className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </section>

        {/* Líneas de prendas */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Prendas</h2>
          {lineas.map((l, idx) => (
            <div key={l._id} className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[--text-light]">Prenda {idx + 1}</span>
                {lineas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLinea(l._id)}
                    className="text-[--text-light] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Selector catálogo o texto libre */}
              {catalogo.length > 0 && (
                <div>
                  <label className="block text-xs text-[--text-light] mb-1">Del catálogo (opcional)</label>
                  <select
                    value={l.prenda_id}
                    onChange={e => updateLinea(l._id, 'prenda_id', e.target.value)}
                    className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="">— Seleccionar prenda —</option>
                    {catalogo.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({formatImporte(p.precio_base * (1 - (p.descuento ?? 0) / 100))})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-[--text-light] mb-1">Descripción *</label>
                <input
                  value={l.descripcion}
                  onChange={e => updateLinea(l._id, 'descripcion', e.target.value)}
                  placeholder="Ej: Vestido de novia, falda plisada…"
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3">
                <div className="w-24">
                  <label className="block text-xs text-[--text-light] mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={l.cantidad}
                    onChange={e => updateLinea(l._id, 'cantidad', e.target.value)}
                    className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-[--text-light] mb-1">Precio unitario (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={l.precio_unitario}
                    onChange={e => updateLinea(l._id, 'precio_unitario', e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex-1 flex items-end">
                  <p className="text-sm font-medium text-[--text-medium] pb-2">
                    = {formatImporte((parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1))}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[--text-light] mb-1">Medidas de ajuste</label>
                <input
                  value={l.medidas_ajuste}
                  onChange={e => updateLinea(l._id, 'medidas_ajuste', e.target.value)}
                  placeholder="Ej: Pecho 90cm, Cintura 68cm, Cadera 96cm"
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs text-[--text-light] mb-1">Notas de esta prenda</label>
                <input
                  value={l.notas}
                  onChange={e => updateLinea(l._id, 'notas', e.target.value)}
                  placeholder="Observaciones específicas…"
                  className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addLinea}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-[--border] rounded-lg py-3 text-sm text-[--text-light] hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={15} />
            Añadir otra prenda
          </button>
        </section>

        {/* Total + Guardar */}
        <div className="bg-white rounded-lg border border-[--border] p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[--text-light]">Total estimado</p>
            <p className="text-xl font-semibold text-[--text-dark]">{formatImporte(total)}</p>
          </div>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="bg-primary text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar encargo'}
          </button>
        </div>
      </div>
    </PageWrapper>
  )
}
