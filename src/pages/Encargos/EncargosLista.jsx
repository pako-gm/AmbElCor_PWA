import { useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, LayoutGrid, GanttChartSquare } from 'lucide-react'

const VISTAS_ENCARGOS = [
  { key: 'kanban', label: 'Kanban', Icon: LayoutGrid },
  { key: 'cronograma', label: 'Cronograma', Icon: GanttChartSquare },
]
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import EncargosPanel from '@/pages/Encargos/panels/EncargosPanel'
import ClientesPanel from '@/pages/Encargos/panels/ClientesPanel'
import CatalogoPanel from '@/pages/Encargos/panels/CatalogoPanel'
import CitasPanel from '@/pages/Encargos/panels/CitasPanel'

const TABS = [
  { key: 'encargos', label: 'Encargos', accion: { to: '/encargos/nuevo', label: 'Nuevo encargo' } },
  { key: 'citas', label: 'Citas', accion: { label: 'Nueva Cita' } },
  { key: 'clientes', label: 'Clientes', accion: { to: '/clientes/nuevo', label: 'Nuevo cliente' } },
  { key: 'catalogo', label: 'Catálogo', accion: { to: '/catalogo/nueva', label: 'Nueva prenda' } },
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

export default function EncargosLista() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'encargos'
  const setTab = (t) => setSearchParams(t === 'encargos' ? {} : { tab: t }, { replace: true })

  const tabActual = TABS.find(t => t.key === tab) ?? TABS[0]

  // La acción "Nueva Cita" la maneja CitasPanel; se expone aquí vía ref.
  const nuevaCitaRef = useRef(null)
  const onAccion = () =>
    tab === 'citas' ? nuevaCitaRef.current?.() : navigate(tabActual.accion.to)

  const isEncargos = tab === 'encargos'
  const [vistaActual, setVistaActual] = useState('kanban')

  return (
    <PageWrapper>
      <div className={isEncargos ? 'w-full px-4 md:px-8 py-6' : 'max-w-2xl mx-auto px-4 py-6'}>
        {/* Cabecera unificada: botón volver (salvo en Encargos, que es la página principal) + título + acción */}
        <div className="flex items-center gap-3 mb-6">
          {tab !== 'encargos' && (
            <button
              onClick={() => setTab('encargos')}
              aria-label="Volver"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-[--border] rounded-lg bg-white text-[--text-medium] hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <h1 className="font-display text-2xl text-[--text-dark] flex-1 min-w-0 truncate">{tabActual.label}</h1>
          {isEncargos && (
            <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-[--text-medium] whitespace-nowrap">Cambiar Vista →</span>
            <div className="flex gap-1 p-1 bg-[--surface] rounded-lg">
              {VISTAS_ENCARGOS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setVistaActual(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    vistaActual === key
                      ? 'bg-white text-primary shadow-sm border border-[--border]'
                      : 'text-[--text-medium] hover:text-[--text]'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
            </div>
          )}
          {tabActual.accion && (
            <Button onClick={onAccion} className="flex-shrink-0">
              <Plus size={16} />
              {tabActual.accion.label}
            </Button>
          )}
        </div>

        <SubNav tab={tab} setTab={setTab} />

        {tab === 'encargos' && <EncargosPanel vistaActual={vistaActual} setVistaActual={setVistaActual} />}
        {tab === 'citas' && <CitasPanel nuevaCitaRef={nuevaCitaRef} />}
        {tab === 'clientes' && <ClientesPanel />}
        {tab === 'catalogo' && <CatalogoPanel />}
      </div>
    </PageWrapper>
  )
}
