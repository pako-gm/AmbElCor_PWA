import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlertTriangle, Search } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { useInventario } from '@/hooks/useInventario'
import { formatImporte } from '@/utils/formatters'
import { exportarStockActual } from '@/utils/exportInventario'

const UNIDAD_LABELS = {
  unidad: 'ud.',
  metro: 'm',
  metro_cuadrado: 'm²',
  kilogramo: 'kg',
  litro: 'l',
  par: 'par',
  rollo: 'rollo',
  caja: 'caja',
}

export default function MaterialesLista() {
  const navigate = useNavigate()
  const { fetchMateriales, loading } = useInventario()
  const [materiales, setMateriales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [soloStockBajo, setSoloStockBajo] = useState(false)

  useEffect(() => {
    fetchMateriales({ soloActivos: true }).then(setMateriales)
  }, [])

  const categorias = [...new Set(materiales.map(m => m.categoria).filter(Boolean))].sort()

  const filtrados = materiales.filter(m => {
    const txt = busqueda.toLowerCase()
    const coincide =
      m.nombre.toLowerCase().includes(txt) ||
      (m.codigo ?? '').toLowerCase().includes(txt)
    const catOk = !categoriaFiltro || m.categoria === categoriaFiltro
    const stockOk = !soloStockBajo || parseFloat(m.stock_actual) < parseFloat(m.stock_minimo)
    return coincide && catOk && stockOk
  })

  const totalActivos = materiales.length
  const totalStockBajo = materiales.filter(m => parseFloat(m.stock_actual) < parseFloat(m.stock_minimo)).length
  const valorTotal = materiales.reduce((s, m) => {
    if (!m.precio_referencia) return s
    return s + parseFloat(m.stock_actual) * parseFloat(m.precio_referencia)
  }, 0)

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-[--border] rounded-lg px-4 py-3">
            <p className="text-xs text-[--text-light] mb-0.5">Materiales activos</p>
            <p className="text-base font-bold text-[--text-dark]">{totalActivos}</p>
          </div>
          <div className="bg-white border border-[--border] rounded-lg px-4 py-3">
            <p className="text-xs text-[--text-light] mb-0.5">Stock bajo</p>
            <p className={`text-base font-bold ${totalStockBajo > 0 ? 'text-red-500' : 'text-green-600'}`}>{totalStockBajo}</p>
          </div>
          <div className="bg-white border border-[--border] rounded-lg px-4 py-3">
            <p className="text-xs text-[--text-light] mb-0.5">Valor inventario</p>
            <p className="text-base font-bold text-primary">{formatImporte(valorTotal)}</p>
          </div>
        </div>

        {/* Cabecera filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-light]" />
            <input
              type="text"
              placeholder="Buscar por nombre o código…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full border border-[--border] rounded-md pl-8 pr-3 py-2 text-sm"
            />
          </div>

          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="border border-[--border] rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label className="flex items-center gap-2 text-sm text-[--text-medium] cursor-pointer">
            <input
              type="checkbox"
              checked={soloStockBajo}
              onChange={e => setSoloStockBajo(e.target.checked)}
              className="accent-red-500"
            />
            Solo stock bajo
          </label>

          <button
            onClick={() => exportarStockActual(materiales)}
            className="flex items-center gap-2 border border-[--border] bg-white text-[--text-medium] px-3 py-2 rounded-md text-sm hover:border-primary hover:text-primary transition-colors"
            title="Exportar stock actual"
          >
            Exportar
          </button>

          <button
            onClick={() => navigate('/inventario/nuevo')}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors"
          >
            <Plus size={15} />
            Nuevo material
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-sm text-[--text-light] text-center py-12">Cargando…</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-[--text-light] text-center py-12">No hay materiales.</p>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="hidden md:block bg-white border border-[--border] rounded-xl overflow-hidden">
              <div className="grid grid-cols-[80px_1fr_120px_100px_80px_100px] gap-4 px-4 py-3 bg-gray-50 border-b border-[--border] text-xs font-semibold text-[--text-light] uppercase tracking-wide">
                <span>Código</span>
                <span>Nombre</span>
                <span>Categoría</span>
                <span className="text-right">Stock actual</span>
                <span>Unidad</span>
                <span></span>
              </div>
              {filtrados.map((m, i) => {
                const stockBajo = parseFloat(m.stock_actual) < parseFloat(m.stock_minimo)
                return (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/inventario/${m.id}`)}
                    className={`w-full grid grid-cols-[80px_1fr_120px_100px_80px_100px] gap-4 px-4 py-3 text-sm text-left border-b border-[--border] last:border-0 hover:bg-gray-50 transition-colors items-center ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                  >
                    <span className="text-[--text-light] text-xs font-mono">{m.codigo ?? '—'}</span>
                    <span className="font-medium text-[--text-dark]">{m.nombre}</span>
                    <span className="text-xs text-[--text-light]">{m.categoria ?? '—'}</span>
                    <span className={`text-right font-bold text-base ${stockBajo ? 'text-red-500' : 'text-[--text-dark]'}`}>
                      {parseFloat(m.stock_actual).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-[--text-light]">{UNIDAD_LABELS[m.unidad] ?? m.unidad}</span>
                    <span className="justify-self-end">
                      {stockBajo && (
                        <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                          <AlertTriangle size={12} /> Stock bajo
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Tarjetas móvil */}
            <div className="md:hidden space-y-2">
              {filtrados.map(m => {
                const stockBajo = parseFloat(m.stock_actual) < parseFloat(m.stock_minimo)
                return (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/inventario/${m.id}`)}
                    className="w-full bg-white border border-[--border] rounded-xl p-4 text-left hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-[--text-dark] text-sm">{m.nombre}</p>
                        {m.codigo && <p className="text-xs text-[--text-light] font-mono mt-0.5">{m.codigo}</p>}
                        {m.categoria && <p className="text-xs text-[--text-light] mt-0.5">{m.categoria}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xl font-bold ${stockBajo ? 'text-red-500' : 'text-[--text-dark]'}`}>
                          {parseFloat(m.stock_actual).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-[--text-light]">{UNIDAD_LABELS[m.unidad] ?? m.unidad}</p>
                        {stockBajo && (
                          <span className="flex items-center gap-0.5 text-[10px] text-red-500 justify-end mt-1">
                            <AlertTriangle size={11} /> Stock bajo
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  )
}
