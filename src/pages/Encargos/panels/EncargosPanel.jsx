import { useEffect, useState } from 'react'
import { fetchEncargos } from '@/hooks/useEncargos'
import KanbanView from './encargos/KanbanView'
import CronogramaView from './encargos/CronogramaView'

export default function EncargosPanel({ vistaActual, setVistaActual }) {
  const [encargos, setEncargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [verEntregados, setVerEntregados] = useState(false)

  const cargar = () => {
    setLoading(true)
    fetchEncargos({})
      .then(setEncargos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const props = { encargos, loading, verEntregados, setVerEntregados, onRecargar: cargar }

  return (
    <div>
      {vistaActual === 'kanban'
        ? <KanbanView {...props} />
        : <CronogramaView {...props} />
      }
    </div>
  )
}
