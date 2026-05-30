import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, mfaVerified, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[--text-light]">
        Cargando…
      </div>
    )
  }

  // TODO: re-enable auth checks when Google OAuth is configured
  // if (!user) return <Navigate to="/login" replace />
  // if (!mfaVerified) return <Navigate to="/verify-2fa" replace />

  return children
}
