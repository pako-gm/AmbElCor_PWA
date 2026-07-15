// panels.jsx — vistas del flujo de acceso: contraseña, recuperar, alta y éxito.
// Portado de DESIGN/login AmbElCor/screens/views.jsx.
// ForgotView llama a la RPC solicitar_reset_password (FASE 5). UsuarioForm
// persiste de verdad vía la Edge Function admin-usuarios (FASE 6/8).
import { useState } from 'react'
import { ROLES, accentsDisponibles } from '@/lib/usuarios'
import { AC, Icon, Avatar, Field, Btn, Switch, TextLink } from './ui'
import { sanitizers } from '@/utils/validators'
import { supabase } from '@/lib/supabase'
import { invocarAdminUsuarios } from '@/lib/adminUsuarios'

const capitalizar = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

// Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 carácter especial (igual que
// la validación de la Edge Function admin-usuarios).
function passwordValida(p) {
  return typeof p === 'string' && p.length >= 8 &&
    /[A-ZÁÉÍÓÚÑ]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)
}

function generarPassword() {
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const minus = 'abcdefghijkmnpqrstuvwxyz'
  const num = '23456789'
  const especial = '!@#$%&*'
  const azar = (s) => s[Math.floor(Math.random() * s.length)]
  const base = [azar(mayus), azar(num), azar(especial)]
  const resto = minus + mayus + num
  for (let i = 0; i < 6; i++) base.push(azar(resto))
  return base.sort(() => Math.random() - 0.5).join('')
}

// ── PasswordPanel ────────────────────────────────────────────────────
export function PasswordPanel({ user, onBack, onSubmit, onForgot }) {
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)
  const a = AC.accents[user.accent] || AC.accents.salvia

  const submit = async () => {
    if (loading) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: pass })
    setLoading(false)
    if (error) { setErr(true) }
    else { setErr(false); onSubmit() }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'none', border: 'none', cursor: 'pointer', color: AC.muted, fontFamily: AC.sans, fontWeight: 600, fontSize: 13.5, padding: 0, whiteSpace: 'nowrap' }}>
        <Icon name="back" size={16} /> Cambiar de perfil
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar user={user} size={60} ring />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 25, color: AC.ink, lineHeight: 1.1 }}>{user.nombre}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: a.soft, color: a.ink,
              fontFamily: AC.sans, fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
              <Icon name="user" size={13} /> {capitalizar(user.rol)}
            </div>
          </div>
          <div style={{ fontFamily: AC.sans, fontWeight: 500, fontSize: 13, color: AC.muted, marginTop: 3 }}>{user.email}</div>
        </div>
      </div>

      <Field label="CONTRASEÑA" type={show ? 'text' : 'password'} value={pass} onChange={(v) => { setPass(v); setErr(false) }}
        onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Introduce tu contraseña" icon="lock" autoFocus invalid={err}
        trailing={
          <button onClick={() => setShow((s) => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={18} stroke={AC.faint} />
          </button>
        } />
      {err && <div style={{ marginTop: -8, color: AC.accents.rosa.ink, fontFamily: AC.sans, fontWeight: 600, fontSize: 13 }}>La contraseña no es correcta. Inténtalo de nuevo.</div>}

      <Btn variant="brand" full size="lg" onClick={submit} disabled={loading}>{loading ? 'Entrando…' : 'Entrar en el CRM'}</Btn>
      <div style={{ textAlign: 'center', marginTop: -4 }}>
        <TextLink onClick={onForgot} color={AC.muted}>¿Has olvidado la contraseña?</TextLink>
      </div>
    </div>
  )
}

