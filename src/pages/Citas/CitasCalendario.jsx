import { useState, useEffect, useRef } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import { fetchCitas, crearCita, actualizarCita, eliminarCita } from '@/hooks/useCitas'
import { fetchClientes } from '@/hooks/useClientes'
import { ChevronLeft, ChevronRight, X, Trash2, Edit2, Plus } from 'lucide-react'

const TIPOS_CITA = {
  prueba: { label: 'Prueba de traje', color: '#C8102E', emoji: '👗' },
  entrega: { label: 'Entrega', color: '#C9A84C', emoji: '🎁' },
  ajuste: { label: 'Ajuste / retoque', color: '#7C5C8E', emoji: '✂️' },
  consulta: { label: 'Consulta inicial', color: '#2A7A5E', emoji: '💬' },
  pago: { label: 'Pago / seña', color: '#1A6FA8', emoji: '💳' },
}

const PX_POR_MIN = 2.2
const HORA_INICIO = 8
const HORA_FIN = 20
const MINUTOS_POR_DIA = (HORA_FIN - HORA_INICIO) * 60

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom']
const DIAS_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function obtenerLunesDelaSemana(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - (day === 0 ? 6 : day - 1)
  return new Date(d.setDate(diff))
}

function formatearFechaLarga(date) {
  return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatearHora(date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function minutosDesdeInicio(date) {
  return (date.getHours() - HORA_INICIO) * 60 + date.getMinutes()
}

function detectarSolapamientos(citas) {
  const grupos = []
  const procesadas = new Set()

  citas.forEach((cita, idx) => {
    if (procesadas.has(idx)) return

    const grupo = [cita]
    procesadas.add(idx)

    citas.slice(idx + 1).forEach((otra, i) => {
      const realIdx = idx + 1 + i
      if (procesadas.has(realIdx)) return

      const se_solapan =
        new Date(cita.inicio) < new Date(otra.fin) &&
        new Date(cita.fin) > new Date(otra.inicio)

      if (se_solapan) {
        grupo.push(otra)
        procesadas.add(realIdx)
      }
    })

    if (grupo.length > 0) {
      grupos.push(grupo)
    }
  })

  return grupos.map(grupo => ({
    citas: grupo,
    columnas: grupo.length,
  }))
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
  const [clientes, setClientes] = useState([])
  const [filtroClientes, setFiltroClientes] = useState('')
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false)
  const dropdownRef = useRef(null)

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
      alert('Por favor selecciona un cliente')
      return
    }
    if (form.fin <= form.inicio) {
      form.fin = new Date(form.inicio.getTime() + 30 * 60000)
    }
    onSave(form)
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
      horas.push(`${h.toString().padStart(2, '0')}:15`)
      horas.push(`${h.toString().padStart(2, '0')}:30`)
      horas.push(`${h.toString().padStart(2, '0')}:45`)
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
                <p className="font-semibold text-[--text-dark] text-sm">
                  {form.inicio.toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            {form.notas && (
              <div className="py-4 bg-teal-50 px-4 rounded-lg border-l-4 border-primary">
                <p className="text-xs text-[--text-light] mb-2">Notas</p>
                <p className="text-sm text-[--text-dark]">{form.notas}</p>
              </div>
            )}

            <p className="text-sm text-[--text-dark] font-medium">{form.cliente_nombre}</p>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => onEdit()}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg hover:bg-primary-darker transition"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}

        {(modo === 'edit' || modo === 'new') && (
          <div className="space-y-4">
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
                className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Buscar o seleccionar cliente..."
              />
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

function TarjetaCita({ cita, columnIndex, columnCount, onOpen, onDragStart, onDragEnd }) {
  const minInicio = minutosDesdeInicio(new Date(cita.inicio))
  const duracion = (new Date(cita.fin) - new Date(cita.inicio)) / 60000
  const top = minInicio * PX_POR_MIN
  const height = duracion * PX_POR_MIN
  const width = 100 / columnCount
  const left = (columnIndex / columnCount) * 100

  const tipo = TIPOS_CITA[cita.tipo]

  const handleDragStart = e => {
    onDragStart(cita)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(cita)}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width: `${width}%`,
        left: `${left}%`,
        backgroundColor: tipo?.color + '15',
        borderLeftColor: tipo?.color,
      }}
      className="absolute cursor-move border-l-4 rounded-r-lg p-2 text-xs font-medium text-[--text-dark] hover:shadow-lg transition-shadow select-none"
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-lg">{tipo?.emoji}</span>
        <span className="text-[10px] font-semibold line-clamp-1">{tipo?.label}</span>
      </div>
      <div className="font-semibold line-clamp-1">{cita.cliente_nombre}</div>
      <div className="text-[10px] text-[--text-light] mt-0.5">
        {formatearHora(new Date(cita.inicio))} - {formatearHora(new Date(cita.fin))}
      </div>
    </div>
  )
}

