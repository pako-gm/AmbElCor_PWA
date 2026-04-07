import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import logoAmbelcor from '@/public/img/negro-logo-ambelcor.jpg'
import { ClipboardList, Users, Truck, Package, CalendarDays, BarChart2, LogOut, CircleDollarSign, Receipt, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import BottomNav from './BottomNav'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/encargos', icon: ClipboardList, label: 'Encargos' },
  { to: '/cronograma', icon: CalendarDays, label: 'Cronograma' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/proveedores', icon: Truck, label: 'Proveedores' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  {
    to: '/contabilidad', icon: BarChart2, label: 'Contabilidad', end: false,
    children: [
      { to: '/contabilidad/cobros', icon: CircleDollarSign, label: 'Cobros' },
      { to: '/contabilidad/pagos', icon: Receipt, label: 'Pagos' },
    ],
  },
]

export default function PageWrapper({ children }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [openMenus, setOpenMenus] = useState(() => {
    const initial = {}
    navItems.forEach(({ to, children: sub }) => {
      if (sub) initial[to] = true
    })
    return initial
  })

  useEffect(() => {
    navItems.forEach(({ to, children: sub }) => {
      if (sub && location.pathname.startsWith(to)) {
        setOpenMenus(prev => ({ ...prev, [to]: true }))
      }
    })
  }, [location.pathname])

  const toggleMenu = (to) => setOpenMenus(prev => ({ ...prev, [to]: !prev[to] }))

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[--bg-gray]">
      {/* Sidebar — solo desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-52 bg-white border-r border-[--border] flex-col z-40">
        <div className="px-5 py-4 border-b border-[--border] flex items-center justify-between gap-2">
          <span className="font-display text-base font-semibold text-primary leading-tight">Amb el Cor<br /><span className="text-xs font-normal text-[--text-light] tracking-wide">CRM</span></span>
          <img src={logoAmbelcor} alt="AmbElCor" className="h-10 w-auto object-contain" />
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(({ to, icon: Icon, label, end, children: sub }) => (
            <div key={to}>
              {sub ? (
                <div className={`flex items-center text-sm transition-colors ${
                  location.pathname.startsWith(to)
                    ? 'bg-primary-light text-primary-darker font-medium'
                    : 'text-[--text-medium] hover:bg-[--bg-gray]'
                }`}>
                  <NavLink
                    to={to}
                    end={false}
                    className="flex items-center gap-3 flex-1 px-5 py-2.5"
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                  <button
                    onClick={() => toggleMenu(to)}
                    className="px-3 py-2.5 hover:text-primary"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${openMenus[to] ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              ) : (
                <NavLink
                  to={to}
                  end={end ?? true}
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
              )}
              {sub && openMenus[to] && sub.map(({ to: subTo, icon: SubIcon, label: subLabel }) => (
                <NavLink
                  key={subTo}
                  to={subTo}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 pl-10 pr-5 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-light text-primary-darker font-medium'
                        : 'text-[--text-light] hover:bg-[--bg-gray]'
                    }`
                  }
                >
                  <SubIcon size={14} />
                  {subLabel}
                </NavLink>
              ))}
            </div>
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
