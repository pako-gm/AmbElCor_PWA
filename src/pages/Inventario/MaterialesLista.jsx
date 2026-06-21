import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { Icon, Btn, StatusPill, KpiCard } from '@/components/inventario/InventarioUI'
import { MovementModal } from '@/components/inventario/InventarioModals'
import ProveedoresPanel from '@/components/inventario/ProveedoresPanel'
import { useInventario } from '@/hooks/useInventario'
import { formatImporte, formatCodigo, formatCantidad } from '@/utils/formatters'
import { sanitizers } from '@/utils/validators'

const TABS = [
  { key: 'inventario', label: 'Inventario' },
  { key: 'proveedores', label: 'Proveedores' },
]

function SubNav({ tab, setTab }) {
  return (
    <div className="flex items-center gap-0 mb-6 border-b border-[--border]">
      {TABS.map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            tab === t.key
              ? 'border-primary text-primary'
              : 'border-transparent text-[--text-medium] hover:text-[--text]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
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
function MaterialCard({ material, iconoCategoria = 'box', onOpen, onMove }) {
  const stock = parseFloat(material.stock_actual || 0)
  const minimo = parseFloat(material.stock_minimo || 0)
  const precio = parseFloat(material.precio_referencia || 0)
  const valor = stock * precio

  // Determinar estado
  let estado = 'OK'
  if (stock <= 0) estado = 'AGOTADO'
  else if (stock < minimo) estado = 'BAJO'

  const unit = UNIT_DISPLAY[material.unidad] || material.unidad || 'ud.'

  const inactivo = !material.activo

  return (
    <div
      className={`
        border-l-4 rounded-lg p-4 bg-white border border-line
        cursor-pointer hover:bg-surface-2 transition
        ${inactivo ? 'border-l-line opacity-60' : estado === 'AGOTADO' ? 'border-l-danger' : estado === 'BAJO' ? 'border-l-amber' : 'border-l-green'}
      `}
      onClick={() => onOpen(material.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-muted uppercase">{formatCodigo(material.codigo)}</span>
        {inactivo
          ? <span className="text-xs font-bold px-2 py-0.5 rounded bg-line-2 text-faint">INACTIVO</span>
          : <StatusPill status={estado} />
        }
      </div>

      <h3 className="font-display text-base font-bold text-ink mb-2">{material.nombre}</h3>

      <div className="flex items-center gap-2 text-sm text-muted mb-3">
        <Icon name={iconoCategoria} size={14} />
        <span>{material.categoria}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-xs text-faint">STOCK</span>
          <b className="block text-ink">{formatCantidad(stock)} {unit}</b>
        </div>
        <div>
          <span className="text-xs text-faint">VALOR</span>
          <b className="block text-brand">{formatImporte(valor)}</b>
        </div>
      </div>

      {!inactivo && (
        <div className="flex justify-start gap-2 pt-2 border-t border-line-2">
          <button
            className="w-9 h-9 flex items-center justify-center bg-green-soft text-green-ink rounded hover:opacity-80 transition"
            title="Entrada" aria-label="Registrar entrada"
            onClick={(e) => { e.stopPropagation(); onMove('entrada', material.id); }}
          >
            <Icon name="plus" size={14} />
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center bg-purple-soft text-purple-ink rounded hover:opacity-80 transition"
            title="Salida" aria-label="Registrar salida"
            onClick={(e) => { e.stopPropagation(); onMove('salida', material.id); }}
          >
            <Icon name="minus" size={14} />
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center bg-amber-soft text-amber-ink rounded hover:opacity-80 transition"
            title="Ajuste" aria-label="Registrar ajuste"
            onClick={(e) => { e.stopPropagation(); onMove('ajuste', material.id); }}
          >
            <Icon name="wrench" size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// Dashboard (KPI: valor de stock, ranking, alertas)
function Dashboard({ materiales, salidas }) {
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

  // Materiales con mayor rotación (cantidad consumida en salidas, últimos 12 meses)
  const rotacion = {}
  salidas.forEach(mov => {
    const mat = mov.materiales
    if (!mat) return
    const r = rotacion[mat.id] ?? { ...mat, total: 0 }
    r.total += parseFloat(mov.cantidad || 0)
    rotacion[mat.id] = r
  })
  const topRotacion = Object.values(rotacion).sort((a, b) => b.total - a.total).slice(0, 5)

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
                    className="h-full bg-primary rounded transition-all"
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
                    <span className="font-bold text-ink">{formatCodigo(m.codigo)}</span>
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
                  <span className="font-bold text-ink">{formatCodigo(m.codigo)}</span>
                  <span className="text-muted ml-2">{m.nombre}</span>
                </div>
                <b className="text-danger">
                  {formatCantidad(m.stock_actual || 0)} / {Math.ceil(parseFloat(m.stock_minimo || 0))}
                </b>
              </li>
            )) : (
              <li className="text-sm text-muted">Todo el stock por encima del mínimo.</li>
            )}
          </ul>
        </section>

        <section className="bg-white border border-line rounded-lg p-4">
          <h3 className="font-display font-bold text-ink mb-4">Materiales con mayor rotación</h3>
          <ul className="space-y-2">
            {topRotacion.length > 0 ? topRotacion.map((m) => {
              const unit = UNIT_DISPLAY[m.unidad_gestion] || m.unidad_gestion || 'ud.'
              return (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-ink">{formatCodigo(m.codigo)}</span>
                    <span className="text-muted ml-2">{m.nombre}</span>
                  </div>
                  <b className="text-ink">{formatCantidad(m.total)} {unit}</b>
                </li>
              )
            }) : (
              <li className="text-sm text-muted">Sin consumo registrado en los últimos 12 meses.</li>
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
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'inventario'
  const setTab = (t) => setSearchParams(t === 'inventario' ? {} : { tab: t }, { replace: true })
  const { fetchMateriales, loading, registrarEntrada, registrarSalida, registrarAjuste, fetchProveedores, fetchEncargosActivos, fetchMovimientos, fetchCategorias } = useInventario()
  const [materiales, setMateriales] = useState([])
  const [categoriasDB, setCategoriasDB] = useState([])
  const [kpiMode, setKpiMode] = useState('referencias')
  const [catFiltro, setCatFiltro] = useState('Todas')
  const [query, setQuery] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [modal, setModal] = useState(null) // null | 'entrada' | 'salida' | 'ajuste'
  const [movInitialId, setMovInitialId] = useState(null)
  const [proveedores, setProveedores] = useState([])
  const [encargos, setEncargos] = useState([])
  const [movimientosMes, setMovimientosMes] = useState([])
  const [salidas12m, setSalidas12m] = useState([])

  const hoy = new Date()
  const desdeInicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`
  const hace12meses = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate())
    .toISOString().slice(0, 10)

  const cargar = () => fetchMateriales({ soloActivos: false }).then(setMateriales)
  const cargarMovs = () => fetchMovimientos({ desde: desdeInicioMes }).then(setMovimientosMes)
  const cargarSalidas = () => fetchMovimientos({ desde: hace12meses, tipo: 'salida' }).then(setSalidas12m)

  useEffect(() => {
    cargar()
    cargarMovs()
    cargarSalidas()
    fetchProveedores().then(setProveedores)
    fetchEncargosActivos().then(setEncargos)
    fetchCategorias().then(setCategoriasDB)
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
    cargarMovs()
    cargarSalidas()
  }

  const activos = materiales.filter(m => m.activo)
  const k = calcularKpis(activos)

  const filtrados = materiales.filter(m => {
    if (!mostrarInactivos && !m.activo) return false
    if (catFiltro !== 'Todas' && m.categoria !== catFiltro) return false
    if (query && !(m.nombre + ' ' + (m.codigo || '')).toLowerCase().includes(query.toLowerCase())) return false
    if (kpiMode === 'low' && parseFloat(m.stock_actual || 0) >= parseFloat(m.stock_minimo || 0)) return false
    return true
  })

  const iconoMap = Object.fromEntries(categoriasDB.map(c => [c.nombre, c.icono]))
  const categorias = ['Todas', ...categoriasDB.filter(c => materiales.some(m => m.categoria === c.nombre)).map(c => c.nombre)]

  const proveedoresAdapt = proveedores.map(p => ({ id: p.id, nombre: p.nombre }))
  const encargosAdapt = encargos.map(e => ({
    id: e.id,
    label: `${e.numero} — ${e.clientes ? `${e.clientes.nombre} ${e.clientes.apellidos ?? ''}`.trim() : ''}`
  }))

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">

        {tab === 'proveedores' ? (
          <ProveedoresPanel topNav={<SubNav tab={tab} setTab={setTab} />} />
        ) : (
          <>

        {/* Cabecera identidad + acciones */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/encargos')}
              aria-label="Volver"
              style={{ width: 38, height: 38, border: '1px solid var(--line)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', cursor: 'pointer', color: 'var(--ink-2)', flexShrink: 0 }}
            >
              <Icon name="back" size={15} />
            </button>
            <h1 className="font-display text-3xl font-bold text-ink">Inventario</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn kind="green" icon="arrowDown" onClick={() => openModal('entrada')}>
              Entrada
            </Btn>
            <Btn kind="purple" icon="arrowUp" onClick={() => openModal('salida')}>
              Salida
            </Btn>
            <Btn kind="amber" icon="wrench" onClick={() => openModal('ajuste')}>
              Ajuste
            </Btn>
            <Btn kind="brand" icon="plus" onClick={() => navigate('/inventario/nuevo')}>
              Nuevo material
            </Btn>
          </div>
        </div>

        <SubNav tab={tab} setTab={setTab} />

        {loading ? (
          <p className="text-center py-8">Cargando...</p>
        ) : (
          <>

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
            value={movimientosMes.length}
            icon="activity"
            tone="green"
            active={kpiMode === 'movs'}
            onClick={() => setKpiMode(kpiMode === 'movs' ? 'referencias' : 'movs')}
          />
        </div>

        {/* Buscador + filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3 bg-white border border-line rounded-xl px-4 py-3 w-1/2">
            <Icon name="search" size={16} className="shrink-0 text-muted" />
            <input
              type="text"
              placeholder="Buscar en el taller…"
              value={query}
              onChange={(e) => setQuery(sanitizers.texto(e.target.value))}
              className="flex-1 text-sm text-ink placeholder:text-faint focus:outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCatFiltro(c)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm transition ${
                  catFiltro === c
                    ? 'bg-lilac text-ink'
                    : 'bg-white border border-line text-muted hover:bg-line-2'
                }`}
              >
                {c !== 'Todas' && <Icon name={iconoMap[c] || 'box'} size={14} />}
                {c}
              </button>
            ))}
            <div className="w-px h-5 bg-line" />
            <button
              onClick={() => setMostrarInactivos(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm transition ${
                mostrarInactivos
                  ? 'bg-danger-soft text-danger'
                  : 'bg-white border border-line text-muted hover:bg-line-2'
              }`}
            >
              <Icon name="eyeOff" size={14} />
              Inactivos
            </button>
          </div>
        </div>

        {/* Contenido según KPI */}
        {kpiMode === 'dashboard' ? (
          <Dashboard materiales={materiales} salidas={salidas12m} />
        ) : kpiMode === 'movs' ? (
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <p className="text-sm font-bold text-ink">Movimientos del mes en curso</p>
            </div>
            {movimientosMes.length === 0 ? (
              <p className="text-center py-8 text-muted text-sm">Sin movimientos este mes.</p>
            ) : (
              <ul className="divide-y divide-line">
                {movimientosMes.map((mov) => {
                  const mat = mov.materiales
                  const unit = UNIT_DISPLAY[mat?.unidad_gestion] || mat?.unidad_gestion || 'ud.'
                  const qty = parseFloat(mov.cantidad || 0)
                  const isEntrada = mov.tipo === 'entrada'
                  const isAjuste = mov.tipo === 'ajuste'
                  const qtyStr = isAjuste
                    ? `${qty >= 0 ? '+' : ''}${formatCantidad(qty)} ${unit}`
                    : isEntrada
                      ? `+${formatCantidad(qty)} ${unit}`
                      : `-${formatCantidad(qty)} ${unit}`
                  const qtyClass = isAjuste
                    ? 'text-amber-600 font-bold'
                    : isEntrada
                      ? 'text-green-700 font-bold'
                      : 'text-red-600 font-bold'
                  const fuente = mov.proveedores?.nombre || (mov.encargos ? `Encargo ${mov.encargos.numero}` : '—')
                  const ref = mov.notas || mov.encargos?.codigo_corto || ''
                  const fecha = mov.fecha
                    ? mov.fecha.split('-').reverse().join('-')
                    : ''

                  return (
                    <li key={mov.id} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2 transition text-sm">
                      <span className="w-24 shrink-0 text-faint">{fecha}</span>
                      <span className="w-20 shrink-0">
                        <span className="bg-line-2 text-muted text-xs font-bold px-2 py-0.5 rounded">{formatCodigo(mat?.codigo)}</span>
                      </span>
                      <span className="flex-1 font-medium text-ink truncate">{mat?.nombre}</span>
                      <span className="w-40 shrink-0 text-muted truncate">{fuente}</span>
                      <span className="w-24 shrink-0 text-faint">{ref}</span>
                      <span className={`w-20 shrink-0 text-right ${qtyClass}`}>{qtyStr}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
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
                  iconoCategoria={iconoMap[m.categoria] || 'box'}
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
          </>
        )}
          </>
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
