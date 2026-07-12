// Usuarios, roles y permisos del CRM — credenciales hardcodeadas (modo pruebas).
//
// De momento esta lista hace de "puerta de entrada" para probar accesos sin Google
// OAuth. Cuando OAuth esté operativo, la autenticación irá antes y esta pantalla
// quedará solo como selector de perfil. Portado de DESIGN/login AmbElCor/screens/base.jsx.

// Secciones reales del menú lateral (la navegación es plana; el resto son tabs).
export const SECCIONES = [
  { id: 'encargos',     nombre: 'Encargos' },
  { id: 'inventario',   nombre: 'Inventario' },
  { id: 'ventas',       nombre: 'Ventas' },
  { id: 'contabilidad', nombre: 'Contabilidad' },
  { id: 'ajustes',      nombre: 'Ajustes' },
]

export const TODAS_SECCIONES = SECCIONES.map(s => s.id)

export const ROLES = ['Propietaria', 'Costurera', 'Administrador']

// Visibilidad por rol a nivel de las 4 secciones del menú.
// Costurera: solo Encargos (incl. Clientes/Catálogo/Citas) e Inventario (incl. Proveedores).
export const ROLE_DEFAULTS = {
  'Propietaria':   TODAS_SECCIONES,
  'Administrador': TODAS_SECCIONES,
  'Costurera':     ['encargos', 'inventario'],
}

export const permisosDeRol = (rol) => ROLE_DEFAULTS[rol] ?? ['encargos']

// Usuarios con contraseña hardcodeada (pruebas).
export const USUARIOS = [
  { id: 'carmen', nombre: 'Carmen', rol: 'Propietaria',   accent: 'salvia', email: 'carmen@ambelcor.com', pass: 'carmen26', ultimoAcceso: 'Hoy, 09:14' },
  { id: 'paqui',  nombre: 'Paqui',  rol: 'Costurera',     accent: 'coral',  email: 'paqui@ambelcor.com',  pass: 'paqui26',  ultimoAcceso: 'Ayer, 18:02' },
  { id: 'admin',  nombre: 'Admin',  rol: 'Administrador', accent: 'cielo',  email: 'ceravieja@gmail.com', pass: 'pakito26', ultimoAcceso: 'Hace 3 días' },
]

// Devuelve el usuario con sus permisos resueltos, listo para guardar en sesión.
export const perfilDesdeUsuario = (u) => ({
  id: u.id,
  nombre: u.nombre,
  rol: u.rol,
  email: u.email,
  accent: u.accent,
  permisos: permisosDeRol(u.rol),
})

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
