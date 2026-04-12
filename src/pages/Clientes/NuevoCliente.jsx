import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { crearCliente } from '@/hooks/useClientes'

export default function NuevoCliente() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '', apellidos: '', telefono: '', email: '', notas: '',
  })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const set = (campo, valor) => {
    setForm(v => ({ ...v, [campo]: valor }))
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: undefined }))
  }

  const validar = () => {
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio.'
    if (form.telefono && !/^\d{9}$/.test(form.telefono)) errs.telefono = 'Debe tener exactamente 9 dígitos.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email no válido.'
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  const handleGuardar = async () => {
    if (!validar()) return
    setGuardando(true)
    try {
      const cliente = await crearCliente({ ...form })
      navigate(`/clientes/${cliente.id}`)
    } catch (e) {
      console.error(e)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clientes')} className="text-[--text-light] hover:text-[--text-dark]">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-display text-xl text-[--text-dark]">Nuevo cliente</h1>
        </div>

        {/* Datos personales */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Datos personales</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[--text-light]">Nombre *</label>
              <input
                type="text"
                placeholder="Nombre"
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${errores.nombre ? 'border-red-400' : 'border-[--border]'}`}
              />
              {errores.nombre && <p className="text-xs text-red-500">{errores.nombre}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[--text-light]">Apellidos</label>
              <input
                type="text"
                placeholder="Apellidos"
                value={form.apellidos}
                onChange={e => set('apellidos', e.target.value)}
                className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[--text-light]">Teléfono</label>
              <input
                type="tel"
                placeholder="612345678"
                value={form.telefono}
                onChange={e => set('telefono', e.target.value.replace(/\D/g, '').slice(0, 9))}
                className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${errores.telefono ? 'border-red-400' : 'border-[--border]'}`}
              />
              {errores.telefono && <p className="text-xs text-red-500">{errores.telefono}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[--text-light]">Email</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${errores.email ? 'border-red-400' : 'border-[--border]'}`}
              />
              {errores.email && <p className="text-xs text-red-500">{errores.email}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[--text-light]">Notas</label>
            <textarea
              placeholder="Observaciones sobre el cliente…"
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              rows={2}
              className="w-full border border-[--border] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </section>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 bg-primary text-white py-2.5 rounded-md text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {guardando ? 'Guardando…' : 'Guardar cliente'}
          </button>
          <button
            onClick={() => navigate('/clientes')}
            className="px-4 py-2.5 border border-[--border] rounded-md text-sm text-[--text-medium] hover:bg-[--bg-alt] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </PageWrapper>
  )
}
