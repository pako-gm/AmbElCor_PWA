import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// Dos iniciales a partir del nombre: "Carmen Moya" → "CM".
// Si solo hay una palabra, sus dos primeras letras. Fallback "?".
function iniciales(nombre) {
  if (!nombre) return '?'
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}

export default function UserMenu() {
  const navigate = useNavigate()
  const { perfil, signOut } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  // Cierre por click-fuera y Escape
  useEffect(() => {
    if (!abierto) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    const onKey = (e) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [abierto])

  if (!perfil) return null

  const handleSignOut = async () => {
    setAbierto(false)
    await signOut()
    navigate('/acceso')
  }

  return (
    <div className="relative ml-2" ref={ref}>
      <button
        onClick={() => setAbierto(a => !a)}
        aria-label="Menú de usuario"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
      >
        {iniciales(perfil.nombre)}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white border border-[--border] rounded-xl shadow-xl z-40 overflow-hidden">
          <div className="px-4 py-3 border-b border-[--border]">
            <div className="text-sm font-medium text-[--text-dark] leading-tight">{perfil.nombre}</div>
            {perfil.rol && <div className="text-xs text-[--text-light]">{perfil.rol}</div>}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[--text-medium] hover:bg-[--bg-gray] transition-colors text-left"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
