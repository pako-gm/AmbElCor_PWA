import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchPrenda, crearPrenda, actualizarPrenda } from '@/hooks/useCatalogo'
import { useToast } from '@/hooks/useToast'

const VACIO = { nombre: '', descripcion: '', precio_base: '', descuento: '0', activo: true }

export default function CatalogoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const esNueva = !id
  const [form, setForm] = useState(VACIO)
  const [loading, setLoading] = useState(!esNueva)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  const set = (campo, valor) => setForm(v => ({ ...v, [campo]: valor }))

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    const precio = parseFloat(form.precio_base)
    if (isNaN(precio) || precio < 0) { setError('El precio debe ser un número positivo.'); return }
    const descuento = parseFloat(form.descuento) || 0
    if (descuento < 0 || descuento > 100) { setError('El descuento debe estar entre 0 y 100.'); return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio_base: precio,
        descuento,
        activo: form.activo,
      }
      if (esNueva) {
        await crearPrenda(payload)
      } else {
        await actualizarPrenda(id, payload)
      }
      toast.success(esNueva ? 'Prenda creada.' : 'Prenda actualizada.')
      navigate('/catalogo')
    } catch (e) {
      setError('Error al guardar: ' + e.message)
      setSaving(false)
    }
  }

  if (loading) return <PageWrapper><div className="p-8 text-center text-[--text-light] text-sm">Cargando…</div></PageWrapper>

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/catalogo')} className="text-[--text-light] hover:text-[--text-dark]">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-display text-2xl text-[--text-dark]">
            {esNueva ? 'Nueva prenda' : 'Editar prenda'}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
            {error}
          </div>
        )}

        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-4">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[--text-medium]">Nombre *</label>
            <input
              type="text"
              placeholder="Ej. Traje fallera completo"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[--text-medium]">Descripción</label>
            <textarea
              placeholder="Descripción opcional…"
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              rows={2}
              className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Precio y descuento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[--text-medium]">Precio base (€) *</label>
              <input
                type="number"
                min="0"
                step="0.50"
                placeholder="0,00"
                value={form.precio_base}
                onChange={e => set('precio_base', e.target.value)}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[--text-medium]">Descuento (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="0"
                value={form.descuento}
                onChange={e => set('descuento', e.target.value)}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={() => navigate('/catalogo')}
            className="px-6 py-2 rounded-md text-sm text-[--text-medium] border border-[--border] hover:bg-[--bg-alt] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </PageWrapper>
  )
}
