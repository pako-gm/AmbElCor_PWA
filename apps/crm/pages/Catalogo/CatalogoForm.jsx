import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import LoadingState from '@/components/ui/LoadingState'
import { fetchPrenda, crearPrenda, actualizarPrenda } from '@/hooks/useCatalogo'
import { useToast } from '@/hooks/useToast'
import { sanitizers } from '@/utils/validators'

const VACIO = { nombre: '', descripcion: '', precio_base: '', descuento: '0', activo: true }

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

  useEffect(() => {
    if (esNueva) return
    fetchPrenda(id)
      .then(p => setForm({
        nombre: p.nombre,
        descripcion: p.descripcion ?? '',
        precio_base: String(p.precio_base),
        descuento: String(p.descuento ?? 0),
        activo: p.activo,
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
    const descuento = parseFloat(form.descuento) || 0
    if (descuento < 0 || descuento > 100) nuevosErrs.descuento = 'Debe estar entre 0 y 100.'
    if (Object.keys(nuevosErrs).length > 0) { setErrs(nuevosErrs); return }

    setSaving(true)
    setErrs({})
    setError('')
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio_base: precio,
        descuento,
        activo: form.activo,
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

          {/* Precio y descuento */}
          <div className="grid grid-cols-2 gap-3">
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
            <Field label="Descuento (%)" error={errs.descuento}>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="0"
                inputMode="numeric"
                value={form.descuento}
                sanitize={sanitizers.entero}
                onChange={e => set('descuento', e.target.value)}
              />
            </Field>
          </div>

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