// ── ForgotView ────────────────────────────────────────────────────────
// Los correos de usuario son ficticios: no hay reset por enlace de email.
// La solicitud queda registrada en solicitudes_password y la resuelve un
// gestor desde Ajustes → Usuarios (ver FASE 6 y FASE 8).
export function ForgotView({ user, onBack, onClose }) {
  const [email, setEmail] = useState(user ? user.email : '')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const enviar = async () => {
    setLoading(true)
    try {
      await supabase.rpc('solicitar_reset_password', { p_email: email })
    } catch {
      // Silencioso: no se revela si el email existe o no.
    }
    try {
      await supabase.functions.invoke('notificar-reset', { body: { email } })
    } catch {
      // Opcional: el aviso de campana es la garantía si no hay Resend configurado.
    }
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '8px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: AC.accents.salvia.pastel, color: AC.accents.salvia.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="mail" size={30} sw={1.8} /></div>
        <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 24, color: AC.ink }}>Aviso enviado</div>
        <div style={{ fontFamily: AC.sans, fontSize: 15, color: AC.muted, fontWeight: 500, lineHeight: 1.55, maxWidth: 320 }}>
          El administrador restablecerá tu contraseña.
        </div>
        <Btn variant="ghost" onClick={onClose}>Volver al acceso</Btn>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'none', border: 'none', cursor: 'pointer', color: AC.muted, fontFamily: AC.sans, fontWeight: 600, fontSize: 13.5, padding: 0, whiteSpace: 'nowrap' }}>
        <Icon name="back" size={16} /> Volver
      </button>
      <div>
        <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 26, color: AC.ink, lineHeight: 1.12 }}>Recuperar contraseña</div>
        <div style={{ fontFamily: AC.sans, fontSize: 15, color: AC.muted, fontWeight: 500, marginTop: 8, lineHeight: 1.55 }}>
          Escribe tu correo-e y avisaremos al administrador para restablecer tu contraseña.
        </div>
      </div>
      <Field label="CORREO ELECTRÓNICO" type="email" value={email} onChange={setEmail} placeholder="tu@ambelcor.com" icon="mail" autoFocus
        onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && !loading && enviar()} />
      <Btn variant="brand" full size="lg" icon="mail" disabled={!email.includes('@') || loading} onClick={enviar}>
        {loading ? 'Enviando…' : 'Enviar aviso'}
      </Btn>
    </div>
  )
}

