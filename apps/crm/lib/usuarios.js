// Roles y permisos del CRM. Los usuarios reales viven en Supabase Auth +
// la tabla `perfiles` (ver hooks/useAuth.jsx y pages/Acceso/Acceso.jsx).

// Secciones reales del menú lateral (la navegación es plana; el resto son tabs).
export const SECCIONES = [
  { id: 'encargos',     nombre: 'Encargos' },
  { id: 'inventario',   nombre: 'Inventario' },
  { id: 'ventas',       nombre: 'Ventas' },
  { id: 'contabilidad', nombre: 'Contabilidad' },
  { id: 'ajustes',      nombre: 'Ajustes' },
]

export const TODAS_SECCIONES = SECCIONES.map(s => s.id)

export const ROLES = ['propietaria', 'costurera', 'administrador']

// Visibilidad por rol a nivel de las 4 secciones del menú.
// Costurera: solo Encargos (incl. Clientes/Catálogo/Citas) e Inventario (incl. Proveedores).
export const ROLE_DEFAULTS = {
  propietaria:   TODAS_SECCIONES,
  administrador: TODAS_SECCIONES,
  costurera:     ['encargos', 'inventario'],
}

export const permisosDeRol = (rol) => ROLE_DEFAULTS[rol] ?? ['encargos']

// Accents disponibles para el avatar del perfil (ver AC.accents en pages/Acceso/ui.jsx).
export const accentsDisponibles = ['salvia', 'coral', 'arena', 'cielo', 'rosa', 'pizarra']

// Primera ruta a la que enviar a un perfil tras entrar / al bloquear una sección.
const RUTA_POR_SECCION = {
  encargos: '/encargos',
  inventario: '/inventario',
  ventas: '/ventas',
  contabilidad: '/contabilidad',
  ajustes: '/ajustes',
}

export const primeraRutaPermitida = (permisos = []) =>
  RUTA_POR_SECCION[permisos[0]] ?? '/encargos'
