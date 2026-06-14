import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import LoadingState from '@/components/ui/LoadingState'
import { fetchCitas, crearCita, actualizarCita, eliminarCita } from '@/hooks/useCitas'
import { useToast } from '@/hooks/useToast'
import CabeceraAgenda from '@/components/citas/CabeceraAgenda'
import TimelineDia from '@/components/citas/TimelineDia'
import CitaSheet from '@/components/citas/CitaSheet'
import { claveFechaLocal, semanaDesde, toHHMM } from '@/components/citas/citasUtils'

export default function CitasPanel({ nuevaCitaRef }) {
  const toast = useToast()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [fechaSel, setFechaSel] = useState(() => claveFechaLocal(new Date()))
  const [fechaBase, setFechaBase] = useState(() => new Date())
  const [sheetCita, setSheetCita] = useState(null)
  const [sheetModo, setSheetModo] = useState(null)
  const [sheetLoading, setSheetLoading] = useState(false)
  const rangoRef = useRef(null) // { inicio: Date, fin: Date } del último fetch

  const cargarCitas = useCallback(async (centro = new Date()) => {
    try {
      const inicio = new Date(centro.getFullYear(), centro.getMonth(), centro.getDate() - 30)
      const fin = new Date(centro.getFullYear(), centro.getMonth(), centro.getDate() + 60)
      const data = await fetchCitas({
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      })
      rangoRef.current = { inicio, fin }
      setCitas(data || [])
    } catch (err) {
      console.error('Error cargando citas:', err)
      toast.error('No se pudieron cargar las citas.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    cargarCitas()
  }, [cargarCitas])

  const semana = useMemo(() => semanaDesde(fechaBase), [fechaBase])

  // Si la semana visible sale del rango cargado, recargar centrado en ella
  useEffect(() => {
    const r = rangoRef.current
    if (!r) return
    if (semana[0] < r.inicio || semana[6] >= r.fin) {
      cargarCitas(new Date(fechaBase))
    }
  }, [semana, fechaBase, cargarCitas])

  // Modelo derivado para el timeline: clave de día local + minutos desde medianoche
  const citasMapeadas = useMemo(
    () =>
      citas.map(c => {
        const ini = new Date(c.inicio)
        const fin = new Date(c.fin)
        return {
          ...c,
          fecha: claveFechaLocal(ini),
          minInicio: ini.getHours() * 60 + ini.getMinutes(),
          minFin: fin.getHours() * 60 + fin.getMinutes(),
        }
      }),
    [citas]
  )

  const diasConCitas = useMemo(
    () => new Set(citasMapeadas.map(c => c.fecha)),
    [citasMapeadas]
  )

  const citasDia = useMemo(
    () => citasMapeadas.filter(c => c.fecha === fechaSel),
    [citasMapeadas, fechaSel]
  )

  const esHoy = fechaSel === claveFechaLocal(new Date())

  const cerrarSheet = () => {
    setSheetCita(null)
    setSheetModo(null)
  }

  const abrirNuevaCita = () => {
    setSheetCita({
      inicio: new Date(`${fechaSel}T09:00:00`),
      fin: new Date(`${fechaSel}T09:30:00`),
    })
    setSheetModo('new')
  }

  // Exponer la acción "Nueva Cita" a la cabecera unificada de EncargosLista.
  // Se reasigna en cada render para que capture el fechaSel actual.
  if (nuevaCitaRef) nuevaCitaRef.current = abrirNuevaCita

  const handleGuardarCita = async formData => {
    setSheetLoading(true)
    try {
      if (sheetModo === 'new') {
        await crearCita(formData)
      } else {
        await actualizarCita(sheetCita.id, formData)
      }
      await cargarCitas(new Date(fechaBase))
      cerrarSheet()
      toast.success(sheetModo === 'new' ? 'Cita creada.' : 'Cita actualizada.')
    } catch (err) {
      console.error('Error guardando cita:', err)
      toast.error('No se pudo guardar la cita.')
    } finally {
      setSheetLoading(false)
    }
  }

  const handleEliminarCita = async () => {
    setSheetLoading(true)
    try {
      await eliminarCita(sheetCita.id)
      await cargarCitas(new Date(fechaBase))
      cerrarSheet()
      toast.success('Cita eliminada.')
    } catch (err) {
      console.error('Error eliminando cita:', err)
      toast.error('No se pudo eliminar la cita.')
    } finally {
      setSheetLoading(false)
    }
  }

  // Drag & drop: actualización optimista + persistencia; revierte si falla
  const handleMoverCita = async (cita, nuevoInicioMin) => {
    const inicioPrev = cita.inicio
    const finPrev = cita.fin
    const base = new Date(cita.inicio)
    const duracionMs = new Date(cita.fin) - base
    const nuevoInicio = new Date(
      base.getFullYear(), base.getMonth(), base.getDate(),
      Math.floor(nuevoInicioMin / 60), nuevoInicioMin % 60
    )
    const nuevoFin = new Date(nuevoInicio.getTime() + duracionMs)

    setCitas(prev =>
      prev.map(c =>
        c.id === cita.id
          ? { ...c, inicio: nuevoInicio.toISOString(), fin: nuevoFin.toISOString() }
          : c
      )
    )
    try {
      await actualizarCita(cita.id, {
        inicio: nuevoInicio.toISOString(),
        fin: nuevoFin.toISOString(),
      })
      toast.success(`Cita movida a las ${toHHMM(nuevoInicioMin)}.`)
    } catch (err) {
      console.error('Error al mover cita:', err)
      setCitas(prev =>
        prev.map(c => (c.id === cita.id ? { ...c, inicio: inicioPrev, fin: finPrev } : c))
      )
      toast.error('No se pudo mover la cita.')
    }
  }

  const tituloFecha = new Date(`${fechaSel}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="pb-16">
      <div className="sticky top-14 z-20">
        <CabeceraAgenda
          semana={semana}
          fechaSel={fechaSel}
          diasConCitas={diasConCitas}
          onSelDia={setFechaSel}
          onSemana={delta =>
            setFechaBase(prev => {
              const d = new Date(prev)
              d.setDate(d.getDate() + delta * 7)
              return d
            })
          }
          onHoy={() => {
            setFechaBase(new Date())
            setFechaSel(claveFechaLocal(new Date()))
          }}
        />
        <div className="flex items-center justify-between bg-white border border-[--border] rounded-2xl px-4 py-2 mt-2">
          <span className="text-xs text-[--text-light]">{tituloFecha}</span>
          <span className="text-[11px] bg-primary-light text-primary-darker rounded-full px-2.5 py-0.5 font-semibold">
            {citasDia.length} cita{citasDia.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingState texto="Cargando citas…" />
      ) : (
        <div className="pt-2">
          <TimelineDia
            citasDia={citasDia}
            esHoy={esHoy}
            onAbrirCita={c => {
              setSheetCita(c)
              setSheetModo('view')
            }}
            onMoverCita={handleMoverCita}
          />
        </div>
      )}

      <CitaSheet
        cita={sheetCita}
        modo={sheetModo}
        onClose={cerrarSheet}
        onSave={handleGuardarCita}
        onEdit={() => setSheetModo('edit')}
        onDelete={handleEliminarCita}
        loading={sheetLoading}
      />
    </div>
  )
}
