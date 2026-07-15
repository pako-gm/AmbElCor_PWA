-- ============================================================
-- 01_perfiles.sql — Tabla de perfiles + helpers de rol
-- Proyecto: AmbElCor CRM (feat/auth-supabase-rls — FASE 1)
--
-- Crea la tabla `perfiles` (1:1 con auth.users), las funciones
-- helper que usarán todas las políticas RLS, la RPC de último
-- acceso y la RPC pública para el selector de la pantalla de
-- acceso. Idempotente: puede re-ejecutarse sin error.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabla perfiles
-- ------------------------------------------------------------
create table if not exists public.perfiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  nombre         text not null,
  email          text not null unique,
  rol            text not null check (rol in ('propietaria','costurera','administrador')),
  accent         text not null default 'salvia',
  activo         boolean not null default true,
  ultimo_acceso  timestamptz,
  created_at     timestamptz not null default now()
);

comment on table public.perfiles is
  'Perfil de cada usuario del CRM (1:1 con auth.users). El rol gobierna los permisos vía RLS.';

-- ------------------------------------------------------------
-- 2. Helper rol_actual()
--    Base de todas las políticas RLS. SECURITY DEFINER para
--    evitar recursión de RLS al consultar la propia tabla
--    perfiles desde sus políticas.
-- ------------------------------------------------------------
create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol
  from public.perfiles
  where id = auth.uid()
    and activo = true;
$$;

-- ------------------------------------------------------------
-- 3. Helper es_gestor()
-- ------------------------------------------------------------
create or replace function public.es_gestor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rol_actual() in ('propietaria','administrador');
$$;

-- ------------------------------------------------------------
-- 4. RPC tocar_ultimo_acceso()
--    El frontend la llama tras cada login verificado.
-- ------------------------------------------------------------
create or replace function public.tocar_ultimo_acceso()
returns void
language sql
security definer
set search_path = public
as $$
  update public.perfiles
  set ultimo_acceso = now()
  where id = auth.uid();
$$;

revoke all on function public.tocar_ultimo_acceso() from public;
grant execute on function public.tocar_ultimo_acceso() to authenticated;

-- ------------------------------------------------------------
-- 5. RLS de la tabla perfiles
--    - SELECT: cualquier usuario autenticado (listados en
--      Ajustes y contexto de sesión).
--    - UPDATE: solo gestores.
--    - INSERT/DELETE: sin política => denegado desde el
--      cliente. Se harán vía Edge Function con service role,
--      que salta RLS.
-- ------------------------------------------------------------
alter table public.perfiles enable row level security;

drop policy if exists perfiles_select_authenticated on public.perfiles;
create policy perfiles_select_authenticated
  on public.perfiles
  for select
  to authenticated
  using (true);

drop policy if exists perfiles_update_gestor on public.perfiles;
create policy perfiles_update_gestor
  on public.perfiles
  for update
  to authenticated
  using (public.es_gestor())
  with check (public.es_gestor());

-- El rol anon no debe tocar la tabla directamente: el selector
-- de /acceso usa la RPC listar_perfiles_login().
revoke all on table public.perfiles from anon;

-- ------------------------------------------------------------
-- 6. RPC listar_perfiles_login()
--    Alimenta el selector de perfiles de /acceso ANTES de que
--    exista sesión. Expone solo los campos imprescindibles de
--    los perfiles activos (nunca el id).
-- ------------------------------------------------------------
create or replace function public.listar_perfiles_login()
returns table (
  nombre         text,
  email          text,
  rol            text,
  accent         text,
  ultimo_acceso  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select nombre, email, rol, accent, ultimo_acceso
  from public.perfiles
  where activo = true
  order by nombre;
$$;

revoke all on function public.listar_perfiles_login() from public;
grant execute on function public.listar_perfiles_login() to anon, authenticated;

-- ------------------------------------------------------------
-- Verificación (ejecutar a mano si se quiere comprobar):
-- select * from pg_policies where tablename = 'perfiles';
-- select public.rol_actual(), public.es_gestor(); -- null/false sin sesión
-- select * from public.listar_perfiles_login();
-- ------------------------------------------------------------
