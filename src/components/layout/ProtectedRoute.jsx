import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { primeraRutaPermitida } from '@/lib/usuarios'

export default function ProtectedRoute({ children, permiso }) {
  const { perfil, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[--text-light]">
        Cargando…
      </div>
    )
  }

  // Puerta de entrada actual: perfil local (credenciales hardcodeadas).
  // TODO: cuando Google OAuth esté configurado, exigir antes user + mfaVerified:
  //   if (!user) return <Navigate to="/login" replace />
  //   if (!mfaVerified) return <Navigate to="/verify-2fa" replace />
  if (!perfil) return <Navigate to="/acceso" replace />

  // Visibilidad por rol: si la sección no está permitida, redirige a la primera permitida.
  if (permiso && !perfil.permisos?.includes(permiso)) {
    return <Navigate to={primeraRutaPermitida(perfil.permisos)} replace />
  }

  return children
}
