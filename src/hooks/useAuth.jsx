import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

// Clave de sesión del perfil local (credenciales hardcodeadas, modo pruebas).
const PERFIL_KEY = 'ambelcor_perfil'

const leerPerfil = () => {
  try {
    const raw = localStorage.getItem(PERFIL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [mfaVerified, setMfaVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  // Perfil activo elegido en la pantalla de acceso (puerta de entrada actual).
  const [perfil, setPerfil] = useState(leerPerfil)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      // aal2 = MFA verificado en esta sesión
      setMfaVerified(session?.aal === 'aal2')
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setMfaVerified(session?.aal === 'aal2')
    })

    return () => subscription.unsubscribe()
  }, [])

  const loginPerfil = (p) => {
    localStorage.setItem(PERFIL_KEY, JSON.stringify(p))
    setPerfil(p)
  }

  const logoutPerfil = () => {
    localStorage.removeItem(PERFIL_KEY)
    setPerfil(null)
  }

  const signOut = async () => {
    setMfaVerified(false)
    logoutPerfil()
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, mfaVerified, setMfaVerified, loading, signOut, perfil, loginPerfil, logoutPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
