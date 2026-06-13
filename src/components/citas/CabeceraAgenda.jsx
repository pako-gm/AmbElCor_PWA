import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { claveFechaLocal, DIAS_ES, MESES_ES } from './citasUtils'

// Bloque teal de la agenda: título, "+ Nueva Cita", navegación de mes y tira semanal
export default function CabeceraAgenda({
  semana,
  fechaSel,
  diasConCitas,
  onSelDia,
  onSemana,
  onHoy,
  onNuevaCita,
}) {
  const navigate = useNavigate()

  return (
    <header className="bg-primary text-white px-4 pt-4 pb-3 md:rounded-b-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/encargos')}
            aria-label="Volver"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-semibold">Citas</h1>
        </div>
        <button
          onClick={onNuevaCita}
          className="flex items-center gap-1 bg-white/25 hover:bg-white/35 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          <Plus size={15} />
          Nueva Cita
        </button>
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <button
          onClick={() => onSemana(-1)}
          aria-label="Semana anterior"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-light tracking-widest uppercase opacity-90">
            {MESES_ES[semana[0].getMonth()]} {semana[0].getFullYear()}
          </span>
          <button
            onClick={onHoy}
            className="text-[10px] font-bold uppercase tracking-wider bg-white/25 hover:bg-white/35 border border-white/60 rounded-md px-2 py-0.5 transition-colors"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={() => onSemana(1)}
          aria-label="Semana siguiente"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {semana.map(d => {
          const clave = claveFechaLocal(d)
          const esSel = clave === fechaSel
          const tieneCitas = diasConCitas.has(clave)
          return (
            <button
              key={clave}
              onClick={() => onSelDia(clave)}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors ${
                esSel ? 'bg-white text-primary' : 'hover:bg-white/15'
              }`}
            >
              <span className={`text-[9px] uppercase tracking-wide ${esSel ? '' : 'opacity-75'}`}>
                {DIAS_ES[d.getDay()]}
              </span>
              <span className={`text-[15px] leading-tight ${esSel ? 'font-bold' : 'font-normal'}`}>
                {d.getDate()}
              </span>
              <span
                className={`w-1 h-1 rounded-full ${
                  tieneCitas ? (esSel ? 'bg-primary' : 'bg-white') : 'bg-transparent'
                }`}
              />
            </button>
          )
        })}
      </div>
    </header>
  )
}
