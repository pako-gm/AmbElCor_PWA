import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { primeraRutaPermitida } from '@/lib/usuarios'

export default function ProtectedRoute({ children, permiso }) {
  const { user, mfaVerified, perfil, permisos, loading, signOut } = useAuth()

  // Perfil inactivo o inexistente pese a tener sesión: cierra la sesión real.
  useEffect(() => {
    if (!loading && user && mfaVerified && (!perfil || perfil.activo === false)) {
      signOut()
    }
  }, [loading, user, mfaVerified, perfil, signOut])

  console.log('[ProtectedRoute] estado', { loading, user: user?.email, mfaVerified, perfil, permisos, permiso })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[--text-light]">
        Cargando…
      </div>
    )
  }

  if (!user) return <Navigate to="/acceso" replace />
  if (!mfaVerified) return <Navigate to="/verify-2fa" replace />
  if (!perfil || perfil.activo === false) return <Navigate to="/acceso" replace />

  // Visibilidad por rol: si la sección no está permitida, redirige a la primera permitida.
  if (permiso && !permisos.includes(permiso)) {
    return <Navigate to={primeraRutaPermitida(permisos)} replace />
  }

  return children
}
