# PROMPT PARA CLAUDE CODE — Autenticación real por usuario + RLS en AmbElCor_PWA

Copia desde aquí hacia abajo y pégalo en Claude Code, en la raíz del repo `AmbElCor_PWA`.

---

## CONTEXTO

Este proyecto es un CRM (React 18 + Vite + Tailwind + Supabase) en `apps/crm/`. Hoy la autenticación es **falsa**: la puerta de entrada es `/acceso` (`pages/Acceso/Acceso.jsx`), que valida contra una lista hardcodeada en `apps/crm/lib/usuarios.js` (contraseñas en texto plano) y guarda el "perfil" en `localStorage` (`ambelcor_perfil`). Existe un login con Google (`pages/Login.jsx` + `loginConGoogle` en `lib/supabase.js`) y pantallas TOTP (`Setup2FA.jsx`, `Verify2FA.jsx`), pero el gate real en `ProtectedRoute.jsx` solo mira el perfil local (hay un TODO comentado). Las tablas de Supabase **no tienen RLS activado**.

**Objetivo**: migrar a autenticación real de Supabase con 3 usuarios email+contraseña (emails ficticios, sin confirmación de correo), TOTP por usuario, roles en base de datos, RLS activado en TODAS las tablas, y eliminar todo el sistema falso. La pantalla de acceso debe conservar la misma apariencia (selector de perfiles + panel de contraseña) pero validando contra Supabase Auth.

**Usuarios finales** (los creará el propietario a mano en el Dashboard, ver FASE 2 — tú solo prepara el SQL de perfiles):

| Email | Nombre | Rol | Accent |
|---|---|---|---|
| carmen@ambelcor.com | Carmen | propietaria | salvia |
| paqui@ambelcor.com | Paqui | costurera | coral |
| admin@ambelcor.com | Admin | administrador | cielo |

**Permisos por rol** (mantener la lógica actual de `ROLE_DEFAULTS`):
- `propietaria`: todas las secciones (encargos, inventario, ventas, contabilidad, ajustes)
- `administrador`: todas las secciones (hoy igual que propietaria; se diferenciará en el futuro — crear el rol como valor independiente)
- `costurera`: solo `encargos` e `inventario`

**Reglas generales**:
- Trabaja en una rama nueva: `feat/auth-supabase-rls`.
- Utiliza playwright al final de cada fase para comprobar funcionalidad.
- Cada fase debe dejar el proyecto compilando (`npm run build` sin errores).
- Los scripts SQL van en `supabase/sql/` numerados: `01_perfiles.sql`, `02_rls_policies.sql`, `03_seguimiento_publico.sql`, `04_solicitudes_password.sql`. Utiliza el MCP de Supabase instalado en el proyecto para ejecutar los scripts SQL. Avisame en cada fase cuando vayas a ejecutar un script SQL.
- No borres `Setup2FA.jsx` ni `Verify2FA.jsx`: se reutilizan.

---

## FASE 1 — Migración SQL: tabla `perfiles` y helper de rol

Crea `supabase/sql/01_perfiles.sql` con:

1. Tabla `perfiles`:
   - `id uuid primary key references auth.users(id) on delete cascade`
   - `nombre text not null`
   - `email text not null unique`
   - `rol text not null check (rol in ('propietaria','costurera','administrador'))`
   - `accent text not null default 'salvia'`
   - `activo boolean not null default true`
   - `ultimo_acceso timestamptz`
   - `created_at timestamptz not null default now()`

2. Función helper `public.rol_actual()`:
   - `returns text`, `language sql`, `stable`, `security definer`, `set search_path = public`
   - Devuelve el `rol` del perfil cuyo `id = auth.uid()` y `activo = true`; `null` si no existe.
   - Esta función es la base de todas las políticas RLS: evita subconsultas repetidas y problemas de recursión de RLS sobre la propia tabla `perfiles`.

3. Función `public.es_gestor()`:
   - `returns boolean`, mismas propiedades.
   - Devuelve `true` si `rol_actual() in ('propietaria','administrador')`.

