import { NavLink } from 'react-router-dom'
import { Home, Boxes, BarChart2 } from 'lucide-react'

const tabs = [
  { to: '/encargos', icon: Home, label: 'Encargos' },
  { to: '/inventario', icon: Boxes, label: 'Inventario' },
  { to: '/contabilidad', icon: BarChart2, label: 'Cuentas', end: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[--border] z-50 md:hidden">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end ?? true}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-[--text-light]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
