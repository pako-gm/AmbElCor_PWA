import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import { Field, Input, Textarea, Select } from '@/components/ui/Field'
import LoadingState from '@/components/ui/LoadingState'
import { fetchPrenda, crearPrenda, actualizarPrenda, fetchMaterialesVendibles } from '@/hooks/useCatalogo'
import { useToast } from '@/hooks/useToast'
import { sanitizers } from '@/utils/validators'

const VACIO = { nombre: '', descripcion: '', precio_base: '', activo: true, tipo_uso: 'solo_encargo', material_id: '' }

const OPCIONES_TIPO_USO = [
  { valor: 'solo_encargo', etiqueta: 'Solo encargos' },
  { valor: 'solo_venta', etiqueta: 'Solo venta directa' },
  { valor: 'ambos', etiqueta: 'Ambos' },
]

export default function CatalogoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const esNueva = !id
  const fromEncargo = location.state?.from === 'nuevo-encargo'
  const draft = location.state?.draft
  const lineaId = location.state?.lineaId
  const [form, setForm] = useState(VACIO)
  const [loading, setLoading] = useState(!esNueva)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errs, setErrs] = useState({})
  const [materialesVendibles, setMaterialesVendibles] = useState([])

  // Vuelta desde "Nuevo material" (creado al vuelo mientras se marcaba la prenda como vendible).
  const materialCreado = location.state?.material
  const draftPrenda = location.state?.draftPrenda

  useEffect(() => {
    fetchMaterialesVendibles().then(setMaterialesVendibles).catch(() => {})
  }, [])

  useEffect(() => {
    if (materialCreado) {
      setForm(f => ({ ...VACIO, ...(draftPrenda ?? f), material_id: materialCreado.id }))
      setMaterialesVendibles(prev => {
        if (prev.some(m => m.id === materialCreado.id)) return prev
        const normalizado = {
          ...materialCreado,
          precio_referencia: parseFloat(materialCreado.precio_referencia) || 0,
          stock_actual: parseFloat(materialCreado.stock_actual) || 0,
        }
        return [...prev, normalizado].sort((a, b) => a.nombre.localeCompare(b.nombre))
      })
      setLoading(false)
      return
    }
    if (esNueva) return
    fetchPrenda(id)
      .then(p => setForm({
        nombre: p.nombre,
        descripcion: p.descripcion ?? '',
        precio_base: String(p.precio_base),
        activo: p.activo,
        tipo_uso: p.tipo_uso ?? 'solo_encargo',
        material_id: p.material_id ?? '',
      }))
      .catch(() => setError('No se pudo cargar la prenda.'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (campo, valor) => {
    setForm(v => ({ ...v, [campo]: valor }))
    if (errs[campo]) setErrs(prev => ({ ...prev, [campo]: undefined }))
  }

  const handleGuardar = async () => {
    const nuevosErrs = {}
    if (!form.nombre.trim()) nuevosErrs.nombre = 'El nombre es obligatorio.'
    const precio = parseFloat(form.precio_base)
    if (isNaN(precio) || precio < 0) nuevosErrs.precio_base = 'El precio debe ser un número positivo.'
    if (form.tipo_uso !== 'solo_encargo' && !form.material_id) {
      nuevosErrs.material_id = 'Selecciona el material de stock vinculado a esta prenda vendible.'
    }
    if (Object.keys(nuevosErrs).length > 0) { setErrs(nuevosErrs); return }

    setSaving(true)
    setErrs({})
    setError('')
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio_base: precio,
        activo: form.activo,
        tipo_uso: form.tipo_uso,
        material_id: form.tipo_uso === 'solo_encargo' ? null : form.material_id,
      }
      let prenda = null
      if (esNueva) {
        prenda = await crearPrenda(payload)
      } else {
        await actualizarPrenda(id, payload)
      }
      toast.success(esNueva ? 'Prenda creada.' : 'Prenda actualizada.')
      if (fromEncargo && prenda) {
        navigate('/encargos/nuevo', { state: { nuevaPrenda: prenda, lineaId, draft } })
      } else {
        navigate('/encargos?tab=catalogo')
      }
    } catch (e) {
      setError('Error al guardar: ' + e.message)
      setSaving(false)
    }
  }

  if (loading) return <PageWrapper><LoadingState /></PageWrapper>

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Cabecera */}
        <PageHeader
          titulo={esNueva ? 'Nueva prenda' : 'Editar prenda'}
          backTo={fromEncargo ? '/encargos/nuevo' : '/encargos?tab=catalogo'}
          backState={fromEncargo ? { draft } : undefined}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
            {error}
          </div>
        )}

        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-4">
          {/* Nombre */}
          <Field label="Nombre" required error={errs.nombre}>
            <Input
              type="text"
              placeholder="Ej. Traje fallera completo"
              value={form.nombre}
              sanitize={sanitizers.texto}
              onChange={e => set('nombre', e.target.value)}
            />
          </Field>

          {/* Descripción */}
          <Field label="Descripción">
            <Textarea
              placeholder="Descripción opcional…"
              value={form.descripcion}
              sanitize={sanitizers.texto}
              onChange={e => set('descripcion', e.target.value)}
            />
          </Field>

          {/* Precio */}
          <Field label="Precio base (€)" required error={errs.precio_base}>
            <Input
              type="number"
              min="0"
              step="0.50"
              placeholder="0,00"
              inputMode="decimal"
              value={form.precio_base}
              sanitize={sanitizers.decimal}
              onChange={e => set('precio_base', e.target.value)}
            />
          </Field>

          {/* Activo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set('activo', !form.activo)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                form.activo
                  ? 'border-red-200 text-red-500 hover:bg-red-50'
                  : 'border-green-200 text-green-600 hover:bg-green-50'
              }`}
            >
              {form.activo ? (
                <><span className="text-red-400">×</span> Desactivar</>
              ) : (
                <><span>✓</span> Activar</>
              )}
            </button>
            <span className="text-sm text-[--text-medium]">
              Pulsa para <strong>{form.activo ? 'Desactivar' : 'Activar'}</strong> / {form.activo ? 'Activar' : 'Desactivar'} la prenda
            </span>
          </div>

          {/* Uso de la prenda: encargos, venta directa o ambos */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-[--text-medium]">Uso de la prenda</p>
            <div className="flex flex-wrap gap-2">
              {OPCIONES_TIPO_USO.map(o => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => set('tipo_uso', o.valor)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    form.tipo_uso === o.valor
                      ? 'border-primary bg-primary/10 text-primary-dark'
                      : 'border-[--border] text-[--text-medium] hover:bg-gray-50'
                  }`}
                >
                  {o.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {/* Material de stock vinculado (solo si la prenda es vendible directamente) */}
          {form.tipo_uso !== 'solo_encargo' && (
            <div className="space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <Field label="Material de stock vinculado" required error={errs.material_id}
                    hint="Es la ficha de Inventario que lleva el stock y el coste (PMP) de esta prenda. Si es la primera vez, pulsa «+ Nuevo»: el nombre se precarga solo.">
                    <Select
                      value={form.material_id}
                      onChange={e => set('material_id', e.target.value)}
                    >
                      <option value="">Selecciona un material…</option>
                      {materialesVendibles.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/inventario/nuevo', {
                    state: { from: 'nueva-prenda', draftPrenda: form, prendaId: esNueva ? undefined : id },
                  })}
                >
                  + Nuevo
                </Button>
              </div>

              {(() => {
                const materialSel = materialesVendibles.find(m => m.id === form.material_id)
                if (!materialSel) return null
                const precioVenta = parseFloat(form.precio_base)
                const coste = materialSel.precio_referencia
                const tieneMargen = !isNaN(precioVenta) && precioVenta > 0
                const margen = tieneMargen ? precioVenta - coste : null
                const margenPct = tieneMargen && precioVenta > 0 ? (margen / precioVenta) * 100 : null
                return (
                  <div className="flex items-center gap-4 text-xs text-[--text-medium] bg-gray-50 rounded-md px-3 py-2">
                    <span>Coste actual (PMP): <strong className="text-[--text-dark]">{coste.toFixed(2)} €</strong></span>
                    {tieneMargen && (
                      <span>
                        Margen: <strong className={margen >= 0 ? 'text-green-600' : 'text-red-500'}>
                          {margen.toFixed(2)} € ({margenPct.toFixed(0)}%)
                        </strong>
                      </span>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <Button size="lg" onClick={handleGuardar} loading={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => fromEncargo
              ? navigate('/encargos/nuevo', { state: { draft } })
              : navigate('/encargos?tab=catalogo')}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