4. Trigger `on_auth_user_login` NO es necesario; en su lugar, añade una función RPC `public.tocar_ultimo_acceso()` (security definer) que actualiza `ultimo_acceso = now()` del perfil de `auth.uid()`. El frontend la llamará tras cada login correcto.

5. RLS de la propia tabla `perfiles`:
   - `alter table perfiles enable row level security;`
   - SELECT: cualquier usuario autenticado puede leer todos los perfiles (se listan en Ajustes y en el selector).
   - UPDATE: solo `es_gestor()` (y nunca el campo `rol` del propio registro a `administrador` si no lo es ya — no hace falta complicarlo: UPDATE solo para gestores es suficiente).
   - INSERT/DELETE: nadie desde el cliente (se harán vía Edge Function con service role, que salta RLS).

6. Función RPC `public.listar_perfiles_login()`:
   - `security definer`, ejecutable por `anon`.
   - Devuelve SOLO `nombre, email, rol, accent, ultimo_acceso` de perfiles con `activo = true`.
   - La pantalla `/acceso` la usará para pintar el selector ANTES de que haya sesión. No exponer `id` ni ningún otro campo.
   - `revoke all on function ... from public; grant execute ... to anon, authenticated;`

---

## FASE 2 — Alta de usuarios (PASO MANUAL MÍO — solo documenta)

No lo hagas tú. Crea un archivo `docs/setup-usuarios.md` con estas instrucciones para mí:

1. Supabase Dashboard → Authentication → Sign In / Up → Email: activar proveedor Email y **desactivar "Confirm email"** (los correos son ficticios).
2. Authentication → Users → "Add user" → "Create new user": crear los 3 usuarios de la tabla del CONTEXTO con contraseña temporal y **Auto Confirm User = ON**.
3. Ejecutar en SQL Editor un INSERT en `perfiles` para cada usuario (incluye en el doc el SQL con un `select id from auth.users where email = '...'` como subconsulta, para no copiar UUIDs a mano).
4. Authentication → Multi-Factor → verificar que TOTP está habilitado.
5. Recordatorio: desactivar el proveedor Google en Authentication → Providers (ya no se usa).

---

## FASE 3 — RLS en TODAS las tablas

Crea `supabase/sql/02_rls_policies.sql`. Tablas detectadas en el código (verifica con un grep de `.from('` por si hay más y añade las que falten):

`encargos, encargo_lineas, clientes, medidas_cliente, citas, proveedores, materiales, movimientos_inventario, categorias_inventario, unidades_inventario, prendas_catalogo, historial_estados, historial_encargo, historial_incrementos_precio, configuracion_app, datos_fiscales, ventas, venta_lineas, pagos, pagos_proveedor, categorias_gasto`

(`vista_stock_materiales` es una vista: no lleva RLS; ver punto 4.)

1. `enable row level security` en TODAS las tablas anteriores. Añade también `force row level security` NO (el owner/service role debe poder saltarla para Edge Functions).

2. **Grupo A — operativa del taller** (accesible a cualquier rol autenticado con perfil activo): `encargos, encargo_lineas, clientes, medidas_cliente, citas, proveedores, materiales, movimientos_inventario, categorias_inventario, unidades_inventario, prendas_catalogo, historial_estados, historial_encargo, configuracion_app`.
   - Política única por tabla para SELECT/INSERT/UPDATE/DELETE: `using (rol_actual() is not null)` y `with check (rol_actual() is not null)`.

3. **Grupo B — económico** (solo `es_gestor()`, la costurera NO): `ventas, venta_lineas, pagos_proveedor, categorias_gasto, datos_fiscales, historial_incrementos_precio`.
   - Todas las operaciones con `using (es_gestor())` / `with check (es_gestor())`.
   - **Caso especial `pagos`**: comprueba primero si `EncargoDetalle.jsx` (o cualquier vista de encargos) lee `pagos`. Si es así: SELECT con `rol_actual() is not null` (la costurera necesita ver el estado de pago del encargo) pero INSERT/UPDATE/DELETE solo `es_gestor()`. Si no se usa fuera de Contabilidad, trátala como Grupo B completo. Documenta la decisión en un comentario del SQL.