export default function CitasCalendario() {
  const [semanaInicio, setSemanaInicio] = useState(() => obtenerLunesDelaSemana(new Date()))
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date())
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [sheetCita, setSheetCita] = useState(null)
  const [sheetModo, setSheetModo] = useState(null)
  const [nowLineTop, setNowLineTop] = useState(0)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [citaArrastrada, setCitaArrastrada] = useState(null)
  const timelineRef = useRef(null)
  const timelineContainerRef = useRef(null)

  const semanaFin = new Date(semanaInicio)
  semanaFin.setDate(semanaFin.getDate() + 7)

  const citasDelDiaSeleccionado = citas.filter(c => {
    const citaDate = new Date(c.inicio)
    return (
      citaDate.getFullYear() === diaSeleccionado.getFullYear() &&
      citaDate.getMonth() === diaSeleccionado.getMonth() &&
      citaDate.getDate() === diaSeleccionado.getDate()
    )
  })

  const grupos = detectarSolapamientos(citasDelDiaSeleccionado)

  useEffect(() => {
    cargarCitas()
  }, [semanaInicio])

  useEffect(() => {
    const updateNowLine = () => {
      const ahora = new Date()
      const minutos = minutosDesdeInicio(ahora)
      if (minutos >= 0 && minutos <= MINUTOS_POR_DIA) {
        setNowLineTop(minutos * PX_POR_MIN)
      }
    }

    updateNowLine()
    const intervalo = setInterval(updateNowLine, 60000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    const ahora = new Date()
    const minutos = minutosDesdeInicio(ahora)
    if (minutos >= 0 && minutos <= MINUTOS_POR_DIA && timelineContainerRef.current) {
      const scrollTop = minutos * PX_POR_MIN - 100
      timelineContainerRef.current.scrollTop = Math.max(0, scrollTop)
    }
  }, [diaSeleccionado])

  const cargarCitas = async () => {
    try {
      setLoading(true)
      const data = await fetchCitas({
        inicio: semanaInicio.toISOString(),
        fin: semanaFin.toISOString(),
      })
      setCitas(data || [])
    } catch (err) {
      console.error('Error cargando citas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardarCita = async form => {
    try {
      setSheetLoading(true)
      const citaData = {
        cliente_id: form.cliente_id,
        cliente_nombre: form.cliente_nombre,
        tipo: form.tipo,
        inicio: form.inicio.toISOString(),
        fin: form.fin.toISOString(),
        notas: form.notas,
      }
      console.log('Guardando cita:', citaData)
      if (sheetModo === 'new') {
        await crearCita(citaData)
      } else if (sheetModo === 'edit') {
        await actualizarCita(sheetCita.id, citaData)
      }
      console.log('Cita guardada, cargando citas...')
      await cargarCitas()
      setSheetCita(null)
      setSheetModo(null)
    } catch (err) {
      console.error('Error guardando cita:', err.message, err)
      alert(`Error al guardar: ${err.message}`)
    } finally {
      setSheetLoading(false)
    }
  }

  const handleEliminarCita = async () => {
    try {
      setSheetLoading(true)
      await eliminarCita(sheetCita.id)
      await cargarCitas()
      setSheetCita(null)
      setSheetModo(null)
    } catch (err) {
      console.error('Error eliminando cita:', err)
    } finally {
      setSheetLoading(false)
    }
  }

  const handleDragOverTimeline = e => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropTimeline = async e => {
    e.preventDefault()
    if (!citaArrastrada || citaArrastrada.inicio === undefined) return

    const timelineDiv = e.currentTarget
    const rect = timelineDiv.getBoundingClientRect()
    const yRelativa = e.clientY - rect.top
    const minutos = Math.round(yRelativa / PX_POR_MIN)
    const nuevaHoraInicio = Math.max(0, Math.min(minutos, MINUTOS_POR_DIA - 30))

    const horaInicio = HORA_INICIO + Math.floor(nuevaHoraInicio / 60)
    const minutoInicio = nuevaHoraInicio % 60
    const duracionMin = (new Date(citaArrastrada.fin) - new Date(citaArrastrada.inicio)) / 60000

    const nuevoInicio = new Date(diaSeleccionado)
    nuevoInicio.setHours(horaInicio, minutoInicio, 0, 0)

    const nuevoFin = new Date(nuevoInicio)
    nuevoFin.setMinutes(nuevoFin.getMinutes() + duracionMin)

    try {
      setSheetLoading(true)
      await actualizarCita(citaArrastrada.id, {
        cliente_id: citaArrastrada.cliente_id,
        cliente_nombre: citaArrastrada.cliente_nombre,
        tipo: citaArrastrada.tipo,
        inicio: nuevoInicio.toISOString(),
        fin: nuevoFin.toISOString(),
        notas: citaArrastrada.notas,
      })
      await cargarCitas()
    } catch (err) {
      console.error('Error al actualizar cita:', err)
      alert('Error al mover la cita')
    } finally {
      setCitaArrastrada(null)
      setSheetLoading(false)
    }
  }

  const diasSemana = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(semanaInicio)
    d.setDate(d.getDate() + i)
    diasSemana.push(d)
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Header: navegación de semana */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSemanaInicio(new Date(semanaInicio.getTime() - 7 * 24 * 60 * 60 * 1000))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Semana anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setSemanaInicio(obtenerLunesDelaSemana(new Date()))}
              className="px-3 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary-light transition"
            >
              Hoy
            </button>
            <button
              onClick={() => setSemanaInicio(new Date(semanaInicio.getTime() + 7 * 24 * 60 * 60 * 1000))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Próxima semana"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-[--text-light]">
              {semanaInicio.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <button
            onClick={() => {
              setSheetCita(null)
              setSheetModo('new')
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-darker transition"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Cita</span>
          </button>
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {diasSemana.map((dia, idx) => {
            const citasDelDia = citas.filter(c => {
              const citaDate = new Date(c.inicio)
              return (
                citaDate.getFullYear() === dia.getFullYear() &&
                citaDate.getMonth() === dia.getMonth() &&
                citaDate.getDate() === dia.getDate()
              )
            })
            const isSelected = diaSeleccionado.toDateString() === dia.toDateString()
            const isToday = hoy.toDateString() === dia.toDateString()

            return (
              <button
                key={idx}
                onClick={() => setDiaSeleccionado(dia)}
                className={`p-3 rounded-lg border-2 text-center transition ${
                  isSelected
                    ? 'border-primary bg-primary-light'
                    : isToday
                    ? 'border-primary'
                    : 'border-[--border] hover:border-primary'
                }`}
              >
                <div className="text-xs font-semibold text-[--text-dark]">{DIAS_SEMANA[idx]}</div>
                <div className="text-lg font-semibold text-primary mt-1">{dia.getDate()}</div>
                {citasDelDia.length > 0 && (
                  <div className="mt-2 w-2 h-2 bg-primary rounded-full mx-auto"></div>
                )}
              </button>
            )
          })}
        </div>

        {/* Barra de fecha seleccionada */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/20 flex items-center justify-between">
          <div>
            <p className="text-sm text-[--text-light]">Día seleccionado</p>
            <p className="font-semibold text-[--text-dark] capitalize">
              {formatearFechaLarga(diaSeleccionado)}
            </p>
          </div>
          {citasDelDiaSeleccionado.length > 0 && (
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-semibold text-sm">
              {citasDelDiaSeleccionado.length}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div
          ref={timelineContainerRef}
          className="relative bg-white rounded-lg border border-[--border] overflow-y-auto flex max-h-[600px]"
          onDragOver={handleDragOverTimeline}
          onDrop={handleDropTimeline}
        >
          {/* Sidebar con horas */}
          <div className="w-12 flex-shrink-0 bg-gray-50 border-r border-[--border] pt-0">
            {Array.from({ length: (HORA_FIN - HORA_INICIO) * 2 }).map((_, idx) => {
              const h = HORA_INICIO + Math.floor(idx / 2)
              const m = (idx % 2) * 30
              return (
                <div
                  key={`hora-label-${idx}`}
                  className="text-xs text-[--text-light] font-semibold px-1 text-right h-full"
                  style={{ height: `${30 * PX_POR_MIN}px`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '4px' }}
                >
                  {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}
                </div>
              )
            })}
          </div>

          {/* Contenedor del timeline */}
          <div className="flex-1 relative">
            {/* Línea "ahora" */}
            {nowLineTop > 0 && nowLineTop < MINUTOS_POR_DIA * PX_POR_MIN && (
              <div
                style={{ top: `${nowLineTop}px` }}
                className="absolute left-0 right-0 z-10 flex items-center gap-2 pointer-events-none"
              >
                <div className="w-3 h-3 bg-red-600 rounded-full ml-2 flex-shrink-0"></div>
                <div className="flex-1 h-0.5 bg-red-600"></div>
                <span className="text-xs font-semibold text-red-600 pr-2 flex-shrink-0">Ahora</span>
              </div>
            )}

            {/* Horas */}
            <div className="relative" style={{ minHeight: `${MINUTOS_POR_DIA * PX_POR_MIN}px` }}>
              {Array.from({ length: HORA_FIN - HORA_INICIO }).map((_, idx) => {
                const hora = HORA_INICIO + idx
                const nextHora = hora + 1

                return (
                  <div key={`hour-${idx}`}>
                    {/* Línea de hora completa */}
                    <div className="relative border-t border-gray-200 h-0"></div>

                    {/* Líneas de media hora */}
                    {[0, 1, 2, 3].map((quarter) => {
                      const minutos = quarter * 15
                      return (
                        <div
                          key={`quarter-${idx}-${quarter}`}
                          className="border-t border-gray-100"
                          style={{ height: `${15 * PX_POR_MIN}px` }}
                        ></div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Tarjetas de citas */}
              {grupos.map((grupo, groupIdx) => (
                <div key={`grupo-${groupIdx}`} className="absolute inset-0 w-full">
                  {grupo.citas.map((cita, citaIdx) => (
                    <TarjetaCita
                      key={cita.id}
                      cita={cita}
                      columnIndex={citaIdx}
                      columnCount={grupo.columnas}
                      onOpen={c => {
                        setSheetCita(c)
                        setSheetModo('view')
                      }}
                      onDragStart={setCitaArrastrada}
                      onDragEnd={() => setCitaArrastrada(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-4 text-center text-sm text-[--text-light]">
            Cargando citas...
          </div>
        )}

        {!loading && citasDelDiaSeleccionado.length === 0 && (
          <div className="mt-6 text-center py-12 bg-gray-50 rounded-lg border border-[--border]">
            <p className="text-[--text-light] mb-2">No hay citas para este día</p>
            <button
              onClick={() => {
                setSheetCita(null)
                setSheetModo('new')
              }}
              className="text-sm font-medium text-primary hover:underline"
            >
              Crear una cita
            </button>
          </div>
        )}
      </div>

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
    </PageWrapper>
  )
}
