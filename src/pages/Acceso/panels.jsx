// panels.jsx — vistas del flujo de acceso: contraseña, recuperar, alta y éxito.
// Portado de DESIGN/login AmbElCor/screens/views.jsx.
// Recuperar y alta son DECORATIVOS: no tocan la BD (estado local).
import { useEffect, useState } from 'react'
import { ROLES } from '@/lib/usuarios'
import { AC, Icon, Avatar, Field, Btn, Switch, TextLink } from './ui'
import { sanitizers } from '@/utils/validators'

// Matriz de permisos decorativa (granular, solo para la maqueta de alta de usuario).
const PAGINAS_DECO = [
  { id: 'encargos',    name: 'Encargos',     icon: 'clipboard' },
  { id: 'clientes',    name: 'Clientes',     icon: 'users' },
  { id: 'catalogo',    name: 'Catálogo',     icon: 'book' },
  { id: 'citas',       name: 'Citas',        icon: 'calendar' },
  { id: 'inventario',  name: 'Inventario',   icon: 'box' },
  { id: 'proveedores', name: 'Proveedores',  icon: 'truck' },
  { id: 'contabilidad',name: 'Contabilidad', icon: 'chart' },
  { id: 'cobros',      name: 'Cobros',       icon: 'arrowDown' },
  { id: 'pagos',       name: 'Pagos',        icon: 'arrowUp' },
  { id: 'librodiario', name: 'Libro Diario', icon: 'bookOpen' },
  { id: 'ajustes',     name: 'Ajustes',      icon: 'gear' },
]
const TODAS_DECO = PAGINAS_DECO.map(p => p.id)
const ROLE_DEFAULTS_DECO = {
  'Propietaria':   TODAS_DECO,
  'Administrador': TODAS_DECO,
  'Costurera':     ['encargos', 'clientes', 'catalogo', 'citas', 'inventario', 'proveedores'],
}

// ── PasswordPanel ────────────────────────────────────────────────────
export function PasswordPanel({ user, onBack, onSubmit, onForgot }) {
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(false)
  const a = AC.accents[user.accent] || AC.accents.salvia
  const submit = () => {
    if (pass === user.pass) { setErr(false); onSubmit() }
    else { setErr(true) }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'none', border: 'none', cursor: 'pointer', color: AC.muted, fontFamily: AC.sans, fontWeight: 600, fontSize: 13.5, padding: 0, whiteSpace: 'nowrap' }}>
        <Icon name="back" size={16} /> Cambiar de perfil
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar user={user} size={60} ring />
        <div>
          <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 25, color: AC.ink, lineHeight: 1.1 }}>{user.nombre}</div>
          <div style={{ fontFamily: AC.sans, fontWeight: 500, fontSize: 13, color: AC.muted, marginTop: 3 }}>{user.email}</div>
          <div style={{ display: 'inline-flex', marginTop: 7, alignItems: 'center', gap: 6, background: a.soft, color: a.ink,
            fontFamily: AC.sans, fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>
            <Icon name="user" size={13} /> {user.rol}
          </div>
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

      <Btn variant="brand" full size="lg" onClick={submit}>Entrar en el CRM</Btn>
      <div style={{ textAlign: 'center', marginTop: -4 }}>
        <TextLink onClick={onForgot} color={AC.muted}>¿Has olvidado la contraseña?</TextLink>
      </div>
    </div>
  )
}

// ── ForgotView (decorativa) ──────────────────────────────────────────
export function ForgotView({ user, onBack, onClose }) {
  const [email, setEmail] = useState(user ? user.email : '')
  const [sent, setSent] = useState(false)
  if (sent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '8px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: AC.accents.salvia.pastel, color: AC.accents.salvia.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="mail" size={30} sw={1.8} /></div>
        <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 24, color: AC.ink }}>Correo enviado</div>
        <div style={{ fontFamily: AC.sans, fontSize: 15, color: AC.muted, fontWeight: 500, lineHeight: 1.55, maxWidth: 320 }}>
          Hemos enviado un enlace de recuperación a <b style={{ color: AC.ink2 }}>{email}</b>. Revisa tu bandeja de entrada y la carpeta de spam.
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
          Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </div>
      </div>
      <Field label="CORREO ELECTRÓNICO" type="email" value={email} onChange={setEmail} placeholder="tu@ambelcor.es" icon="mail" autoFocus
        onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && setSent(true)} />
      <Btn variant="brand" full size="lg" icon="mail" disabled={!email.includes('@')} onClick={() => setSent(true)}>Enviar correo de recuperación</Btn>
    </div>
  )
}

