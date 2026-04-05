import { NavLink, useNavigate } from 'react-router-dom'
import { ClipboardList, Users, Package, BarChart2, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import BottomNav from './BottomNav'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/encargos', icon: ClipboardList, label: 'Encargos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/contabilidad/cobros', icon: BarChart2, label: 'Contabilidad' },
]

export default function PageWrapper({ children }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[--bg-gray]">
      {/* Sidebar — solo desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-52 bg-white border-r border-[--border] flex-col z-40">
        <div className="px-5 py-5 border-b border-[--border]">
          <span className="font-display text-lg font-semibold text-primary">AmbElCor</span>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary-darker font-medium'
                    : 'text-[--text-medium] hover:bg-[--bg-gray]'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-5 py-4 text-sm text-[--text-light] hover:text-[--text-medium] border-t border-[--border] transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </aside>

      {/* Contenido principal */}
      <main className="md:ml-52 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Bottom nav móvil */}
      <BottomNav />
    </div>
  )
}
