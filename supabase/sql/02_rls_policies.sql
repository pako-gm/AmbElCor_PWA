-- ============================================================
-- 02_rls_policies.sql — RLS en todas las tablas operativas
-- Proyecto: AmbElCor CRM (feat/auth-supabase-rls — FASE 3)
--
-- Depende de public.rol_actual() y public.es_gestor()
-- (creadas en 01_perfiles.sql).
--
-- DESVIACIÓN DOCUMENTADA respecto al prompt original:
-- El prompt clasifica `datos_fiscales` en el Grupo B (económico,
-- solo es_gestor() para TODO). Sin embargo, un grep de
-- `.from('datos_fiscales')` muestra que EncargoDetalle.jsx y
-- KanbanView.jsx leen esta tabla para generar los PDFs de
-- presupuesto/factura, pantalla accesible también a `costurera`
-- (tiene permiso sobre `encargos`). Bloquear el SELECT habría
-- roto la generación de PDF para Paqui. Se aplica el mismo
-- criterio que el prompt ya prevé para el caso especial `pagos`:
-- SELECT abierto a cualquier perfil activo, escritura
-- (INSERT/UPDATE/DELETE) restringida a es_gestor() (coincide con
-- que solo Ajustes → datos fiscales, pantalla de gestor, escribe
-- en ella vía useDatosFiscales.guardarDatosFiscales).
--
-- Caso especial `pagos` (según el propio prompt, FASE 3.3):
-- se usa en useEncargos.js y KanbanView.jsx para mostrar el
-- estado de pago del encargo a cualquier rol, así que SELECT
-- también queda abierto a cualquier perfil activo; solo
-- Contabilidad (gestor) puede insertar/editar/borrar pagos.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Activar RLS en todas las tablas (sin FORCE: el owner /
--    service role de las Edge Functions debe poder saltarla).
-- ------------------------------------------------------------
alter table public.encargos                     enable row level security;
alter table public.encargo_lineas               enable row level security;
alter table public.clientes                     enable row level security;
alter table public.medidas_cliente              enable row level security;
alter table public.citas                        enable row level security;
alter table public.proveedores                  enable row level security;
alter table public.materiales                   enable row level security;
alter table public.movimientos_inventario       enable row level security;
alter table public.categorias_inventario        enable row level security;
alter table public.unidades_inventario          enable row level security;
alter table public.prendas_catalogo             enable row level security;
alter table public.historial_estados            enable row level security;
alter table public.historial_encargo            enable row level security;
alter table public.configuracion_app            enable row level security;
-- `inventario`: tabla legacy con 0 filas, sin uso en el código (sustituida
-- por materiales/movimientos_inventario). Se añade igualmente al Grupo A
-- para no dejar tablas sin RLS en el esquema público (FASE 9).
alter table public.inventario                   enable row level security;

alter table public.ventas                       enable row level security;
alter table public.venta_lineas                 enable row level security;
alter table public.pagos_proveedor              enable row level security;
alter table public.categorias_gasto             enable row level security;
alter table public.historial_incrementos_precio enable row level security;
alter table public.datos_fiscales               enable row level security;

alter table public.pagos                        enable row level security;

-- ------------------------------------------------------------
-- 1. Grupo A — operativa del taller
--    Cualquier rol autenticado con perfil activo, todas las
--    operaciones.
-- ------------------------------------------------------------
do $$
declare
  t text;
  tablas text[] := array[
    'encargos', 'encargo_lineas', 'clientes', 'medidas_cliente', 'citas',
    'proveedores', 'materiales', 'movimientos_inventario',
    'categorias_inventario', 'unidades_inventario', 'prendas_catalogo',
    'historial_estados', 'historial_encargo', 'configuracion_app', 'inventario'
  ];
