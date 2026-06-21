import { useState, useEffect, useRef } from 'react'
import { X, Trash2, Edit2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { fetchClientes } from '@/hooks/useClientes'
import { sanitizers } from '@/utils/validators'
import { TIPOS_CITA, HORA_INICIO_MIN, HORA_FIN_MIN, toHHMM } from './citasUtils'

function formatearHora(date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const labelCls = 'block text-[11px] uppercase tracking-wider text-[--text-light] mb-1.5'

// Bottom sheet de cita: detalle (view), edición (edit) y alta (new)
export default function CitaSheet({ cita, modo, onClose, onSave, onEdit, onDelete, loading }) {
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
    setErrorCliente('')
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

  const handleDelete = async () => {
    if (confirmDelete) {
      await onDelete()
      setConfirmDelete(false)
    }
  }

  const generarHoras = (minDesde = HORA_INICIO_MIN) => {
    const horas = []
    for (let m = minDesde; m <= HORA_FIN_MIN; m += 30) horas.push(toHHMM(m))
    return horas
  }

  const horasDisponibles = generarHoras()
  const minInicioActual = form.inicio.getHours() * 60 + form.inicio.getMinutes()
  const horasFinDisponibles = generarHoras(Math.max(minInicioActual + 30, HORA_INICIO_MIN))

  if (!cita && modo !== 'new') return null

  const abierto = cita || modo === 'new'
  const tipoSel = TIPOS_CITA[form.tipo] || TIPOS_CITA.consulta

  return (
    <>
      {abierto && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-x-0 bottom-0 bg-white z-50 rounded-t-3xl px-5 pt-3 pb-7 shadow-2xl transition-transform duration-300 max-h-[90vh] overflow-y-auto md:max-w-lg md:mx-auto md:rounded-t-2xl ${
          abierto ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-8 h-1 bg-[--border] rounded-full mx-auto mb-4" />

        {modo === 'view' && (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span
                  className="inline-block rounded-lg px-2.5 py-0.5 text-xs font-semibold mb-1.5"
                  style={{ background: `${tipoSel.color}22`, color: tipoSel.color }}
                >
                  {tipoSel.emoji} {tipoSel.label}
                </span>
                <h2 className="text-xl font-bold text-[--text-dark]">{form.cliente_nombre}</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                { label: 'Inicio', val: formatearHora(form.inicio) },
                { label: 'Fin', val: formatearHora(form.fin) },
                { label: 'Duración', val: `${Math.round((form.fin - form.inicio) / 60000)} min` },
                { label: 'Fecha', val: form.inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) },
              ].map(r => (
                <div key={r.label} className="bg-[--bg-gray] rounded-xl px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-[--text-light] mb-0.5">{r.label}</p>
                  <p className="text-[15px] font-semibold text-[--text-dark]">{r.val}</p>
                </div>
              ))}
            </div>

            {form.notas && (
              <div className="bg-primary-light/60 rounded-xl px-3 py-2 border-l-[3px] border-primary mb-4">
                <p className="text-[9px] uppercase tracking-wider text-primary mb-0.5">Nota</p>
                <p className="text-sm italic text-[--text-dark]">{form.notas}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button full onClick={onEdit}>
                <Edit2 size={16} />
                Editar
              </Button>
              <Button variant="danger-outline" full onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} />
                Eliminar
              </Button>
            </div>
          </div>
        )}

        {(modo === 'edit' || modo === 'new') && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[--text-dark]">
                {modo === 'edit' ? 'Editar cita' : 'Nueva cita'}
              </h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative mb-4" ref={dropdownRef}>
              <label className={labelCls}>Cliente</label>
              <input
                type="text"
                value={filtroClientes || form.cliente_nombre}
                onChange={e => {
                  setFiltroClientes(sanitizers.texto(e.target.value))
                  setMostrarListaClientes(true)
                }}
                onFocus={() => setMostrarListaClientes(true)}
                className={`w-full px-3 py-2.5 bg-[--bg-gray] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-[15px] ${errorCliente ? 'border-red-400' : 'border-[--border]'}`}
                placeholder="Nombre de la clienta…"
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

            <div className="mb-4">
              <label className={labelCls}>Tipo</label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(TIPOS_CITA).map(([key, { label, emoji, color }]) => {
                  const sel = form.tipo === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateForm('tipo', key)}
                      className="rounded-xl px-1 py-2 text-xs font-medium border transition-colors"
                      style={
                        sel
                          ? { background: color, borderColor: color, color: '#fff' }
                          : { background: 'var(--bg-gray)', borderColor: 'var(--border)', color: 'var(--text-dark)' }
                      }
                    >
                      {emoji} {label.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={labelCls}>Inicio</label>
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
                  className="w-full px-3 py-2.5 bg-[--bg-gray] border border-[--border] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-[15px]"
                >
                  {horasDisponibles.map(hora => (
                    <option key={`inicio-${hora}`} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Fin</label>
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
                  className="w-full px-3 py-2.5 bg-[--bg-gray] border border-[--border] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-[15px]"
                >
                  {horasFinDisponibles.map(hora => (
                    <option key={`fin-${hora}`} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className={labelCls}>Nota</label>
              <textarea
                value={form.notas}
                onChange={e => updateForm('notas', sanitizers.texto(e.target.value))}
                className="w-full px-3 py-2.5 bg-[--bg-gray] border border-[--border] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none text-[15px]"
                placeholder="Opcional…"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button full onClick={handleSave} loading={loading}>
                {loading ? 'Guardando…' : modo === 'edit' ? 'Guardar cambios' : 'Guardar cita'}
              </Button>
              <Button variant="secondary" full onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmDelete}
          title="¿Eliminar esta cita?"
          description="Esta acción no se puede deshacer."
          confirmLabel={loading ? 'Eliminando…' : 'Eliminar'}
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      </div>
    </>
  )
}
