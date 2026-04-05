import { NavLink } from 'react-router-dom'
import { ClipboardList, Users, Package, BarChart2, LayoutDashboard } from 'lucide-react'

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/encargos', icon: ClipboardList, label: 'Encargos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/contabilidad/cobros', icon: BarChart2, label: 'Cuentas' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[--border] z-50 md:hidden">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-[--text-light]'
              }`
            }
          >
            <Icon size={20} strokeWidth={isActive => isActive ? 2.5 : 1.5} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
