import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [mfaVerified, setMfaVerified] = useState(false)
  const [loading, setLoading] = useState(true)

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

  const signOut = async () => {
    setMfaVerified(false)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, mfaVerified, setMfaVerified, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
