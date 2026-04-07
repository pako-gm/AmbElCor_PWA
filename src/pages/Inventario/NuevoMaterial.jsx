import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { useInventario } from '@/hooks/useInventario'

const UNIDADES = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'metro', label: 'Metro (m)' },
  { value: 'metro_cuadrado', label: 'Metro cuadrado (m²)' },
  { value: 'kilogramo', label: 'Kilogramo (kg)' },
  { value: 'litro', label: 'Litro (l)' },
  { value: 'par', label: 'Par' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'caja', label: 'Caja' },
]

const formVacio = {
  codigo: '',
  nombre: '',
  descripcion: '',
  unidad: 'unidad',
  categoria: '',
  stock_minimo: '0',
  precio_referencia: '',
  notas: '',
}

export default function NuevoMaterial() {
  const navigate = useNavigate()
  const { crearMaterial, fetchMateriales } = useInventario()
  const [form, setForm] = useState(formVacio)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [categoriasExistentes, setCategoriasExistentes] = useState([])

  useEffect(() => {
    fetchMateriales({ soloActivos: false }).then(mats => {
      const cats = [...new Set(mats.map(m => m.categoria).filter(Boolean))].sort()
      setCategoriasExistentes(cats)
    })
  }, [])

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.')
    setError('')
    setGuardando(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        unidad: form.unidad,
        categoria: form.categoria.trim() || null,
        stock_minimo: parseFloat(form.stock_minimo) || 0,
        precio_referencia: form.precio_referencia !== '' ? parseFloat(form.precio_referencia) : null,
        notas: form.notas.trim() || null,
      }
      if (form.codigo.trim()) payload.codigo = form.codigo.trim()
      const material = await crearMaterial(payload)
      navigate(`/inventario/${material.id}`, { state: { toastMsg: 'Material creado correctamente.' } })
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/inventario')}
            className="text-xs text-primary hover:underline mb-2 block"
          >
            ← Volver al inventario
          </button>
          <h1 className="font-display text-2xl text-[--text-dark]">Nuevo material</h1>
        </div>

        <div className="bg-white border border-[--border] rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Código (opcional)</label>
              <input
                type="text"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                placeholder="Autogenerado — MAT-XXX"
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Tela de seda blanca"
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-xs text-[--text-light] mb-1">Descripción</label>
              <input
                type="text"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción detallada…"
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Unidad */}
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Unidad de medida</label>
              <select
                value={form.unidad}
                onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
              >
                {UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Categoría</label>
              <input
                type="text"
                list="categorias-list"
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                placeholder="Ej: Telas, Botones, Hilos…"
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
              />
              <datalist id="categorias-list">
                {categoriasExistentes.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            {/* Stock mínimo */}
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Stock mínimo (alerta)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.stock_minimo}
                onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Precio referencia */}
            <div>
              <label className="block text-xs text-[--text-light] mb-1">Precio de referencia (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio_referencia}
                onChange={e => setForm(f => ({ ...f, precio_referencia: e.target.value }))}
                placeholder="Precio por unidad/metro…"
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Notas */}
            <div className="md:col-span-2">
              <label className="block text-xs text-[--text-light] mb-1">Notas</label>
              <textarea
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Observaciones…"
                rows={2}
                className="w-full border border-[--border] rounded-md px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => navigate('/inventario')}
              className="px-4 py-2 text-sm rounded-md border border-[--border] text-[--text-medium] hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Crear material'}
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
