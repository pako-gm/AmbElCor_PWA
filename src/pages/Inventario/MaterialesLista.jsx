import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { Icon, Btn, StatusPill, KpiCard } from '@/components/inventario/InventarioUI'
import { MovementModal } from '@/components/inventario/InventarioModals'
import { useInventario } from '@/hooks/useInventario'
import { formatImporte } from '@/utils/formatters'

const CATEGORIAS_PREDEFINIDAS = ['Telas', 'Pasamanería', 'Joyería fallera', 'Mercería', 'Botones']
const CATEGORIA_ICONOS = {
  'Telas': 'shirt',
  'Pasamanería': 'layers',
  'Joyería fallera': 'gem',
  'Mercería': 'scissors',
  'Botones': 'circle',
}

const UNIT_DISPLAY = {
  unidad: 'ud.',
  metro: 'm',
  metro_cuadrado: 'm²',
  kilogramo: 'kg',
  litro: 'l',
  par: 'par',
  rollo: 'rollo',
  caja: 'caja',
}

// Tarjeta de material (vista taller)
function MaterialCard({ material, onOpen, onMove }) {
  const stock = parseFloat(material.stock_actual || 0)
  const minimo = parseFloat(material.stock_minimo || 0)
  const precio = parseFloat(material.precio_referencia || 0)
  const valor = stock * precio

  // Determinar estado
  let estado = 'OK'
  if (stock <= 0) estado = 'AGOTADO'
  else if (stock < minimo) estado = 'BAJO'

  const unit = UNIT_DISPLAY[material.unidad_gestion] || material.unidad_gestion || 'ud.'
  const iconoCategoria = CATEGORIA_ICONOS[material.categoria] || 'box'

  return (
    <div
      className={`
        border-l-4 rounded-lg p-4 bg-white border border-line
        cursor-pointer hover:bg-surface-2 transition
        ${estado === 'AGOTADO' ? 'border-l-danger' : estado === 'BAJO' ? 'border-l-amber' : 'border-l-green'}
      `}
      onClick={() => onOpen(material.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-muted uppercase">{material.codigo}</span>
        <StatusPill status={estado} />
      </div>

      <h3 className="font-display text-base font-bold text-ink mb-2">{material.nombre}</h3>

      <div className="flex items-center gap-2 text-sm text-muted mb-3">
        <Icon name={iconoCategoria} size={14} />
        <span>{material.categoria}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-xs text-faint">STOCK</span>
          <b className="block text-ink">{stock.toFixed(2)} {unit}</b>
        </div>
        <div>
          <span className="text-xs text-faint">VALOR</span>
          <b className="block text-brand">{formatImporte(valor)}</b>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-line-2">
        <button
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-green-soft text-green-ink rounded text-xs font-bold hover:opacity-80 transition"
          title="Entrada"
          onClick={(e) => { e.stopPropagation(); onMove('entrada', material.id); }}
        >
          <Icon name="plus" size={13} />
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-purple-soft text-purple-ink rounded text-xs font-bold hover:opacity-80 transition"
          title="Salida"
          onClick={(e) => { e.stopPropagation(); onMove('salida', material.id); }}
        >
          <Icon name="minus" size={13} />
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-soft text-amber-ink rounded text-xs font-bold hover:opacity-80 transition"
          title="Ajuste"
          onClick={(e) => { e.stopPropagation(); onMove('ajuste', material.id); }}
        >
          <Icon name="wrench" size={13} />
        </button>
      </div>
    </div>
  )
}

// Dashboard (KPI: valor de stock, ranking, alertas)
function Dashboard({ materiales }) {
  const k = calcularKpis(materiales)

  // Valor por categoría
  const porCategoria = {}
  materiales.forEach(m => {
    const cat = m.categoria || 'Sin categoría'
    const valor = parseFloat(m.stock_actual || 0) * parseFloat(m.precio_referencia || 0)
    porCategoria[cat] = (porCategoria[cat] || 0) + valor
  })
  const cats = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])
  const maxValor = Math.max(...cats.map(c => c[1]), 1)

  // Materiales con bajo stock
  const bajo = materiales
    .filter(m => parseFloat(m.stock_actual || 0) < parseFloat(m.stock_minimo || 0))
    .sort((a, b) => (parseFloat(a.stock_actual) / parseFloat(a.stock_minimo)) - (parseFloat(b.stock_actual) / parseFloat(b.stock_minimo)))

  // Top 5 valor
  const topValor = [...materiales]
    .sort((a, b) => (parseFloat(b.stock_actual || 0) * parseFloat(b.precio_referencia || 0)) - (parseFloat(a.stock_actual || 0) * parseFloat(a.precio_referencia || 0)))
    .slice(0, 5)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <section className="bg-white border border-line rounded-lg p-4">
          <h3 className="font-display font-bold text-ink mb-4">Valor de stock por categoría</h3>
          <div className="space-y-3">
            {cats.map(([cat, valor]) => (
              <div key={cat}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-ink">{cat}</span>
                  <b className="text-sm text-ink">{formatImporte(valor)}</b>
                </div>
                <div className="h-2 bg-line-2 rounded">
                  <div
                    className="h-full bg-violet rounded transition-all"
                    style={{ width: `${(valor / maxValor) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-line rounded-lg p-4">
          <h3 className="font-display font-bold text-ink mb-4">Mayor valor inmovilizado</h3>
          <ul className="space-y-2">
            {topValor.map((m) => {
              const valor = parseFloat(m.stock_actual || 0) * parseFloat(m.precio_referencia || 0)
              return (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-ink">{m.codigo}</span>
                    <span className="text-muted ml-2">{m.nombre}</span>
                  </div>
                  <b className="text-ink">{formatImporte(valor)}</b>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className="space-y-6">
        <section className="bg-white border border-danger-soft rounded-lg p-4 bg-danger-soft/30">
          <h3 className="font-display font-bold text-danger flex items-center gap-2 mb-4">
            <Icon name="warn" size={16} />
            Bajo mínimo ({bajo.length})
          </h3>
          <ul className="space-y-2">
            {bajo.length > 0 ? bajo.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold text-ink">{m.codigo}</span>
                  <span className="text-muted ml-2">{m.nombre}</span>
                </div>
                <b className="text-danger">
                  {parseFloat(m.stock_actual || 0).toFixed(2)} / {Math.ceil(parseFloat(m.stock_minimo || 0))}
                </b>
              </li>
            )) : (
              <li className="text-sm text-muted">Todo el stock por encima del mínimo.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}

function calcularKpis(materiales) {
  const totalValue = materiales.reduce((s, m) => s + (parseFloat(m.stock_actual || 0) * parseFloat(m.precio_referencia || 0)), 0)
  const refs = materiales.length
  const low = materiales.filter(m => parseFloat(m.stock_actual || 0) < parseFloat(m.stock_minimo || 0)).length
  return { totalValue, refs, low, monthMovs: 0 }
}

export default function MaterialesLista() {
  const navigate = useNavigate()
  const { fetchMateriales, loading, registrarEntrada, registrarSalida, registrarAjuste, fetchProveedores, fetchEncargosActivos } = useInventario()
  const [materiales, setMateriales] = useState([])
  const [kpiMode, setKpiMode] = useState('referencias')
  const [catFiltro, setCatFiltro] = useState('Todas')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null) // null | 'entrada' | 'salida' | 'ajuste'
  const [movInitialId, setMovInitialId] = useState(null)
  const [proveedores, setProveedores] = useState([])
  const [encargos, setEncargos] = useState([])

  const cargar = () => fetchMateriales({ soloActivos: true }).then(setMateriales)

  useEffect(() => {
    cargar()
    fetchProveedores().then(setProveedores)
    fetchEncargosActivos().then(setEncargos)
  }, [])

  const openModal = (kind, id = null) => { setMovInitialId(id); setModal(kind) }

  const handleMovimiento = async ({ kind, materialId, qty, costeUd, proveedorId, encargo, motivo, referencia }) => {
    const mat = materiales.find(m => m.id === materialId)
    if (kind === 'entrada') {
      await registrarEntrada({
        materialId, materialNombre: mat?.nombre,
        cantidad: Math.abs(qty), precioUnitario: costeUd || null,
        proveedorId: proveedorId || null,
        fecha: new Date().toISOString().slice(0, 10),
        notas: referencia || null, crearGasto: !!proveedorId,
      })
    } else if (kind === 'salida') {
      const encargoObj = encargos.find(e => {
        const label = `${e.numero} — ${e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : ''}`
        return label === encargo
      })
      await registrarSalida({
        materialId, cantidad: Math.abs(qty),
        encargoId: encargoObj?.id || null, motivo: 'consumo_encargo',
        fecha: new Date().toISOString().slice(0, 10), notas: referencia || null,
      })
    } else if (kind === 'ajuste') {
      await registrarAjuste({
        materialId, cantidad: qty,
        motivo: motivo || referencia || 'Ajuste manual',
        fecha: new Date().toISOString().slice(0, 10),
      })
    }
    setModal(null)
    cargar()
  }

  const k = calcularKpis(materiales)

  const filtrados = materiales.filter(m => {
    if (catFiltro !== 'Todas' && m.categoria !== catFiltro) return false
    if (query && !(m.nombre + ' ' + (m.codigo || '')).toLowerCase().includes(query.toLowerCase())) return false
    if (kpiMode === 'low' && parseFloat(m.stock_actual || 0) >= parseFloat(m.stock_minimo || 0)) return false
    return true
  })

  const categorias = ['Todas', ...CATEGORIAS_PREDEFINIDAS.filter(c => materiales.some(m => m.categoria === c))]

  const proveedoresAdapt = proveedores.map(p => ({ id: p.id, nombre: p.nombre }))
  const encargosAdapt = encargos.map(e => ({
    id: e.id,
    label: `${e.numero} — ${e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : ''}`
  }))

  if (loading) return <PageWrapper title="Inventario"><p className="text-center py-8">Cargando...</p></PageWrapper>

  return (
    <PageWrapper title="Inventario">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">

        {/* Cabecera identidad + acciones */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet text-white flex items-center justify-center font-bold">A</div>
            <h1 className="font-display text-3xl font-bold text-ink">Inventario</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn kind="brand" icon="plus" onClick={() => navigate('/inventario/nuevo')}>
              Nuevo material
            </Btn>
            <Btn kind="green" icon="arrowDown" onClick={() => openModal('entrada')}>
              Entrada
            </Btn>
            <Btn kind="purple" icon="arrowUp" onClick={() => openModal('salida')}>
              Salida
            </Btn>
            <Btn kind="amber" icon="wrench" onClick={() => openModal('ajuste')}>
              Ajuste
            </Btn>
            <Btn kind="ghost" icon="building" onClick={() => navigate('/inventario/proveedores')}>
              Proveedores
            </Btn>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            label="VALOR DE STOCK"
            value={formatImporte(k.totalValue)}
            icon="cubes"
            tone="violet"
            active={kpiMode === 'dashboard'}
            onClick={() => setKpiMode(kpiMode === 'dashboard' ? 'referencias' : 'dashboard')}
          />
          <KpiCard
            label="REFERENCIAS ACTIVAS"
            value={k.refs}
            icon="box"
            tone="teal"
            active={kpiMode === 'referencias'}
            onClick={() => setKpiMode('referencias')}
          />
          <KpiCard
            label="BAJO MÍNIMO"
            value={k.low}
            icon="warn"
            tone="amber"
            active={kpiMode === 'low'}
            onClick={() => setKpiMode(kpiMode === 'low' ? 'referencias' : 'low')}
          />
          <KpiCard
            label="MOVS. DEL MES"
            value="0"
            icon="activity"
            tone="green"
            active={false}
            onClick={() => alert('Movimientos del mes')}
          />
        </div>

        {/* Buscador + filtros */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Buscar en el taller…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCatFiltro(c)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm transition ${
                  catFiltro === c
                    ? 'bg-lilac text-ink'
                    : 'bg-surface border border-line text-muted hover:bg-line-2'
                }`}
              >
                {c !== 'Todas' && <Icon name={CATEGORIA_ICONOS[c] || 'box'} size={14} />}
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido según KPI */}
        {kpiMode === 'dashboard' ? (
          <Dashboard materiales={materiales} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted font-bold">
              {kpiMode === 'low' ? 'Referencias bajo mínimo' : 'Catálogo'} · {filtrados.length} {filtrados.length === 1 ? 'referencia' : 'referencias'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map((m) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  onOpen={(id) => navigate(`/inventario/${id}`)}
                  onMove={(kind, id) => openModal(kind, id)}
                />
              ))}
              {filtrados.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted">
                  Sin resultados para los filtros actuales.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modal && (
        <MovementModal
          type={modal}
          materiales={materiales}
          proveedores={proveedoresAdapt}
          encargos={encargosAdapt}
          initialId={movInitialId || materiales[0]?.id}
          onClose={() => setModal(null)}
          onConfirm={handleMovimiento}
        />
      )}
    </PageWrapper>
  )
}
