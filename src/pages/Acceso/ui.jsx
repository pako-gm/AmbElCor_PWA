// ui.jsx — tokens de diseño y átomos de la pantalla de acceso.
// Portado de DESIGN/login AmbElCor/screens/base.jsx (estilos inline por fidelidad).
import { useEffect, useRef, useState } from 'react'
import logoAmbelcor from '@/public/img/ambelcor-oscuro.png'

// ── Tokens ────────────────────────────────────────────────────────────
export const AC = {
  brand: '#1FB39A', brandDeep: '#118B78', brandPastel: '#BFE7DC', brandSoft: '#E3F6F1',
  dark: '#0C1A2C', ink: '#1B2433', ink2: '#384152', muted: '#7B8496', faint: '#AAB0BD',
  line: '#E8E8EF', line2: '#F0F0F4', bg: '#F3F3F7', surface: '#FFFFFF',
  accents: {
    salvia:  { soft: '#E6F4EC', pastel: '#BFE0CB', ink: '#0F7A4A' },
    coral:   { soft: '#FBEEE4', pastel: '#F3D2BD', ink: '#B25A34' },
    arena:   { soft: '#F7EFE0', pastel: '#ECDCB6', ink: '#8C6322' },
    cielo:   { soft: '#E8F0FB', pastel: '#C9DCF4', ink: '#2F5AA0' },
    rosa:    { soft: '#FAE9EC', pastel: '#F3C9D2', ink: '#B53E56' },
    pizarra: { soft: '#EEF0F4', pastel: '#D3D9E2', ink: '#4A5568' },
  },
  logoInk: '#0C312A',
  serif: "'Lora', Georgia, serif",
  sans: "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

// ── Iconos ────────────────────────────────────────────────────────────
const PATHS = {
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v2.5H9z"/><path d="M9 11h6M9 15h4"/>',
  users: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6M17 19.5a5.5 5.5 0 0 0-3-4.9"/>',
  book: '<path d="M5 4.5h9a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H5z"/><path d="M19 4.5v13.5"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 9.5h16M8 3.5v4M16 3.5v4"/>',
  box: '<path d="M12 3.5 4.5 7.5v9L12 20.5l7.5-4V7.5z"/><path d="M4.5 7.5 12 11.5l7.5-4M12 11.5v9"/>',
  truck: '<path d="M3 6.5h10v9H3z"/><path d="M13 9.5h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-3M12 16V9M16 16v-5"/>',
  arrowDown: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8.5 12.5 12 16l3.5-3.5"/>',
  arrowUp: '<circle cx="12" cy="12" r="8.5"/><path d="M12 16V8M8.5 11.5 12 8l3.5 3.5"/>',
  bookOpen: '<path d="M12 6.5C10 5 7 5 4.5 6v12C7 17 10 17 12 18.5M12 6.5C14 5 17 5 19.5 6v12C17 17 14 17 12 18.5M12 6.5v12"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M7.5 16.5l-2 2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M4 4l16 16M9.5 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.6M6.4 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 3.3-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
  shield: '<path d="M12 3.5 5 6v6c0 4 3 6.5 7 8.5 4-2 7-4.5 7-8.5V6z"/>',
}

export function Icon({ name, size = 20, stroke = 'currentColor', sw = 1.7, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}
      dangerouslySetInnerHTML={{ __html: PATHS[name] || '' }} />
  )
}

// ── Átomos ────────────────────────────────────────────────────────────
export function Logo({ size = 34, light = false, showWord = true, mark = true, centered = false }) {
  const wordColor = light ? '#fff' : AC.logoInk
  const markSize = size * 1.34
  const markEl = (
    <div style={{
      width: markSize, height: markSize, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: light ? markSize * 0.22 : 0,
      background: light ? 'rgba(255,255,255,.92)' : 'transparent',
      padding: light ? markSize * 0.1 : 0, boxSizing: 'border-box',
    }}>
      <img src={logoAmbelcor} alt="AmbElCor"
        style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: light ? 'normal' : 'multiply' }} />
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: centered ? 'column' : 'row', alignItems: 'center', gap: centered ? 10 : 11 }}>
      {mark && markEl}
      {showWord && (
        <div style={{ fontFamily: AC.sans, fontWeight: 800, fontSize: size * 0.52, color: wordColor, letterSpacing: '-0.01em' }}>
          Amb<span style={{ color: light ? '#fff' : AC.brand }}>El</span>Cor
        </div>
      )}
    </div>
  )
}