4. `vista_stock_materiales`: ejecútale `alter view vista_stock_materiales set (security_invoker = true);` para que respete el RLS de las tablas subyacentes.

5. Revoca el acceso implícito del rol `anon` a todas estas tablas (`revoke all on ... from anon;`). El único acceso anónimo será vía las funciones RPC de las fases 1, 4 y 5.

6. Al final del script, incluye un bloque de verificación comentado: consulta a `pg_tables`/`pg_policies` para listar tablas con RLS y sus políticas.

---

## FASE 4 — Seguimiento público vía RPC (CRÍTICO: no romper el tracking de clientes)

Hoy `pages/Seguimiento/SeguimientoForm.jsx` y `SeguimientoDetalle.jsx` consultan `encargos` directamente con la clave anon. Con RLS activado dejarán de funcionar. Crea `supabase/sql/03_seguimiento_publico.sql`:

1. RPC `public.buscar_encargo_por_codigo(p_codigo text)`:
   - `security definer`, grant execute a `anon, authenticated`.
   - Recibe el código corto (formato AMB-XXXX), devuelve solo `token_publico` si existe. Replica el comportamiento actual de `SeguimientoForm`.

2. RPC `public.seguimiento_publico(p_token uuid)`:
   - `security definer`, grant execute a `anon, authenticated`.
   - Devuelve EXACTAMENTE los campos que `SeguimientoDetalle.jsx` usa hoy (léelo y replica su select, incluidas las líneas del encargo si las muestra), y nada más. Ningún dato fiscal ni de pagos que no se muestre ya.

3. Actualiza ambos componentes para usar `supabase.rpc(...)` en lugar de `.from('encargos')`. El comportamiento visible para el cliente debe ser idéntico al actual.

---

## FASE 5 — Recuperación de contraseña sin email real

Los emails de usuario son ficticios: no puede haber "reset por enlace al correo". Flujo elegido: **solicitud interna + aviso en campana + email de aviso al buzón central `ambelcorvalencia@gmail.com`**.

Crea `supabase/sql/04_solicitudes_password.sql`:

1. Tabla `solicitudes_password`:
   - `id uuid pk default gen_random_uuid()`, `email text not null`, `nombre text`, `estado text not null default 'pendiente' check (estado in ('pendiente','resuelta'))`, `created_at timestamptz default now()`, `resuelta_at timestamptz`, `resuelta_por text`.
   - RLS: SELECT y UPDATE solo `es_gestor()`. INSERT: nadie directo (se inserta vía RPC).

2. RPC `public.solicitar_reset_password(p_email text)`:
   - `security definer`, grant execute a `anon`.
   - Valida que el email existe en `perfiles` (activo); si existe, inserta la solicitud. Devuelve siempre `void`/éxito genérico (no revelar si el email existe o no).
   - Protección básica anti-spam: si ya hay una solicitud `pendiente` para ese email en la última hora, no insertar otra.

3. Frontend — `ForgotView` (en `pages/Acceso/panels.jsx`): conéctala a esta RPC. Mensaje al usuario: "Aviso enviado. La administración restablecerá tu contraseña." Sin más detalle.

4. Aviso en campana: en `components/layout/NotificacionesBell.jsx` (y su hook `useAvisos.js`), si el rol del perfil es gestor, añade las solicitudes `pendientes` como avisos con enlace a Ajustes → Usuarios CRM.

5. **Email al buzón central (OPCIONAL, no bloquees el resto si no está la clave)**: crea la Edge Function `supabase/functions/notificar-reset/index.ts` que envía un email a `ambelcorvalencia@gmail.com` vía la API de Resend (`RESEND_API_KEY` como secret; remitente `onboarding@resend.dev` hasta que haya dominio verificado). La RPC no puede llamarla directamente: haz que `ForgotView`, tras la RPC, invoque también `supabase.functions.invoke('notificar-reset', ...)` con el email solicitado. La función debe fallar en silencio si no hay API key (el aviso de campana es la garantía). Documenta en `docs/setup-usuarios.md` cómo crear la cuenta Resend y añadir el secret.

---

## FASE 6 — Edge Function de administración de usuarios

El cliente NUNCA debe tener la service role key. Crea `supabase/functions/admin-usuarios/index.ts`:

1. Autenticación de la llamada: extrae el JWT del header, resuelve el usuario con el cliente admin, y comprueba en `perfiles` que su rol es `propietaria` o `administrador`. Si no, 403.

2. Acciones (body `{ action, payload }`):
   - `crear_usuario`: `{ email, password, nombre, rol, accent }` → `auth.admin.createUser` con `email_confirm: true` + INSERT en `perfiles`. Valida rol contra la lista permitida y formato de email.
   - `reset_password`: `{ user_id, nueva_password }` → `auth.admin.updateUserById`. Además marca como `resuelta` cualquier solicitud pendiente de ese email (`resuelta_por` = nombre del gestor que llama).
   - `toggle_activo`: `{ user_id, activo }` → actualiza `perfiles.activo` (un perfil inactivo no puede operar: `rol_actual()` ya lo excluye).
   - `cambiar_rol`: `{ user_id, rol }` → actualiza `perfiles.rol`.

3. Usa `SUPABASE_SERVICE_ROLE_KEY` del entorno de Edge Functions (ya disponible por defecto). CORS correcto para el dominio de la app.

---

## FASE 7 — Refactor del frontend de autenticación

1. **`lib/usuarios.js`**: eliminar `USUARIOS` (la lista hardcodeada con contraseñas) y `perfilDesdeUsuario`. Conservar `SECCIONES`, `ROLES` (ahora en minúscula: `propietaria/costurera/administrador`), `ROLE_DEFAULTS` (claves en minúscula), `permisosDeRol`, `primeraRutaPermitida`. Añadir `accentsDisponibles` si el form lo necesita.

2. **`hooks/useAuth.jsx`**:
   - Eliminar TODO lo de `localStorage`/`PERFIL_KEY`/`loginPerfil`/`logoutPerfil`.
   - Estado: `session/user` (de `supabase.auth`), `mfaVerified` (aal2, como ya está), `perfil` (fila de `perfiles` del usuario logueado, cargada con `.from('perfiles').select().eq('id', user.id)` cuando hay sesión), `permisos` (derivados de `permisosDeRol(perfil.rol)`), `loading`.
   - `signOut`: `supabase.auth.signOut()` y limpiar estado.
   - Tras login verificado, llamar a la RPC `tocar_ultimo_acceso()`.

3. **`pages/Acceso/Acceso.jsx`** (conservar la apariencia actual: selector + panel de contraseña + éxito):
   - El listado de perfiles viene de `rpc('listar_perfiles_login')`, no de `USUARIOS`.
   - `PasswordPanel.onSubmit` → `supabase.auth.signInWithPassword({ email, password })`. Error → mensaje "Contraseña incorrecta" en el panel.
   - Tras login OK: consultar factores MFA (`supabase.auth.mfa.listFactors()`); si no hay factor TOTP verificado → navegar a `/setup-2fa`; si hay → `/verify-2fa`. Tras verificar → vista de éxito → `primeraRutaPermitida`.

4. **`Setup2FA.jsx` / `Verify2FA.jsx`**: revisarlas y dejarlas operativas con el flujo por usuario (enroll con QR la primera vez; challenge+verify después). Tras `verify` correcto, refrescar la sesión para que `aal === 'aal2'` y navegar según permisos.

5. **`components/layout/ProtectedRoute.jsx`**: gate real, en este orden:
   - sin `user` → `/acceso`
   - con `user` pero sin `mfaVerified` → `/verify-2fa`
   - sin `perfil` o `perfil.activo === false` → `/acceso` (con signOut)
   - `permiso` no incluido en permisos del rol → redirect a `primeraRutaPermitida`.

6. **Eliminar el login con Google**: borrar `pages/Login.jsx`, quitar `loginConGoogle` de `lib/supabase.js`, quitar la ruta `/login` de `App.jsx` (o redirigirla a `/acceso`). Quitar el import de `Login` en `App.jsx`.

7. **`UserMenu.jsx`** y cualquier sitio que lea `perfil` del contexto: adaptar a la nueva forma del perfil (campos de la tabla).

---

## FASE 8 — Panel "Usuarios CRM" en Ajustes (persistencia real)