// ── UsuarioForm (decorativo: no persiste en BD) ──────────────────────
// Usado en Ajustes dentro de un Modal.
// modo 'nuevo'  → alta (contraseña obligatoria + pantalla de éxito)
// modo 'editar' → edición (contraseña opcional, sin pantalla de éxito)
export function UsuarioForm({ modo = 'nuevo', inicial, onClose, onSubmit, compact }) {
  const esEditar = modo === 'editar'
  const rolInicial = inicial?.rol || 'Costurera'
  const [name, setName] = useState(inicial?.nombre || '')
  const [email, setEmail] = useState(inicial?.email || '')
  const [role, setRole] = useState(rolInicial)
  const [pass, setPass] = useState('')
  const [perms, setPerms] = useState(() => new Set(ROLE_DEFAULTS_DECO[rolInicial] || []))
  const [done, setDone] = useState(false)

  const applyRole = (r) => { setRole(r); setPerms(new Set(ROLE_DEFAULTS_DECO[r])) }
  const toggle = (id) => setPerms((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  // Al editar la contraseña es opcional (en blanco = mantener la actual).
  const valid = name.trim() && email.includes('@') && (esEditar || pass.length >= 4)

  const handleSubmit = () => {
    if (esEditar) { onSubmit?.(); return }
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '12px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: AC.brandSoft, color: AC.brandDeep,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={32} sw={2.2} /></div>
        <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 24, color: AC.ink }}>Usuario creado</div>
        <div style={{ fontFamily: AC.sans, fontSize: 15, color: AC.muted, fontWeight: 500, lineHeight: 1.55, maxWidth: 340 }}>
          <b style={{ color: AC.ink2 }}>{name}</b> ya puede acceder como <b style={{ color: AC.ink2 }}>{role}</b>, con {perms.size} de {PAGINAS_DECO.length} secciones visibles.
        </div>
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
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
            ? 'Modifica los datos y los permisos de visibilidad de esta persona.'
            : 'Da de alta a una persona del taller y define qué secciones del CRM podrá ver según su rol.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Field label="NOMBRE" value={name} onChange={(v) => setName(sanitizers.texto(v))} placeholder="Nombre y apellidos" icon="user" />
        <Field label="CORREO ELECTRÓNICO" type="email" value={email} onChange={(v) => setEmail(sanitizers.email(v))} placeholder="nombre@ambelcor.es" icon="mail" />
      </div>

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: AC.muted, letterSpacing: '.02em', marginBottom: 7 }}>ROL</div>
        <div style={{ display: 'flex', gap: 8, background: AC.bg, padding: 4, borderRadius: 12, border: `1px solid ${AC.line}` }}>
          {ROLES.map((r) => {
            const sel = r === role
            return (
              <button key={r} onClick={() => applyRole(r)} style={{ flex: 1, height: 40, borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: AC.sans, fontWeight: 700, fontSize: 13.5, color: sel ? AC.ink : AC.muted,
                background: sel ? '#fff' : 'transparent', boxShadow: sel ? '0 1px 4px rgba(0,0,0,.1)' : 'none', transition: 'all .15s' }}>{r}</button>
            )
          })}
        </div>
      </div>

      <Field label={esEditar ? 'CONTRASEÑA' : 'CONTRASEÑA INICIAL'} type="text" value={pass} onChange={setPass}
        placeholder={esEditar ? 'Déjala en blanco para mantener la actual' : 'Mínimo 4 caracteres'} icon="lock" />

      <div style={{ border: `1px solid ${AC.line}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '14px 16px', background: AC.bg, borderBottom: `1px solid ${AC.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Icon name="shield" size={18} stroke={AC.brandDeep} />
            <span style={{ fontFamily: AC.sans, fontWeight: 800, fontSize: 13.5, color: AC.ink2, letterSpacing: '.01em' }}>Autorizaciones de visibilidad</span>
          </div>
          <span style={{ fontFamily: AC.sans, fontWeight: 700, fontSize: 12.5, color: AC.brandDeep, background: AC.brandSoft, padding: '4px 9px', borderRadius: 20, fontVariantNumeric: 'tabular-nums' }}>
            {perms.size}/{PAGINAS_DECO.length} secciones
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 0 }}>
          {PAGINAS_DECO.map((p, i) => {
            const on = perms.has(p.id)
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px',
                borderBottom: `1px solid ${AC.line2}`, borderRight: !compact && i % 2 === 0 ? `1px solid ${AC.line2}` : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: on ? AC.brandSoft : AC.bg, color: on ? AC.brandDeep : AC.faint, transition: 'all .15s' }}>
                  <Icon name={p.icon} size={17} />
                </div>
                <span style={{ flex: 1, fontFamily: AC.sans, fontWeight: 600, fontSize: 14, color: on ? AC.ink : AC.muted }}>{p.name}</span>
                <Switch on={on} onChange={() => toggle(p.id)} />
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>{esEditar ? 'Cerrar' : 'Cancelar'}</Btn>
        <Btn variant="brand" full icon={esEditar ? 'check' : 'plus'} disabled={!valid} onClick={handleSubmit}>
          {esEditar ? 'Actualizar datos' : 'Crear usuario'}
        </Btn>
      </div>
    </div>
  )
}

// ── SuccessView ──────────────────────────────────────────────────────
export function SuccessView({ user }) {
  const [stage, setStage] = useState(0)
  useEffect(() => { const t = setTimeout(() => setStage(1), 1500); return () => clearTimeout(t) }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 18, padding: '14px 0' }}>
      <div style={{ position: 'relative' }}>
        <Avatar user={user} size={76} ring />
        <div style={{ position: 'absolute', right: -4, bottom: -4, width: 30, height: 30, borderRadius: '50%', background: AC.brand,
          border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Icon name="check" size={15} sw={2.6} />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 26, color: AC.ink }}>¡Hola, {user.nombre}!</div>
        <div style={{ fontFamily: AC.sans, fontSize: 15, color: AC.muted, fontWeight: 500, marginTop: 6 }}>
          {stage === 0 ? 'Acceso correcto. Entrando al CRM…' : 'Redirigiendo al panel del taller…'}
        </div>
      </div>
      <div style={{ width: 200, height: 6, borderRadius: 3, background: AC.line, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: AC.brand, width: stage === 0 ? '38%' : '100%', transition: 'width 1.3s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  )
}
