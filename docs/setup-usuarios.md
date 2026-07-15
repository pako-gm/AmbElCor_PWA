# Alta de usuarios — pasos manuales (FASE 2)

Estos pasos los ejecuta Carmen (o quien administre el proyecto Supabase) a mano en el Dashboard. No requieren código.

## 1. Habilitar el proveedor Email y desactivar confirmación

En el [Dashboard de Supabase](https://supabase.com/dashboard/project/mqbaorcowozqfbdxsvbl):

1. **Authentication → Sign In / Up → Email**
2. Activar el proveedor **Email**.
3. **Desactivar "Confirm email"** — los correos de los 3 usuarios son ficticios (`@ambelcor.com`), no existen buzones reales que puedan confirmar el alta.

## 2. Crear los 3 usuarios

**Authentication → Users → "Add user" → "Create new user"**

Crear cada uno de estos usuarios con una contraseña temporal y **"Auto Confirm User" = ON**:

| Email | Nombre | Rol | Accent | pwd
|---|---|---|---|
| carmen@ambelcor.com | Carmen | propietaria | salvia | carmen26
| paqui@ambelcor.com | Paqui | costurera | coral | paqui26
| admin@ambelcor.com | Admin | administrador | cielo | admin26

> Anota la contraseña temporal de cada uno — se usará en la primera prueba de login (FASE 9).

## 3. Insertar la fila de perfil correspondiente

Una vez creados los 3 usuarios en Auth, ir a **SQL Editor** y ejecutar, para cada uno, un INSERT en `perfiles`. La subconsulta a `auth.users` evita tener que copiar el UUID a mano:

```sql
insert into public.perfiles (id, nombre, email, rol, accent)
values (
  (select id from auth.users where email = 'carmen@ambelcor.com'),
  'Carmen',
  'carmen@ambelcor.com',
  'propietaria',
  'salvia'
);

insert into public.perfiles (id, nombre, email, rol, accent)
values (
  (select id from auth.users where email = 'paqui@ambelcor.com'),
  'Paqui',
  'paqui@ambelcor.com',
  'costurera',
  'coral'
);

insert into public.perfiles (id, nombre, email, rol, accent)
values (
  (select id from auth.users where email = 'admin@ambelcor.com'),
  'Admin',
  'admin@ambelcor.com',
  'administrador',
  'cielo'
);
```

Verificar el resultado:

```sql
select nombre, email, rol, accent, activo from public.perfiles order by nombre;
```

Deben aparecer las 3 filas con `activo = true`.

## 4. Verificar que TOTP (MFA) está habilitado

**Authentication → Multi-Factor** → confirmar que **TOTP** aparece como habilitado (suele estarlo por defecto). Cada usuario configurará su propio QR en su primer login (pantalla `Setup2FA`).

## 5. Desactivar el proveedor Google

El login con Google (`pages/Login.jsx`) se elimina en la FASE 7 — ya no se usa.

**Authentication → Providers → Google** → desactivar el proveedor.

---

## 6. (Opcional) Configurar Resend para el aviso de reset de contraseña

Cuando alguien pulsa "¿Has olvidado la contraseña?" en `/acceso`, la solicitud queda registrada en la tabla `solicitudes_password` y aparece en la campana de notificaciones para Carmen/Admin — esto **ya funciona sin Resend**. El envío de un email de aviso al buzón central es una comodidad adicional, opcional:

1. Crear una cuenta en [resend.com](https://resend.com) (nivel gratuito es suficiente).
2. Generar una API key.
3. En el Dashboard de Supabase → **Edge Functions → Secrets**, añadir `RESEND_API_KEY` con esa clave.
4. Mientras no exista `RESEND_API_KEY`, la función `notificar-reset` no falla: simplemente no envía el email (el aviso de campana sigue funcionando igual).
5. El remitente usado es `onboarding@resend.dev` (dominio de pruebas de Resend) hasta que se verifique un dominio propio.

---

## Checklist de pruebas manual (FASE 9)

Una vez completados los pasos 1-4 de este documento (usuarios creados y perfiles insertados), verifica en el CRM desplegado:

- [ ] Los 3 usuarios (Carmen, Paqui, Admin) entran con su email + contraseña. El primer login de cada uno pide escanear el QR de TOTP (`/setup-2fa`); los siguientes logins piden el código de 6 dígitos (`/verify-2fa`).
- [ ] Con la sesión de **Paqui** (costurera): en la navegación NO aparecen Ventas, Contabilidad ni Ajustes. Si tecleas `/ventas` o `/ajustes` en la URL, te redirige a Encargos.
- [ ] Con la sesión de Paqui, desde la consola del navegador: `await supabase.from('ventas').select()` devuelve `data: []` o un error de política — nunca las filas reales. Esto confirma que la restricción es RLS real en la base de datos, no solo ocultar botones en la UI.
- [ ] Sin ninguna sesión iniciada (ventana privada): `await supabase.from('encargos').select()` no devuelve ninguna fila.
- [ ] `/seguimiento` (buscar por código `AMB-XXXX`) y `/seguimiento/:token` (enlace directo) siguen funcionando sin necesidad de iniciar sesión.
- [ ] Desde `/acceso`, "¿Olvidaste la contraseña?" con el email de un usuario real genera una solicitud, que aparece en la campana de notificaciones de Carmen/Admin como "Solicitudes de acceso". Si configuraste Resend (paso 6), también llega un email a `ambelcorvalencia@gmail.com`.
- [ ] Desde Ajustes → Usuarios CRM (con sesión de Carmen o Admin), dar de alta un usuario nuevo funciona y esa persona puede iniciar sesión con la contraseña indicada.
- [ ] Cambiar la propia contraseña ("Cambiar mi contraseña") funciona y permite volver a entrar con la nueva.
- [ ] "Restablecer contraseña" de otro usuario (botón de llave en su fila, o desde el bloque de solicitudes pendientes) funciona, y esa persona puede entrar con la contraseña nueva.
- [ ] Desactivar un usuario (`Editar → Usuario activo = off`) le impide iniciar sesión (queda redirigido a `/acceso`) aunque conozca su contraseña.

## Resumen de todo lo manual — estado actual

| Tarea | Estado |
|---|---|
| SQL `01_perfiles.sql` → `04_solicitudes_password.sql` | ✅ Ya ejecutados en producción (vía MCP durante el desarrollo de esta rama) |
| Edge Functions `admin-usuarios` y `notificar-reset` | ✅ Ya desplegadas (`ACTIVE` en el proyecto `mqbaorcowozqfbdxsvbl`) |
| Paso 1 — Habilitar proveedor Email + desactivar confirmación | ⬜ Pendiente (Dashboard) |
| Paso 2 — Crear los 3 usuarios en Auth | ⬜ Pendiente (Dashboard) |
| Paso 3 — INSERT de los 3 perfiles | ⬜ Pendiente (SQL Editor, ver sección 3 de este documento) |
| Paso 4 — Verificar TOTP habilitado | ⬜ Pendiente (Dashboard) |
| Paso 5 — Desactivar proveedor Google | ⬜ Pendiente (Dashboard) |
| Paso 6 — Secret `RESEND_API_KEY` (opcional) | ⬜ Opcional, no bloquea nada |
| Checklist de pruebas manual de arriba | ⬜ Pendiente, tras completar los pasos 1-4 |

No queda ningún script SQL ni despliegue de código pendiente por mi parte: todo lo que falta es configuración del Dashboard de Supabase (pasos 1, 2, 4, 5) y el SQL de alta de perfiles del paso 3, que son deliberadamente manuales para que tú controles las contraseñas y accesos reales.
