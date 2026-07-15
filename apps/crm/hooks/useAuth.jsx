import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { permisosDeRol } from '@/lib/usuarios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [perfilLoading, setPerfilLoading] = useState(false)

  const user = session?.user ?? null
  // aal2 = MFA verificado en esta sesión
  const mfaVerified = session?.aal === 'aal2'

  const cargarPerfil = useCallback(async (uid) => {
    if (!uid) {
      setPerfil(null)
      return
    }
    setPerfilLoading(true)
    const { data } = await supabase.from('perfiles').select('*').eq('id', uid).maybeSingle()
    setPerfil(data ?? null)
    setPerfilLoading(false)
  }, [])

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!activo) return
      setSession(session)
      await cargarPerfil(session?.user?.id)
      if (activo) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      cargarPerfil(session?.user?.id)
    })

    return () => {
      activo = false
      subscription.unsubscribe()
    }
  }, [cargarPerfil])

  const signOut = async () => {
    setPerfil(null)
    await supabase.auth.signOut()
  }

  const permisos = permisosDeRol(perfil?.rol)

  return (
    <AuthContext.Provider value={{
      user, mfaVerified, perfil, permisos, signOut,
      loading: loading || perfilLoading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