// ── UsuarioForm ───────────────────────────────────────────────────────
// Usado en Ajustes dentro de un Modal. Persiste vía la Edge Function
// admin-usuarios (crear_usuario/cambiar_rol/toggle_activo).
// modo 'nuevo'  → alta (contraseña obligatoria + pantalla de éxito)
// modo 'editar' → edición (email fijo, resto editable)
export function UsuarioForm({ modo = 'nuevo', inicial, onClose, onSubmit, compact }) {
  const esEditar = modo === 'editar'
  const [name, setName] = useState(inicial?.nombre || '')
  const [email, setEmail] = useState(inicial?.email || '')
  const [role, setRole] = useState(inicial?.rol || 'costurera')
  const [accent, setAccent] = useState(inicial?.accent || 'salvia')
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const valid = name.trim() && (esEditar || (email.includes('@') && passwordValida(pass)))

  const crear = async () => {
    setError('')
    if (!passwordValida(pass)) {
      setError('La contraseña debe tener mínimo 8 caracteres, con una mayúscula, un número y un carácter especial')
      return
    }
    setLoading(true)
    try {
      await invocarAdminUsuarios('crear_usuario', { email, password: pass, nombre: name, rol: role, accent })
      setDone(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const actualizar = async () => {
    setError('')
    setLoading(true)
    try {
      if (name !== inicial.nombre || accent !== inicial.accent) {
        const { error: err } = await supabase.from('perfiles').update({ nombre: name, accent }).eq('id', inicial.id)
        if (err) throw err
      }
      if (role !== inicial.rol) {
        await invocarAdminUsuarios('cambiar_rol', { user_id: inicial.id, rol: role })
      }
      if (activo !== inicial.activo) {
        await invocarAdminUsuarios('toggle_activo', { user_id: inicial.id, activo })
      }
      onSubmit?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => { esEditar ? actualizar() : crear() }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '12px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: AC.brandSoft, color: AC.brandDeep,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={32} sw={2.2} /></div>
        <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 24, color: AC.ink }}>Usuario creado</div>
        <div style={{ fontFamily: AC.sans, fontSize: 15, color: AC.muted, fontWeight: 500, lineHeight: 1.55, maxWidth: 340 }}>
          <b style={{ color: AC.ink2 }}>{name}</b> ya puede acceder como <b style={{ color: AC.ink2 }}>{capitalizar(role)}</b>.
        </div>
        <div style={{ background: AC.bg, border: `1px solid ${AC.line}`, borderRadius: 12, padding: '10px 16px', width: '100%' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: AC.muted, letterSpacing: '.02em' }}>CONTRASEÑA INICIAL</div>
          <div style={{ fontFamily: 'monospace', fontSize: 16, color: AC.ink, marginTop: 3, letterSpacing: '.03em' }}>{pass}</div>
        </div>
        <Btn variant="ghost" onClick={() => onSubmit?.(pass)}>Cerrar</Btn>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 26, color: AC.ink, lineHeight: 1.12 }}>
          {esEditar ? 'Editar usuario' : 'Nuevo usuario'}
        </div>
        <div style={{ fontFamily: AC.sans, fontSize: 14.5, color: AC.muted, fontWeight: 500, marginTop: 7, lineHeight: 1.5 }}>
          {esEditar
            ? 'Modifica los datos y el rol de esta persona.'
            : 'Da de alta a una persona del taller. El email no necesita ser un buzón real, p. ej. nombre@ambelcor.com.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Field label="NOMBRE" value={name} onChange={(v) => setName(sanitizers.texto(v))} placeholder="Nombre y apellidos" icon="user" />
        <Field label="CORREO ELECTRÓNICO" type="email" value={email}
          onChange={(v) => setEmail(sanitizers.email(v))}
          placeholder="nombre@ambelcor.com" icon="mail" disabled={esEditar} />
      </div>

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: AC.muted, letterSpacing: '.02em', marginBottom: 7 }}>ROL</div>
        <div style={{ display: 'flex', gap: 8, background: AC.bg, padding: 4, borderRadius: 12, border: `1px solid ${AC.line}` }}>
          {ROLES.map((r) => {
            const sel = r === role
            return (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, height: 40, borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: AC.sans, fontWeight: 700, fontSize: 13.5, color: sel ? AC.ink : AC.muted,
                background: sel ? '#fff' : 'transparent', boxShadow: sel ? '0 1px 4px rgba(0,0,0,.1)' : 'none', transition: 'all .15s' }}>{capitalizar(r)}</button>
            )
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: AC.muted, letterSpacing: '.02em', marginBottom: 7 }}>COLOR DE AVATAR</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {accentsDisponibles.map((a) => {
            const c = AC.accents[a]
            const sel = a === accent
            return (
              <button key={a} type="button" onClick={() => setAccent(a)} aria-label={a}
                style={{ width: 32, height: 32, borderRadius: '50%', background: c.pastel, cursor: 'pointer',
                  border: sel ? `2px solid ${c.ink}` : '2px solid transparent',
                  boxShadow: sel ? `0 0 0 3px ${c.soft}` : 'none', transition: 'all .15s' }} />
            )
          })}
        </div>
      </div>

      {!esEditar && (
        <Field label="CONTRASEÑA INICIAL" type={showPass ? 'text' : 'password'} value={pass} onChange={setPass}
          placeholder="Mínimo 8 caracteres" icon="lock"
          trailing={
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setShowPass((s) => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <Icon name={showPass ? 'eyeOff' : 'eye'} size={18} stroke={AC.faint} />
              </button>
              <TextLink onClick={() => setPass(generarPassword())}>Generar</TextLink>
            </div>
          } />
      )}
      {!esEditar && (
        <div style={{ fontSize: 12.5, color: AC.muted, marginTop: -10 }}>
          Mínimo 8 caracteres, con una mayúscula, un número y un carácter especial.
        </div>
      )}

      {esEditar && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
          background: AC.bg, borderRadius: 12, border: `1px solid ${AC.line}` }}>
          <span style={{ fontFamily: AC.sans, fontWeight: 600, fontSize: 14, color: AC.ink2 }}>Usuario activo</span>
          <Switch on={activo} onChange={setActivo} />
        </div>
      )}

      {error && <div style={{ color: AC.accents.rosa.ink, fontFamily: AC.sans, fontWeight: 600, fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>{esEditar ? 'Cerrar' : 'Cancelar'}</Btn>
        <Btn variant="brand" full icon={esEditar ? 'check' : 'plus'} disabled={!valid || loading} onClick={handleSubmit}>
          {loading ? 'Guardando…' : esEditar ? 'Actualizar datos' : 'Crear usuario'}
        </Btn>
      </div>
    </div>
  )
}
