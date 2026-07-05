import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Euro, Wallet, Package, Truck, Calendar, ChevronRight } from 'lucide-react'
import { useAvisos } from '@/hooks/useAvisos'
import { formatImporte } from '@/utils/formatters'

const ICONOS = { euro: Euro, wallet: Wallet, package: Package, truck: Truck, calendar: Calendar }

const TONOS = {
  amber:  'bg-amber-100 text-amber-700',
  red:    'bg-red-100 text-red-600',
  violet: 'bg-violet-100 text-violet-700',
  green:  'bg-green-100 text-green-700',
}

const VISTOS_KEY = 'avisos_vistos'

export default function NotificacionesBell() {
  const navigate = useNavigate()
  const { loading, grupos, total, firma, recargar } = useAvisos()
  const [abierto, setAbierto] = useState(false)
  const [vistos, setVistos] = useState(() => {
    try { return localStorage.getItem(VISTOS_KEY) || '' } catch { return '' }
  })
  const ref = useRef(null)

  useEffect(() => { recargar() }, [recargar])

  // Cierre por click-fuera y Escape
  useEffect(() => {
    if (!abierto) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    const onKey = (e) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [abierto])

  // Hay punto rojo si hay avisos y su firma no coincide con la última vista
  const sinVer = total > 0 && firma !== '' && firma !== vistos

  const toggle = () => {
    const nuevo = !abierto
    setAbierto(nuevo)
    if (nuevo) {
      recargar()
      if (firma) {
        try { localStorage.setItem(VISTOS_KEY, firma) } catch { /* ignore */ }
        setVistos(firma)
      }
    }
  }

  const irA = (ruta) => { setAbierto(false); navigate(ruta) }

  return (
    <div className="relative ml-auto" ref={ref}>
      <button
        onClick={toggle}
        aria-label={`Avisos${total > 0 ? ` (${total})` : ''}`}
        className="relative p-1.5 text-[--text-medium] hover:text-primary transition-colors"
      >
        <Bell size={22} className={sinVer ? 'origin-top animate-bell-swing text-primary' : ''} />
        {sinVer && (
          <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[--bg-gray]" />
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white border border-[--border] rounded-xl shadow-xl z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[--border]">
            <span className="font-display text-sm font-semibold text-[--text-dark]">Avisos</span>
            {total > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-semibold">{total}</span>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <p className="text-xs text-[--text-light] text-center py-8">Cargando…</p>
            ) : grupos.length === 0 ? (
              <p className="text-sm text-[--text-medium] text-center py-8">Todo al día ✓</p>
            ) : (
              grupos.map(g => {
                const Icono = ICONOS[g.icono] ?? Bell
                return (
                  <div key={g.clave} className="border-b border-[--border] last:border-0">
                    <button
                      onClick={() => irA(g.ruta)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${TONOS[g.tono]}`}>
                        <Icono size={13} />
                      </span>
                      <span className="text-xs font-semibold text-[--text-dark] flex-1">{g.titulo}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-[--text-medium] font-semibold">{g.items.length}</span>
                      <ChevronRight size={14} className="text-[--text-light]" />
                    </button>
                    <ul className="pb-1.5">
                      {g.items.slice(0, 4).map((it, i) => (
                        <li
                          key={i}
                          onClick={() => it.id != null && irA(g.ruta)}
                          className={`flex items-center justify-between gap-2 px-4 py-1 text-xs ${it.id != null ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        >
                          <span className="truncate text-[--text-medium]">{it.texto}</span>
                          <span className="shrink-0 flex items-center gap-1.5">
                            {it.dato != null && (
                              <span className={`font-semibold ${it.vencido ? 'text-red-600' : 'text-[--text-dark]'}`}>
                                {formatImporte(it.dato)}
                              </span>
                            )}
                            {it.detalle && (
                              <span className={`text-[10px] ${it.atrasada ? 'text-red-600 font-semibold' : 'text-[--text-light]'}`}>
                                {it.detalle}
                              </span>
                            )}
                            {it.vencido && it.dato != null && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-600 font-semibold">Vencido</span>
                            )}
                          </span>
                        </li>
                      ))}
                      {g.items.length > 4 && (
                        <li className="px-4 py-1 text-[10px] text-[--text-light]">+{g.items.length - 4} más…</li>
                      )}
                    </ul>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
