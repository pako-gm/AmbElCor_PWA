import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchCitas, crearCita, actualizarCita, eliminarCita } from '@/hooks/useCitas'
import { fetchClientes } from '@/hooks/useClientes'
import { useToast } from '@/hooks/useToast'
import { X, Trash2, Edit2, Plus } from 'lucide-react'

const TIPOS_CITA = {
  prueba: { label: 'Prueba de traje', color: '#C8102E', bgColor: '#C8102E1A', emoji: '👗' },
  entrega: { label: 'Entrega', color: '#C9A84C', bgColor: '#C9A84C1A', emoji: '🎁' },
  ajuste: { label: 'Ajuste / retoque', color: '#7C5C8E', bgColor: '#7C5C8E1A', emoji: '✂️' },
  consulta: { label: 'Consulta inicial', color: '#2A7A5E', bgColor: '#2A7A5E1A', emoji: '💬' },
  pago: { label: 'Pago / seña', color: '#1A6FA8', bgColor: '#1A6FA81A', emoji: '💳' },
}

const HORA_INICIO = 8
const HORA_FIN = 20

function formatearHora(date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function BottomSheet({ cita, modo, onClose, onSave, onEdit, onDelete, loading }) {
  const [form, setForm] = useState({
    cliente_id: cita?.cliente_id || null,
    cliente_nombre: cita?.cliente_nombre || '',
    tipo: cita?.tipo || 'prueba',
    inicio: cita?.inicio ? new Date(cita.inicio) : new Date(),
    fin: cita?.fin ? new Date(cita.fin) : new Date(new Date().getTime() + 30 * 60000),
    notas: cita?.notas || '',
  })

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errorCliente, setErrorCliente] = useState('')
  const [clientes, setClientes] = useState([])
  const [filtroClientes, setFiltroClientes] = useState('')
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    setForm({
      cliente_id: cita?.cliente_id || null,
      cliente_nombre: cita?.cliente_nombre || '',
      tipo: cita?.tipo || 'prueba',
      inicio: cita?.inicio ? new Date(cita.inicio) : new Date(),
      fin: cita?.fin ? new Date(cita.fin) : new Date(new Date().getTime() + 30 * 60000),
      notas: cita?.notas || '',
    })
    setFiltroClientes('')
  }, [cita])

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const data = await fetchClientes()
        setClientes(data || [])
      } catch (err) {
        console.error('Error cargando clientes:', err)
      }
    }
    if (modo === 'new' || modo === 'edit') {
      cargarClientes()
    }
  }, [modo])

  useEffect(() => {
    const handleClickFuera = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarListaClientes(false)
      }
    }
    if (mostrarListaClientes) {
      document.addEventListener('mousedown', handleClickFuera)
      return () => document.removeEventListener('mousedown', handleClickFuera)
    }
  }, [mostrarListaClientes])

  const updateForm = (field, value) => {
    let newForm = { ...form, [field]: value }

    if (field === 'inicio') {
      const duracionMin = Math.max(30, (newForm.fin - newForm.inicio) / 60000)
      newForm.fin = new Date(newForm.inicio.getTime() + duracionMin * 60000)
    }

    if (field === 'fin' && newForm.fin <= newForm.inicio) {
      newForm.fin = new Date(newForm.inicio.getTime() + 30 * 60000)
    }

    setForm(newForm)
  }

  const handleSave = () => {
    if (!form.cliente_id || !form.cliente_nombre.trim()) {
      setErrorCliente('Selecciona un cliente para la cita.')
      return
    }
    setErrorCliente('')
    const datos = form.fin <= form.inicio
      ? { ...form, fin: new Date(form.inicio.getTime() + 30 * 60000) }
      : form
    onSave(datos)
  }

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete()
      setConfirmDelete(false)
    }
  }

  const generarHoras = (horaMinima = HORA_INICIO) => {
    const horas = []
    for (let h = horaMinima; h < HORA_FIN; h++) {
      horas.push(`${h.toString().padStart(2, '0')}:00`)
      horas.push(`${h.toString().padStart(2, '0')}:30`)
    }
    horas.push('20:00')
    return horas
  }

  const horasDisponibles = generarHoras(HORA_INICIO)
  const horaInicioActual = form.inicio.getHours()
  const minutosInicio = form.inicio.getMinutes()
  const horasFinDisponibles = generarHoras(horaInicioActual).filter(hora => {
    if (horaInicioActual < 20) {
      const [h, m] = hora.split(':').map(Number)
      return h > horaInicioActual || (h === horaInicioActual && m >= minutosInicio)
    }
    return hora === '20:00'
  })

  if (!cita && modo !== 'new') return null

  return (
    <>
      {cita && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed left-0 right-0 bottom-0 bg-white z-50 rounded-t-3xl p-6 shadow-2xl transition-transform duration-300 max-h-[90vh] overflow-y-auto ${
          cita || modo === 'new' ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          {modo === 'view' && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{TIPOS_CITA[form.tipo]?.emoji}</span>
              <h2 className="text-xl font-semibold text-[--text-dark]">
                {TIPOS_CITA[form.tipo]?.label}
              </h2>
            </div>
          )}
          {(modo === 'edit' || modo === 'new') && (
            <h2 className="text-xl font-semibold text-[--text-dark]">
              {modo === 'edit' ? 'Editar cita' : 'Nueva cita'}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {modo === 'view' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 py-4 border-y">
              <div>
                <p className="text-xs text-[--text-light] mb-1">Hora inicio</p>
                <p className="font-semibold text-[--text-dark]">{formatearHora(form.inicio)}</p>
              </div>
              <div>
                <p className="text-xs text-[--text-light] mb-1">Hora fin</p>
                <p className="font-semibold text-[--text-dark]">{formatearHora(form.fin)}</p>
              </div>
              <div>
                <p className="text-xs text-[--text-light] mb-1">Duración</p>
                <p className="font-semibold text-[--text-dark]">
                  {Math.round((form.fin - form.inicio) / 60000)} min
                </p>
              </div>
              <div>
                <p className="text-xs text-[--text-light] mb-1">Fecha</p>
                <p className="font-semibold text-[--text-dark]">
                  {form.inicio.toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            {form.notas && (
              <div>
                <p className="text-xs text-[--text-light] mb-2">Notas</p>
                <p className="text-sm text-[--text-dark]">{form.notas}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-[--text-light] mb-1">Cliente</p>
              <p className="font-semibold text-[--text-dark]">{form.cliente_nombre}</p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg hover:bg-primary-darker transition"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-700 py-2 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        )}

        {(modo === 'edit' || modo === 'new') && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[--text-dark] mb-2">
                  Hora inicio
                </label>
                <select
                  value={`${form.inicio.getHours().toString().padStart(2, '0')}:${form.inicio
                    .getMinutes()
                    .toString()
                    .padStart(2, '0')}`}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':')
                    const newDate = new Date(form.inicio)
                    newDate.setHours(parseInt(h), parseInt(m), 0)
                    updateForm('inicio', newDate)
                  }}
                  className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  {horasDisponibles.map(hora => (
                    <option key={`inicio-${hora}`} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[--text-dark] mb-2">
                  Hora fin
                </label>
                <select
                  value={`${form.fin.getHours().toString().padStart(2, '0')}:${form.fin
                    .getMinutes()
                    .toString()
                    .padStart(2, '0')}`}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':')
                    const newDate = new Date(form.fin)
                    newDate.setHours(parseInt(h), parseInt(m), 0)
                    updateForm('fin', newDate)
                  }}
                  className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  {horasFinDisponibles.map(hora => (
                    <option key={`fin-${hora}`} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-[--text-dark] mb-2">
                Nombre del cliente
              </label>
              <input
                type="text"
                value={filtroClientes || form.cliente_nombre}
                onChange={e => {
                  setFiltroClientes(e.target.value)
                  setMostrarListaClientes(true)
                }}
                onFocus={() => setMostrarListaClientes(true)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${errorCliente ? 'border-red-400' : 'border-[--border]'}`}
                placeholder="Buscar o seleccionar cliente..."
              />
              {errorCliente && <p role="alert" className="text-xs text-red-500 mt-1">{errorCliente}</p>}
              {mostrarListaClientes && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[--border] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {clientes
                    .filter(c => {
                      const nombre = `${c.nombre} ${c.apellidos || ''}`.toLowerCase()
                      return nombre.includes(filtroClientes.toLowerCase())
                    })
                    .slice(0, 10)
                    .map(cliente => (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            cliente_id: cliente.id,
                            cliente_nombre: `${cliente.nombre}${cliente.apellidos ? ' ' + cliente.apellidos : ''}`
                          }))
                          setErrorCliente('')
                          setFiltroClientes('')
                          setMostrarListaClientes(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 transition border-b border-gray-100 last:border-b-0 text-sm text-[--text-dark]"
                      >
                        <div className="font-medium">{cliente.nombre}</div>
                        {cliente.apellidos && <div className="text-xs text-[--text-light]">{cliente.apellidos}</div>}
                        {cliente.telefono && <div className="text-xs text-[--text-light]">{cliente.telefono}</div>}
                      </button>
                    ))}
                  {clientes.filter(c => {
                    const nombre = `${c.nombre} ${c.apellidos || ''}`.toLowerCase()
                    return nombre.includes(filtroClientes.toLowerCase())
                  }).length === 0 && (
                    <div className="px-3 py-2 text-xs text-[--text-light] text-center">
                      No hay clientes coincidentes
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[--text-dark] mb-3">
                Tipo de cita
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TIPOS_CITA).map(([key, { label, emoji }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateForm('tipo', key)}
                    className={`p-3 rounded-lg border-2 text-center transition ${
                      form.tipo === key
                        ? 'border-primary bg-primary-light'
                        : 'border-[--border] hover:border-primary'
                    }`}
                  >
                    <div className="text-xl">{emoji}</div>
                    <div className="text-xs mt-1">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[--text-dark] mb-2">Notas</label>
              <textarea
                value={form.notas}
                onChange={e => updateForm('notas', e.target.value)}
                className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Detalles adicionales..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary-darker transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : modo === 'edit' ? 'Guardar cambios' : 'Guardar cita'}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 border border-[--border] text-[--text-dark] py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 mb-4">¿Eliminar esta cita? No se puede deshacer.</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className="flex-1 border border-red-200 text-red-700 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function CitasCalendario() {
  const toast = useToast()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [sheetCita, setSheetCita] = useState(null)
  const [sheetModo, setSheetModo] = useState(null)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [fechasVisibles, setFechasVisibles] = useState({ start: new Date(), end: new Date() })
  const calendarRef = useRef(null)

  useEffect(() => {
    cargarCitas()
  }, [])

  const cargarCitas = async () => {
    try {
      const ahora = new Date()
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 30)
      const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 60)
      const data = await fetchCitas({
        inicio: inicio.toISOString(),
        fin: fin.toISOString()
      })
      setCitas(data || [])
    } catch (err) {
      console.error('Error cargando citas:', err)
    }
  }

  const handleGuardarCita = async (formData) => {
    setSheetLoading(true)
    try {
      if (sheetModo === 'new') {
        await crearCita(formData)
      } else {
        await actualizarCita(sheetCita.id, formData)
      }
      await cargarCitas()
      setSheetCita(null)
      setSheetModo(null)
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
      await cargarCitas()
      setSheetCita(null)
      setSheetModo(null)
      toast.success('Cita eliminada.')
    } catch (err) {
      console.error('Error eliminando cita:', err)
      toast.error('No se pudo eliminar la cita.')
    } finally {
      setSheetLoading(false)
    }
  }

  const citasVisibles = citas.filter(c => {
    const citaDate = new Date(c.inicio)
    return citaDate >= fechasVisibles.start && citaDate < fechasVisibles.end
  }).length

  const formatearTituloFecha = () => {
    const start = new Date(fechasVisibles.start)
    const end = new Date(fechasVisibles.end)
    const esUnDia = (end - start) === 24 * 60 * 60 * 1000

    if (esUnDia) {
      return start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    } else {
      const fmt = { day: 'numeric', month: 'short' }
      const startStr = start.toLocaleDateString('es-ES', fmt)
      const endStr = new Date(end.getTime() - 1).toLocaleDateString('es-ES', fmt)
      return `${startStr} – ${endStr}`
    }
  }

  const calendarOptions = {
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay',
    },
    buttonText: {
      today: 'Hoy',
      week: 'Semana',
      day: 'Día',
    },
    slotMinTime: `${String(HORA_INICIO).padStart(2, '0')}:00:00`,
    slotMaxTime: `${String(HORA_FIN).padStart(2, '0')}:00:01`,
    weekends: true,
    slotDuration: '00:30:00',
    slotLabelInterval: '00:30:00',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
    },
    allDaySlot: false,
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      startTime: '08:00',
      endTime: '20:00',
    },
    editable: true,
    eventStartEditable: true,
    eventDurationEditable: false,
    selectable: true,
    selectConstraint: 'businessHours',
    eventConstraint: 'businessHours',
    eventDisplay: 'block',
    height: 'auto',
    contentHeight: 'auto',
    eventContent: (arg) => {
      const cita = citas.find(c => c.id === arg.event.id)
      if (!cita) return null
      const horaInicio = arg.event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      const horaFin = arg.event.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      const color = TIPOS_CITA[cita.tipo]?.color || '#666'
      const emoji = TIPOS_CITA[cita.tipo]?.emoji || ''
      const label = TIPOS_CITA[cita.tipo]?.label || ''
      return {
        html: `<div style="display:flex;align-items:center;gap:4px;font-weight:600;font-size:0.8rem;color:${color};margin-bottom:2px">${emoji} ${label}</div><div style="font-size:0.72rem;color:#666;margin-bottom:2px">${horaInicio}–${horaFin}</div><div style="font-weight:700;font-size:0.8rem;color:#1a1a1a">${cita.cliente_nombre}</div>`
      }
    },
    eventClick: info => {
      const citaData = citas.find(c => c.id === info.event.id)
      if (citaData) {
        setSheetCita(citaData)
        setSheetModo('view')
      }
    },
    select: (info) => {
      setSheetCita({
        inicio: info.start,
        fin: info.end,
      })
      setSheetModo('new')
    },
    datesSet: (info) => {
      setFechasVisibles({ start: info.start, end: info.end })
    },
    eventDrop: async (info) => {
      try {
        await actualizarCita(info.event.id, {
          inicio: info.event.start.toISOString(),
          fin: info.event.end.toISOString(),
        })
        await cargarCitas()
      } catch (err) {
        console.error('Error al mover cita:', err)
        toast.error('No se pudo mover la cita.')
        info.revert()
      }
    },
    events: citas.map(cita => ({
      id: cita.id,
      title: `${TIPOS_CITA[cita.tipo]?.emoji} ${TIPOS_CITA[cita.tipo]?.label}
${cita.cliente_nombre}`,
      start: cita.inicio,
      end: cita.fin,
      backgroundColor: TIPOS_CITA[cita.tipo]?.bgColor,
      borderColor: TIPOS_CITA[cita.tipo]?.color,
      textColor: '#1a1a1a',
      extendedProps: {
        tipo: cita.tipo,
        citaData: cita,
      },
    })),
    locale: 'es',
    now: new Date(),
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-[--text-dark]">Calendario de Citas</h1>
          <button
            onClick={() => {
              setSheetCita(null)
              setSheetModo('new')
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-darker transition"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Nueva cita</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[--text-light]">Cargando citas...</div>
        ) : (
          <div className="bg-white rounded-lg border border-[--border] p-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-lg font-semibold text-[--text-dark] capitalize">
                {formatearTituloFecha()}
              </span>
              <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
                {citasVisibles} {citasVisibles === 1 ? 'cita' : 'citas'}
              </span>
            </div>
            <FullCalendar
              ref={calendarRef}
              {...calendarOptions}
            />
          </div>
        )}

        <BottomSheet
          cita={sheetCita}
          modo={sheetModo}
          onClose={() => {
            setSheetCita(null)
            setSheetModo(null)
          }}
          onSave={handleGuardarCita}
          onEdit={() => setSheetModo('edit')}
          onDelete={handleEliminarCita}
          loading={sheetLoading}
        />
      </div>
    </PageWrapper>
  )
}