begin
  foreach t in array tablas loop
    execute format('drop policy if exists %I_operativa on public.%I;', t, t);
    execute format(
      'create policy %I_operativa on public.%I for all to authenticated using (public.rol_actual() is not null) with check (public.rol_actual() is not null);',
      t, t
    );
    execute format('revoke all on table public.%I from anon;', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 2. Grupo B — económico (solo gestores)
-- ------------------------------------------------------------
do $$
declare
  t text;
  tablas text[] := array[
    'ventas', 'venta_lineas', 'pagos_proveedor', 'categorias_gasto',
    'historial_incrementos_precio'
  ];
begin
  foreach t in array tablas loop
    execute format('drop policy if exists %I_gestor on public.%I;', t, t);
    execute format(
      'create policy %I_gestor on public.%I for all to authenticated using (public.es_gestor()) with check (public.es_gestor());',
      t, t
    );
    execute format('revoke all on table public.%I from anon;', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 3. Casos especiales: SELECT abierto a cualquier perfil activo,
--    escritura solo gestores.
-- ------------------------------------------------------------
do $$
declare
  t text;
  tablas text[] := array['pagos', 'datos_fiscales'];
begin
  foreach t in array tablas loop
    execute format('drop policy if exists %I_lectura_general on public.%I;', t, t);
    execute format(
      'create policy %I_lectura_general on public.%I for select to authenticated using (public.rol_actual() is not null);',
      t, t
    );

    execute format('drop policy if exists %I_escritura_gestor on public.%I;', t, t);
    execute format(
      'create policy %I_escritura_gestor on public.%I for all to authenticated using (public.es_gestor()) with check (public.es_gestor());',
      t, t
    );

    execute format('revoke all on table public.%I from anon;', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 3b. Limpieza de políticas RESIDUALES de un intento anterior
--     (rama pausada `autenticacion_google`), detectadas al
--     aplicar este script en producción: `solo_autenticado` /
--     `authenticated only` / `auth_only_citas` daban acceso
--     TOTAL a cualquier usuario con `auth.role() = 'authenticated'`
--     sin comprobar `perfiles.rol`/`activo` — anulaban (por OR
--     de políticas permisivas) el control por rol de este script.
--     Los `anon_seguimiento_*` y la política de `prendas_catalogo`
--     con `qual: true` implementaban el seguimiento público
--     directo por tabla que la FASE 4 sustituye por RPCs
--     security definer. Se eliminan explícitamente para que este
--     script sea reproducible desde cero.
-- ------------------------------------------------------------
drop policy if exists solo_autenticado on public.clientes;
drop policy if exists solo_autenticado on public.datos_fiscales;
drop policy if exists solo_autenticado on public.encargo_lineas;
drop policy if exists solo_autenticado on public.encargos;
drop policy if exists solo_autenticado on public.historial_estados;
drop policy if exists solo_autenticado on public.inventario;
drop policy if exists solo_autenticado on public.pagos;
drop policy if exists solo_autenticado on public.pagos_proveedor;
drop policy if exists solo_autenticado on public.prendas_catalogo;
drop policy if exists solo_autenticado on public.proveedores;
drop policy if exists "authenticated only" on public.medidas_cliente;
drop policy if exists auth_only_citas on public.citas;

drop policy if exists anon_seguimiento_clientes on public.clientes;
drop policy if exists anon_seguimiento_encargos on public.encargos;
drop policy if exists anon_seguimiento_lineas on public.encargo_lineas;
drop policy if exists anon_seguimiento_historial on public.historial_estados;
drop policy if exists anon_seguimiento_pagos on public.pagos;
drop policy if exists anon_seguimiento_catalogo on public.prendas_catalogo;

-- ------------------------------------------------------------
-- 4. vista_stock_materiales: es una vista (sin RLS propia).
--    security_invoker hace que respete el RLS de las tablas
--    subyacentes (materiales / movimientos_inventario) en lugar
--    de ejecutarse con los permisos del creador de la vista.
-- ------------------------------------------------------------
alter view public.vista_stock_materiales set (security_invoker = true);

-- ------------------------------------------------------------
-- Verificación (ejecutar a mano si se quiere comprobar):
--
-- select relname, relrowsecurity
-- from pg_class
-- where relnamespace = 'public'::regnamespace and relkind = 'r'
-- order by relname;
--
-- select tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;
-- ------------------------------------------------------------
