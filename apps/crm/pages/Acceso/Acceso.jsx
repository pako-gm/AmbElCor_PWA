// Acceso.jsx — pantalla de selección de perfil + contraseña.
// El selector se alimenta de la RPC listar_perfiles_login() (perfiles activos,
// FASE 4/7) y la contraseña se valida contra Supabase Auth (PasswordPanel).
// Portado de DESIGN/login AmbElCor/screens/skins.jsx (ShellA + AccessApp).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AC, Icon, Logo, Avatar, Blob, TextLink } from './ui'
import { PasswordPanel, ForgotView } from './panels'

function formatUltimoAcceso(fecha) {
  if (!fecha) return 'Sin accesos previos'
  return new Date(fecha).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const capitalizar = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

// Fila de perfil del selector
function ProfileRow({ user, onClick }) {
  const [h, setH] = useState(false)
  const a = AC.accents[user.accent] || AC.accents.salvia
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left', cursor: 'pointer',
        background: h ? AC.bg : 'transparent', border: 'none', borderRadius: 14, padding: '11px 12px',
        transition: 'background .14s, transform .14s', transform: h ? 'translateX(2px)' : 'none' }}>
      <Avatar user={user} size={46} ring={h} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: AC.sans, fontWeight: 700, fontSize: 16.5, color: AC.ink }}>{user.nombre}</div>
        <div style={{ fontFamily: AC.sans, fontWeight: 500, fontSize: 13, color: AC.muted, marginTop: 1 }}>{capitalizar(user.rol)} · {formatUltimoAcceso(user.ultimo_acceso)}</div>
      </div>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: h ? a.pastel : AC.bg, color: h ? a.ink : AC.faint,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .14s' }}>
        <Icon name="chevron" size={16} sw={2.2} />
      </div>
    </button>
  )
}

function SelectFooter({ onForgot }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
      <div style={{ height: 1, background: AC.line, width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <TextLink onClick={onForgot} color={AC.muted}>¿Olvidaste la contraseña?</TextLink>
      </div>
    </div>
  )
}

export default function Acceso() {
  const navigate = useNavigate()
  const [route, setRoute] = useState('select')
  const [perfiles, setPerfiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [narrow, setNarrow] = useState(typeof window !== 'undefined' && window.innerWidth < 540)

  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 540)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  useEffect(() => {
    let activo = true
    supabase.rpc('listar_perfiles_login').then(({ data }) => {
      if (activo) setPerfiles(data ?? [])
    })
    return () => { activo = false }
  }, [])

  const pick = (u) => { setSelected(u); setRoute('password') }
  const toSelect = () => setRoute('select')

  // Contraseña verificada por Supabase Auth (dentro de PasswordPanel): ahora hay
  // que pasar por 2FA. Si aún no tiene factor TOTP verificado, primero lo activa.
  const onPasswordOk = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    const totpVerificado = data?.totp?.some(f => f.status === 'verified')
    navigate(totpVerificado ? '/verify-2fa' : '/setup-2fa')
  }

  let body = null
  if (route === 'password') body = <PasswordPanel user={selected} onBack={toSelect} onSubmit={onPasswordOk} onForgot={() => setRoute('forgot')} />
  else if (route === 'forgot') body = <ForgotView user={selected} onBack={toSelect} onClose={toSelect} />

  const isSelect = route === 'select'
  const cardMax = 430

  return (
    <div style={{ minHeight: '100vh', width: '100%', boxSizing: 'border-box', background: AC.bg, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: narrow ? 18 : 28, position: 'relative' }}>
      <Blob color={AC.brandSoft} size={320} style={{ top: -120, right: -90, opacity: .8 }} />
      <Blob color={AC.accents.coral.soft} size={210} style={{ bottom: -90, left: -70, opacity: .7 }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: cardMax, background: '#fff', borderRadius: 26,
        boxShadow: '0 2px 6px rgba(12,26,44,.05), 0 24px 60px rgba(12,26,44,.10)', padding: narrow ? '26px 22px' : '34px 32px', overflow: 'hidden' }}>
        <Blob color={AC.accents.salvia.soft} size={150} style={{ top: -70, right: -50, opacity: .9 }} />
        <div style={{ position: 'relative' }}>
          {isSelect ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}><Logo size={38} mark centered /></div>
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <div style={{ fontFamily: AC.serif, fontWeight: 600, fontSize: 27, color: AC.ink, lineHeight: 1.08 }}>Hola de nuevo</div>
                <div style={{ fontFamily: AC.sans, fontWeight: 500, fontSize: 15, color: AC.muted, marginTop: 7 }}>Elige tu perfil para entrar en el taller.</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '20px 0 18px' }}>
                {perfiles.map((u) => <ProfileRow key={u.email} user={u} onClick={() => pick(u)} />)}
              </div>
              <SelectFooter onForgot={() => { setSelected(null); setRoute('forgot') }} />
            </>
          ) : (
            <>
              <Logo size={26} mark />
              <div style={{ marginTop: 22 }}>{body}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
