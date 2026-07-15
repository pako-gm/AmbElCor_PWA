import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { permisosDeRol } from '@/lib/usuarios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [aal, setAal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [perfilLoading, setPerfilLoading] = useState(false)

  const user = session?.user ?? null
  // aal2 = MFA verificado en esta sesión (el objeto session del SDK no expone
  // este dato directamente: hay que consultarlo con mfa.getAuthenticatorAssuranceLevel()).
  const mfaVerified = aal === 'aal2'

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

  const cargarAal = useCallback(async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    setAal(data?.currentLevel ?? null)
  }, [])

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!activo) return
      setSession(session)
      await Promise.all([cargarPerfil(session?.user?.id), cargarAal()])
      if (activo) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      cargarPerfil(session?.user?.id)
      cargarAal()
    })

    return () => {
      activo = false
      subscription.unsubscribe()
    }
  }, [cargarPerfil, cargarAal])

  const signOut = async () => {
    setPerfil(null)
    await supabase.auth.signOut()
  }

  const permisos = permisosDeRol(perfil?.rol)

  return (
    <AuthContext.Provider value={{
      user, mfaVerified, perfil, permisos, signOut,
      recargarAal: cargarAal,
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