export function Avatar({ user, size = 48, ring = false }) {
  const a = AC.accents[user.accent] || AC.accents.salvia
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: a.pastel, color: a.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: AC.serif, fontWeight: 600, fontSize: size * 0.42,
      boxShadow: ring ? `0 0 0 4px ${a.soft}` : 'none',
    }}>{user.nombre[0]}</div>
  )
}

export function Field({ label, type = 'text', value, onChange, onKeyDown, placeholder, trailing, autoFocus, icon, invalid }) {
  const [focus, setFocus] = useState(false)
  const ref = useRef(null)
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus() }, [autoFocus])
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: invalid ? AC.accents.rosa.ink : AC.muted, letterSpacing: '.02em', marginBottom: 7 }}>{label}</span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        background: '#fff', border: `1.5px solid ${invalid ? AC.accents.rosa.pastel : focus ? AC.brand : AC.line}`,
        borderRadius: 12, padding: '0 12px', height: 48,
        boxShadow: focus ? `0 0 0 4px ${AC.brandSoft}` : 'none', transition: 'border-color .15s, box-shadow .15s',
      }}>
        {icon && <Icon name={icon} size={18} stroke={AC.faint} />}
        <input
          ref={ref} type={type} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: AC.sans, fontSize: 15.5, fontWeight: 500, color: AC.ink, height: '100%' }} />
        {trailing}
      </div>
    </label>
  )
}

export function Btn({ children, onClick, variant = 'brand', full, type = 'button', icon, disabled, size = 'md' }) {
  const pad = size === 'lg' ? '0 22px' : '0 18px'
  const h = size === 'lg' ? 52 : 46
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: h, padding: pad, borderRadius: 12, border: 'none', cursor: disabled ? 'default' : 'pointer',
    fontFamily: AC.sans, fontWeight: 700, fontSize: 15, letterSpacing: '.01em',
    width: full ? '100%' : 'auto', transition: 'transform .12s, box-shadow .15s, background .15s, color .15s',
    opacity: disabled ? 0.55 : 1, whiteSpace: 'nowrap',
  }
  const styles = {
    brand: { background: AC.brand, color: '#fff', boxShadow: '0 6px 16px rgba(31,179,154,.28)' },
    ghost: { background: 'transparent', color: AC.ink2, border: `1.5px solid ${AC.line}` },
    soft:  { background: AC.brandSoft, color: AC.brandDeep },
    dark:  { background: AC.ink, color: '#fff' },
  }
  const [hov, setHov] = useState(false)
  const hv = hov && !disabled ? (variant === 'brand' ? { background: AC.brandDeep, transform: 'translateY(-1px)' } : variant === 'ghost' ? { borderColor: AC.faint, background: AC.line2 } : { transform: 'translateY(-1px)' }) : {}
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...styles[variant], ...hv }}>
      {icon && <Icon name={icon} size={18} sw={2} />}{children}
    </button>
  )
}

export function Switch({ on, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      style={{ width: 42, height: 25, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? AC.brand : AC.line, position: 'relative', transition: 'background .18s', padding: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 20 : 3, width: 19, height: 19, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .18s' }} />
    </button>
  )
}

export function TextLink({ children, onClick, color }) {
  const [h, setH] = useState(false)
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: AC.sans,
        fontWeight: 700, fontSize: 14, color: color || AC.brandDeep, textDecoration: h ? 'underline' : 'none' }}>
      {children}
    </button>
  )
}

export function Blob({ color, size, style }) {
  return <div style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: color,
    filter: 'blur(2px)', pointerEvents: 'none', ...style }} />
}
