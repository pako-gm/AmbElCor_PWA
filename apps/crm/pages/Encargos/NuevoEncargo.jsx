import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Trash2, UserPlus, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import PageWrapper from '@/components/layout/PageWrapper'
import {
  crearEncargo, fetchTodosClientes, fetchCatalogo
} from '@/hooks/useEncargos'
import { formatImporte } from '@/utils/formatters'
import { sanitizers } from '@/utils/validators'
import { useToast } from '@/hooks/useToast'

function lineaVacia() {
  return { _id: Date.now() + Math.random(), prenda_id: '', descripcion: '', cantidad: 1, precio_unitario: '', precio_base: '', descuento: '', notas: '' }
}

export default function NuevoEncargo() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [erroresForm, setErroresForm] = useState({ cliente: false, fechaEntrega: false, lineas: new Set() })

  // Cliente
  const [clienteQuery, setClienteQuery] = useState('')
  const [todosClientes, setTodosClientes] = useState([])
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
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

  // Restaurar borrador, cliente o prenda recién creados al volver de Clientes/Catálogo
  useEffect(() => {
    const st = location.state
    if (!st) return
    let base = null
    if (st.draft) {
      if (st.draft.fechaEntrega != null) setFechaEntrega(st.draft.fechaEntrega)
      if (st.draft.notas != null) setNotas(st.draft.notas)
      if (Array.isArray(st.draft.lineas) && st.draft.lineas.length) base = st.draft.lineas
    }
    if (st.nuevaPrenda) {
      setCatalogo(prev => prev.some(p => p.id === st.nuevaPrenda.id) ? prev : [...prev, st.nuevaPrenda])
      base = (base ?? lineas).map(x => x._id === st.lineaId
        ? { ...x, prenda_id: st.nuevaPrenda.id, descripcion: st.nuevaPrenda.nombre, precio_unitario: String(st.nuevaPrenda.precio_base), precio_base: st.nuevaPrenda.precio_base }
        : x)
    }
    if (base) setLineas(base)
    if (st.nuevoCliente) seleccionarCliente(st.nuevoCliente)
    // Limpiar el state para que no se reaplique al recargar
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clientesFiltrados = mostrarDropdown && !clienteSeleccionado
    ? todosClientes.filter(c => {
        if (!clienteQuery) return true
        const q = clienteQuery.toLowerCase()
        return (
          c.nombre?.toLowerCase().includes(q) ||
          c.apellidos?.toLowerCase().includes(q)
        )
      })
    : []

  const handleFocoCliente = () => {
    if (todosClientes.length === 0) {
      fetchTodosClientes().then(setTodosClientes).catch(console.error)
    }
    setMostrarDropdown(true)
  }

  const handleBlurCliente = () => {
    setTimeout(() => setMostrarDropdown(false), 150)
  }

  const seleccionarCliente = (c) => {
    setClienteSeleccionado(c)
    setClienteQuery(`${c.nombre} ${c.apellidos ?? ''}`.trim())
    setMostrarDropdown(false)
    setErroresForm(prev => ({ ...prev, cliente: false }))
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
          updated.descripcion = prenda.nombre
          updated.precio_unitario = String(prenda.precio_base)
          updated.precio_base = prenda.precio_base
        }
      }
      return updated
    }))
    if (campo === 'prenda_id' && valor) {
      setErroresForm(prev => {
        const lineas = new Set(prev.lineas)
        lineas.delete(id)
        return { ...prev, lineas }
      })
    }
  }

  const total = lineas.reduce(
    (s, l) => s + (parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1) - (parseFloat(l.descuento) || 0), 0
  )

  const handleGuardar = async () => {
    const errs = {
      cliente: !clienteSeleccionado,
      fechaEntrega: !fechaEntrega || fechaEntrega < new Date().toISOString().slice(0, 10),
      lineas: new Set(lineas.filter(l => !l.prenda_id).map(l => l._id))
    }
    if (errs.cliente || errs.fechaEntrega || errs.lineas.size > 0) {
      setErroresForm(errs)
      setError(errs.cliente ? 'Selecciona un cliente.' : errs.fechaEntrega ? 'La fecha de entrega debe ser igual o posterior a hoy.' : 'Selecciona una prenda del catálogo en todas las líneas.')
      return
    }
    setErroresForm({ cliente: false, fechaEntrega: false, lineas: new Set() })
    setSaving(true)
    setError('')
    try {
      const encargo = await crearEncargo({
        cliente_id: clienteSeleccionado.id,
        fecha_entrega_estimada: fechaEntrega,
        notas,
        lineas,
      })
      toast.success('Encargo creado.')
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
        <PageHeader titulo="Nuevo encargo" backTo="/encargos" />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
            {error}
          </div>
        )}

        {/* Cliente */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className={`text-sm font-semibold ${erroresForm.cliente ? 'text-red-500' : 'text-[--text-medium]'}`}>Cliente</h2>
          <div className="relative" ref={sugerenciasRef}>
            <input
              type="text"
              placeholder="Buscar cliente por nombre…"
              value={clienteQuery}
              onChange={e => { setClienteQuery(sanitizers.texto(e.target.value)); setClienteSeleccionado(null) }}
              onFocus={handleFocoCliente}
              onBlur={handleBlurCliente}
              className={`w-full border rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${erroresForm.cliente ? 'border-red-400' : 'border-[--border]'}`}
            />
            {clienteQuery && (
              <button
                type="button"
                onClick={() => { setClienteQuery(''); setClienteSeleccionado(null); setMostrarDropdown(false) }}
                aria-label="Limpiar cliente"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[--text-light] hover:text-[--text-dark]"
              >
                <X size={15} />
              </button>
            )}
            {clientesFiltrados.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-[--border] rounded-md shadow-lg text-sm max-h-56 overflow-y-auto">
                {clientesFiltrados.map(c => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
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
          <button
            type="button"
            onClick={() => navigate('/clientes/nuevo', {
              state: { from: 'nuevo-encargo', draft: { fechaEntrega, notas, lineas } },
            })}
            className="flex items-center gap-1.5 text-xs text-[--text-medium] hover:text-primary"
          >
            <UserPlus size={13} />
            Crear nuevo cliente
          </button>
        </section>

        {/* Detalles */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Detalles</h2>
          <div>
            <label className={`block text-xs mb-1 ${erroresForm.fechaEntrega ? 'text-red-500' : 'text-[--text-light]'}`}>Fecha de entrega estimada *</label>
            <input
              type="date"
              value={fechaEntrega}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => { setFechaEntrega(e.target.value); if (e.target.value >= new Date().toISOString().slice(0, 10)) setErroresForm(prev => ({ ...prev, fechaEntrega: false })) }}
              className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${erroresForm.fechaEntrega ? 'border-red-400' : 'border-[--border]'}`}
            />
          </div>
          <div>
            <label className="block text-xs text-[--text-light] mb-1">Notas del encargo</label>
            <textarea
              value={notas}
              onChange={e => setNotas(sanitizers.texto(e.target.value))}
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
                    aria-label={`Eliminar prenda ${idx + 1}`}
                    className="text-[--text-light] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Selector catálogo */}
              <div>
                <label className={`block text-xs mb-1 ${erroresForm.lineas.has(l._id) ? 'text-red-500' : 'text-[--text-light]'}`}>Prenda *</label>
                <select
                  value={l.prenda_id}
                  onChange={e => updateLinea(l._id, 'prenda_id', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white ${erroresForm.lineas.has(l._id) ? 'border-red-400' : 'border-[--border]'}`}
                >
                  <option value="">— Seleccionar prenda —</option>
                  {catalogo.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({formatImporte(p.precio_base)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => navigate('/catalogo/nueva', {
                    state: { from: 'nuevo-encargo', draft: { fechaEntrega, notas, lineas }, lineaId: l._id },
                  })}
                  className="flex items-center gap-1 text-xs text-[--text-light] hover:text-primary mt-1"
                >
                  <Plus size={11} />
                  Nueva prenda en el catálogo
                </button>
              </div>

              <div className="flex gap-3">
                <div className="w-24">
                  <label className="block text-xs text-[--text-light] mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={l.cantidad}
                    onChange={e => updateLinea(l._id, 'cantidad', sanitizers.entero(e.target.value))}
                    className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-[--text-light] mb-1">Precio unitario (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={l.precio_unitario}
                    onChange={e => updateLinea(l._id, 'precio_unitario', sanitizers.decimal(e.target.value).replace(',', '.'))}
                    placeholder="0,00"
                    className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-[--text-light] mb-1">Descuento (€)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.50"
                    value={l.descuento}
                    onChange={e => updateLinea(l._id, 'descuento', sanitizers.importe(e.target.value))}
                    placeholder="0,00"
                    className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {(() => {
                const antes = (parseFloat(l.precio_unitario) || 0) * (parseInt(l.cantidad) || 1)
                const descuento = parseFloat(l.descuento) || 0
                const despues = antes - descuento
                return descuento > 0 ? (
                  <p className="text-sm font-medium pb-1">
                    <span className="text-[--text-light] line-through mr-2">{formatImporte(antes)}</span>
                    <span className="text-primary-dark">{formatImporte(despues)}</span>
                  </p>
                ) : (
                  <p className="text-sm font-medium text-[--text-medium] pb-1">= {formatImporte(antes)}</p>
                )
              })()}

              <div>
                <label className="block text-xs text-[--text-light] mb-1">Notas de esta prenda</label>
                <input
                  value={l.notas}
                  onChange={e => updateLinea(l._id, 'notas', sanitizers.texto(e.target.value))}
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
          <Button size="lg" onClick={handleGuardar} loading={saving}>
            {saving ? 'Guardando…' : 'Guardar encargo'}
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