En `pages/Ajustes/Ajustes.jsx` (`SeccionUsuarios`) y `pages/Acceso/panels.jsx` (`UsuarioForm`, hoy decorativo):

1. Listado desde la tabla `perfiles` (no desde `USUARIOS`). Mostrar nombre, rol, email, estado activo/inactivo y `ultimo_acceso` formateado.

2. **Alta de usuario** (`UsuarioForm` modo nuevo): campos nombre, **email ficticio** (con hint "no necesita ser un buzón real, p. ej. nombre@ambelcor.com", validar formato), rol (select con los 3 roles), accent, y contraseña inicial ((minimo 8 caracteres alfanuméricos, con complejidad minima: 1 letra mayuscula, 1 numero, 1 carácter especial) con botón generar). Submit → Edge Function `admin-usuarios` acción `crear_usuario`. Toast de éxito con recordatorio de la contraseña inicial.

3. **Edición**: nombre, rol (→ `cambiar_rol`), accent, activo (→ `toggle_activo`).

4. **Cambio de contraseña** (nuevo):
   - Sobre el PROPIO usuario logueado: opción "Cambiar mi contraseña" (contraseña nueva x2) → `supabase.auth.updateUser({ password })`.
   - Sobre OTRO usuario (solo visible para gestores): botón "Restablecer contraseña" en cada fila → modal con contraseña nueva (o generar) → Edge Function `reset_password`.

5. **Solicitudes pendientes**: si hay filas en `solicitudes_password` con estado `pendiente`, mostrarlas en un bloque destacado arriba de la lista con botón directo "Restablecer" (pre-selecciona al usuario por email). Al resetear, la Edge Function ya las marca resueltas.

6. Este panel solo es visible/operativo para roles gestores; la sección Ajustes ya está restringida por permisos, pero añade guarda también aquí por si en el futuro la costurera accede a Ajustes.

---

## FASE 9 — Limpieza y verificación

1. Grep de comprobación: no debe quedar ninguna referencia a `USUARIOS`, `PERFIL_KEY`, `ambelcor_perfil`, `loginPerfil`, `carmen26`, `paqui26`, `pakito26`, `loginConGoogle`. Elimina también `pages/Acceso` restos decorativos que ya no se usen (mantén `ui.jsx` y lo que sí se reutilice).

2. `npm run build` sin errores y sin warnings nuevos.

3. Escribe en `docs/setup-usuarios.md` un CHECKLIST DE PRUEBAS manual para mí:
   - Los 3 usuarios entran con su contraseña; primer login pide QR de TOTP; siguientes piden código.
   - Paqui (costurera) no ve Ventas/Contabilidad/Ajustes en la navegación, y si teclea `/ventas` en la URL es redirigida.
   - Con la sesión de Paqui, desde la consola del navegador, `supabase.from('ventas').select()` devuelve 0 filas / error de política (RLS real, no solo UI).
   - Sin sesión, `supabase.from('encargos').select()` no devuelve nada.
   - `/seguimiento` y `/seguimiento/:token` siguen funcionando sin login.
   - "¿Olvidaste la contraseña?" genera solicitud, aparece en la campana del admin y (si hay Resend) llega email a ambelcorvalencia@gmail.com.
   - Alta de usuario nuevo desde Ajustes funciona y puede loguearse.
   - Cambio de contraseña propio y reset por admin funcionan.

4. Lista final para mí de TODO lo manual: SQL a ejecutar en orden (01→04), configuración del Dashboard (FASE 2), deploy de las 2 Edge Functions (`supabase functions deploy admin-usuarios` y `notificar-reset`), y secrets necesarios.

---

## ORDEN DE EJECUCIÓN

Crea la rama indicada en las instrucciones y avisa al usuario para avanzar a la fase 1.
Ejecuta las fases en orden 1 → 9. Detente al final de cada fase y muéstrame un resumen de lo hecho y lo que me toca hacer a mí antes de continuar. Si encuentras algo en el código que contradiga estas instrucciones (por ejemplo, más tablas, o `pagos` usado en el detalle de encargo), decide según el criterio indicado y déjalo documentado en un comentario.
