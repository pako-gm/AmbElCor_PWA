-- ============================================================
-- 04_solicitudes_password.sql — Recuperación de contraseña interna
-- Proyecto: AmbElCor CRM (feat/auth-supabase-rls — FASE 5)
--
-- Los emails de usuario son ficticios (@ambelcor.com): no hay
-- "reset por enlace al correo real". Flujo: el usuario solicita
-- el reset desde /acceso → queda registrado en esta tabla → un
-- gestor lo ve en la campana de notificaciones y restablece la
-- contraseña desde Ajustes → Usuarios (Edge Function admin-usuarios,
-- FASE 6).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabla solicitudes_password
-- ------------------------------------------------------------
create table if not exists public.solicitudes_password (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  nombre        text,
  estado        text not null default 'pendiente' check (estado in ('pendiente', 'resuelta')),
  created_at    timestamptz not null default now(),
  resuelta_at   timestamptz,
  resuelta_por  text
);

alter table public.solicitudes_password enable row level security;

drop policy if exists solicitudes_password_select_gestor on public.solicitudes_password;
create policy solicitudes_password_select_gestor
  on public.solicitudes_password
  for select
  to authenticated
  using (public.es_gestor());

drop policy if exists solicitudes_password_update_gestor on public.solicitudes_password;
create policy solicitudes_password_update_gestor
  on public.solicitudes_password
  for update
  to authenticated
  using (public.es_gestor())
  with check (public.es_gestor());

-- INSERT: nadie directo (ni gestores). Se inserta únicamente vía
-- la RPC solicitar_reset_password (security definer, bypassa RLS
-- porque corre con los privilegios del owner de la función/tabla).
revoke all on table public.solicitudes_password from anon;

-- ------------------------------------------------------------
-- 2. RPC solicitar_reset_password(p_email)
--    - No revela si el email existe o no (siempre éxito genérico).
--    - Anti-spam: máximo una solicitud pendiente por email/hora.
-- ------------------------------------------------------------
create or replace function public.solicitar_reset_password(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text;
  v_ya_pendiente boolean;
begin
  select nombre into v_nombre
  from public.perfiles
  where email = p_email and activo = true;

  if v_nombre is null then
    return;
  end if;

  select exists(
    select 1
    from public.solicitudes_password
    where email = p_email
      and estado = 'pendiente'
      and created_at > now() - interval '1 hour'
  ) into v_ya_pendiente;

  if v_ya_pendiente then
    return;
  end if;

  insert into public.solicitudes_password (email, nombre)
  values (p_email, v_nombre);
end;
$$;

revoke all on function public.solicitar_reset_password(text) from public;
grant execute on function public.solicitar_reset_password(text) to anon, authenticated;

-- ------------------------------------------------------------
-- Verificación (ejecutar a mano si se quiere comprobar):
-- select public.solicitar_reset_password('carmen@ambelcor.com');
-- select * from public.solicitudes_password order by created_at desc;
-- ------------------------------------------------------------
