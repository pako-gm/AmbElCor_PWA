import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import logoAmbelcor from '@/public/img/ambelcor-oscuro.png'
import {
  Home, Users, Package,
  BarChart2, LogOut, Menu, X, Tag, Globe, CalendarDays, Building2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect, useRef } from 'react'

const navItems = [
  {
    to: '/encargos', icon: Home, label: 'Encargos',
    children: [
      { to: '/clientes', label: 'Clientes', icon: Users },
      { to: '/catalogo', label: 'Catálogo', icon: Tag },
    ],
  },
  { to: '/citas', icon: CalendarDays, label: 'Citas' },
  {
    to: '/inventario', icon: Package, label: 'Inventario',
    children: [
      { to: '/inventario/proveedores', label: 'Proveedores', icon: Building2 },
    ],
  },
  { to: '/contabilidad', icon: BarChart2, label: 'Contabilidad', end: true },
]

function CopyrightYear() {
  const year = new Date().getFullYear()
  return year > 2026 ? `2026-${year}` : '2026'
}

export default function PageWrapper({ children, title }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const hideTimer = useRef(null)

  const cancelarCierre = () => clearTimeout(hideTimer.current)

  // El drawer se oculta 3 s después de retirar el cursor
  const programarCierre = () => {
    cancelarCierre()
    hideTimer.current = setTimeout(() => setDrawerOpen(false), 3000)
  }

  const cerrarDrawer = () => {
    cancelarCierre()
    setDrawerOpen(false)
  }

  useEffect(() => cancelarCierre, [])

  useEffect(() => {
    cerrarDrawer()
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[--bg-gray] flex flex-col">
      {/* Header fijo */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[--bg-gray] border-b border-[--border] flex items-center px-4 z-30">
        <button
          onClick={() => { cancelarCierre(); setDrawerOpen(true) }}
          onMouseEnter={() => { cancelarCierre(); setDrawerOpen(true) }}
          onMouseLeave={programarCierre}
          className="p-1 text-[--text-medium] hover:text-primary transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <img src={logoAmbelcor} alt="AmbElCor" className="h-8 w-auto object-contain [mix-blend-mode:multiply]" />
          <span className="font-display text-base font-semibold text-primary leading-tight">
            Amb el Cor <span className="text-xs font-bold text-[--text-medium] tracking-wide">CRM</span>
          </span>
        </div>
      </header>

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={cerrarDrawer}
        />
      )}

      {/* Drawer */}
      <aside
        onMouseEnter={cancelarCierre}
        onMouseLeave={programarCierre}
        className={`fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-xl transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del drawer */}
        <div className="h-14 px-4 border-b border-[--border] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src={logoAmbelcor} alt="AmbElCor" className="h-8 w-auto object-contain [mix-blend-mode:multiply]" />
            <span className="font-display text-base font-semibold text-primary leading-tight">
              Amb el Cor <span className="text-xs font-bold text-[--text-medium] tracking-wide">CRM</span>
            </span>
          </div>
          <button
            onClick={cerrarDrawer}
            className="p-1 text-[--text-light] hover:text-[--text-medium] transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end, children }) => (
            <div key={to}>
              <NavLink
                to={to}
                end={end ?? true}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-light text-primary-darker font-medium'
                      : 'text-[--text-medium] hover:bg-[--bg-gray]'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
              {children?.map(sub => {
                const SubIcon = sub.icon
                return (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-2 pl-10 pr-5 py-2 text-xs transition-colors ${
                        isActive
                          ? 'text-primary font-medium bg-primary-light/60'
                          : 'text-[--text-light] hover:text-[--text-medium] hover:bg-[--bg-gray]'
                      }`
                    }
                  >
                    {SubIcon ? <SubIcon size={13} /> : <span className="w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          ))}
          <a
            href="/ambelcor-emergent.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-3 text-sm text-[--text-medium] hover:bg-[--bg-gray] transition-colors"
          >
            <Globe size={16} />
            Web Pública
          </a>
        </nav>

        {/* Cerrar sesión */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-5 py-4 text-sm text-[--text-light] hover:text-[--text-medium] border-t border-[--border] transition-colors flex-shrink-0"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 pt-14">
        {title && (
          <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 pb-0 flex items-center justify-between">
            <h1 className="font-display text-2xl text-[--text-dark]">{title}</h1>
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-xs text-[--text-light] border-t border-[--border]">
        © <CopyrightYear /> · Amb el Cor · Todos los derechos reservados
      </footer>
    </div>
  )
}
