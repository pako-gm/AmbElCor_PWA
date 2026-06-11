import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { crearCliente } from '@/hooks/useClientes'
import { validarTelefono, validarEmail } from '@/utils/validators'
import { useToast } from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'

export default function NuevoCliente() {
  const navigate = useNavigate()
  const toast = useToast()
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
    if (form.telefono && !validarTelefono(form.telefono)) errs.telefono = 'Debe tener exactamente 9 dígitos.'
    if (form.email && !validarEmail(form.email)) errs.email = 'Email no válido.'
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  const handleGuardar = async () => {
    if (!validar()) return
    setGuardando(true)
    try {
      const cliente = await crearCliente({ ...form })
      toast.success('Cliente creado.')
      navigate(`/clientes/${cliente.id}`)
    } catch (e) {
      console.error(e)
      toast.error('No se pudo guardar el cliente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Cabecera */}
        <PageHeader titulo="Nuevo cliente" backTo="/clientes" />

        {/* Datos personales */}
        <section className="bg-white rounded-lg border border-[--border] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[--text-medium]">Datos personales</h2>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" required error={errores.nombre}>
              <Input
                type="text"
                placeholder="Nombre"
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
              />
            </Field>
            <Field label="Apellidos">
              <Input
                type="text"
                placeholder="Apellidos"
                value={form.apellidos}
                onChange={e => set('apellidos', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" error={errores.telefono}>
              <Input
                type="tel"
                placeholder="612345678"
                value={form.telefono}
                onChange={e => set('telefono', e.target.value.replace(/\D/g, '').slice(0, 9))}
              />
            </Field>
            <Field label="Email" error={errores.email}>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notas">
            <Textarea
              placeholder="Observaciones sobre el cliente…"
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
            />
          </Field>
        </section>

        {/* Botones */}
        <div className="flex gap-3">
          <Button size="lg" className="flex-1" onClick={handleGuardar} loading={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cliente'}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/clientes')}>
            Cancelar
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
