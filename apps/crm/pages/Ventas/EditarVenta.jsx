import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import LoadingState from '@/components/ui/LoadingState'
import { fetchPrendasVendibles, fetchVenta, editarVenta } from '@/hooks/useVentas'
import { fetchTodosClientes } from '@/hooks/useEncargos'
import { useToast } from '@/hooks/useToast'
import { formatImporte, FORMA_PAGO_LABELS } from '@/utils/formatters'
import { sanitizers } from '@/utils/validators'

const FORMAS_PAGO = ['efectivo', 'transferencia', 'tarjeta', 'bizum']

let idLinea = 0
const nuevaLinea = () => ({ key: ++idLinea, prenda_id: '', cantidad: '1' })

export default function EditarVenta() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [prendas, setPrendas] = useState([])
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [formaPago, setFormaPago] = useState('efectivo')
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchPrendasVendibles(), fetchTodosClientes(), fetchVenta(id)])
      .then(([p, c, venta]) => {
        setPrendas(p)
        setClientes(c)
        setClienteId(venta.clientes?.id ?? '')
        setFormaPago(venta.forma_pago)
        setFecha(venta.fecha)
        setNotas(venta.notas ?? '')
        setLineas((venta.venta_lineas ?? []).map(l => ({
          key: ++idLinea,
          prenda_id: l.prendas_catalogo?.id ?? '',
          cantidad: String(l.cantidad),
          materialIdOriginal: l.materiales?.id ?? null,
          cantidadOriginal: parseFloat(l.cantidad) || 0,
        })))
      })
      .catch(e => setError('No se pudo cargar la venta: ' + e.message))
      .finally(() => setLoading(false))
  }, [id])

  // Cuanto se "devuelve" al stock de cada material al revertir esta venta —
  // para mostrar la disponibilidad real mientras se edita, no la ya descontada.
  const devueltoPorMaterial = useMemo(() => {
    const m = {}
    for (const l of lineas) {
      if (!l.materialIdOriginal) continue
      m[l.materialIdOriginal] = (m[l.materialIdOriginal] || 0) + l.cantidadOriginal
    }
    return m
  }, [lineas])

  const prendaPorId = useMemo(() => Object.fromEntries(prendas.map(p => [
    p.id,
    { ...p, stock_actual: p.stock_actual + (devueltoPorMaterial[p.material_id] || 0) },
  ])), [prendas, devueltoPorMaterial])

  const setLinea = (key, campo, valor) => {
    setLineas(ls => ls.map(l => l.key === key ? { ...l, [campo]: valor } : l))
  }

  const añadirLinea = () => setLineas(ls => [...ls, nuevaLinea()])
  const quitarLinea = (key) => setLineas(ls => ls.length > 1 ? ls.filter(l => l.key !== key) : ls)

  const total = lineas.reduce((sum, l) => {
    const p = prendaPorId[l.prenda_id]
    if (!p) return sum
    return sum + (parseFloat(l.cantidad) || 0) * p.precio_base
  }, 0)

  const handleGuardar = async () => {
    const lineasValidas = lineas.filter(l => l.prenda_id && parseFloat(l.cantidad) > 0)
    if (lineasValidas.length === 0) {
      setError('Añade al menos un artículo con cantidad válida.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await editarVenta(id, {
        cliente_id: clienteId || null,
        fecha,
        forma_pago: formaPago,
        notas: notas.trim() || null,
        lineas: lineasValidas.map(l => {
          const p = prendaPorId[l.prenda_id]
          return {
            prenda_id: p.id,
            material_id: p.material_id,
            descripcion: p.nombre,
            cantidad: parseFloat(l.cantidad),
            precio_unitario_venta: p.precio_base,
          }
        }),
      })
      toast.success('Venta actualizada.')
      navigate(`/ventas/${id}`)
    } catch (e) {
      setError(e.message)
      setGuardando(false)
    }
  }

  if (loading) return <PageWrapper><LoadingState /></PageWrapper>

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <PageHeader titulo="Editar venta" backTo={`/ventas/${id}`} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
            {error}
          </div>
        )}

        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente (opcional)">
              <Select value={clienteId} onChange={e => setClienteId(e.target.value)}>
                <option value="">Venta directa (sin cliente)</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.apellidos ?? ''}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </Field>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-[--text-medium]">Forma de pago</p>
            <div className="flex flex-wrap gap-2">
              {FORMAS_PAGO.map(fp => (
                <button
                  key={fp}
                  type="button"
                  onClick={() => setFormaPago(fp)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    formaPago === fp
                      ? 'border-primary bg-primary/10 text-primary-dark'
                      : 'border-[--border] text-[--text-medium] hover:bg-gray-50'
                  }`}
                >
                  {FORMA_PAGO_LABELS[fp]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Artículos</h2>

          {lineas.map(l => {
            const p = prendaPorId[l.prenda_id]
            const cantidad = parseFloat(l.cantidad) || 0
            const stockInsuficiente = p && cantidad > p.stock_actual
            const margenLinea = p ? (p.precio_base - p.precio_referencia) * cantidad : null
            return (
              <div key={l.key} className="flex items-start gap-2 pb-3 border-b border-[--border] last:border-0 last:pb-0">
                <div className="flex-1 min-w-0 space-y-1">
                  <Select value={l.prenda_id} onChange={e => setLinea(l.key, 'prenda_id', e.target.value)}>
                    <option value="">Selecciona un artículo…</option>
                    {prendas.map(pr => (
                      <option key={pr.id} value={pr.id}>{pr.nombre} — {formatImporte(pr.precio_base)}</option>
                    ))}
                  </Select>
                  {p && (
                    <p className={`text-xs ${stockInsuficiente ? 'text-red-500' : 'text-green-600'}`}>
                      {stockInsuficiente ? 'Sin stock suficiente' : 'Stock disponible'}: {p.stock_actual} {p.unidad}
                    </p>
                  )}
                  {p && (
                    <p className="text-xs text-[--text-medium]">
                      Coste: {formatImporte(p.precio_referencia)}/ud · Margen: <span className={margenLinea >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{formatImporte(margenLinea)}</span>
                    </p>
                  )}
                </div>
                <div className="w-20 flex-shrink-0">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={l.cantidad}
                    sanitize={sanitizers.entero}
                    onChange={e => setLinea(l.key, 'cantidad', e.target.value)}
                  />
                </div>
                <div className="w-24 flex-shrink-0 text-right text-sm font-medium text-[--text-dark] pt-2">
                  {p ? formatImporte(cantidad * p.precio_base) : '—'}
                </div>
                <button
                  type="button"
                  onClick={() => quitarLinea(l.key)}
                  className="text-[--text-light] hover:text-red-500 transition-colors p-2 flex-shrink-0"
                  aria-label="Quitar línea"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}

          <Button variant="secondary" size="sm" onClick={añadirLinea}>
            <Plus size={14} />
            Añadir línea
          </Button>

          <div className="flex justify-between items-center pt-3 border-t border-[--border]">
            <span className="text-sm font-semibold text-[--text-medium]">Total</span>
            <span className="text-lg font-bold text-[--text-dark]">{formatImporte(total)}</span>
          </div>
        </section>

        <Field label="Notas">
          <Textarea placeholder="Notas opcionales…" value={notas} onChange={e => setNotas(e.target.value)} />
        </Field>

        <div className="flex gap-3">
          <Button size="lg" onClick={handleGuardar} loading={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate(`/ventas/${id}`)}>
            Cancelar
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
