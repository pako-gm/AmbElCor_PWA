-- ============================================================
-- 03_seguimiento_publico.sql — Seguimiento público vía RPC
-- Proyecto: AmbElCor CRM (feat/auth-supabase-rls — FASE 4)
--
-- Con RLS activado en la FASE 3, `SeguimientoForm.jsx` y
-- `SeguimientoDetalle.jsx` dejaron de poder consultar `encargos`
-- directamente con la clave anon. Estas dos RPC security definer
-- restauran el comportamiento público, exponiendo solo los
-- campos que esas pantallas ya mostraban.
-- ============================================================

-- ------------------------------------------------------------
-- 1. buscar_encargo_por_codigo(p_codigo)
--    Replica: .from('encargos').select('token_publico')
--             .eq('codigo_corto', codigo).maybeSingle()
-- ------------------------------------------------------------
create or replace function public.buscar_encargo_por_codigo(p_codigo text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select token_publico
  from public.encargos
  where codigo_corto = p_codigo
  limit 1;
$$;

revoke all on function public.buscar_encargo_por_codigo(text) from public;
grant execute on function public.buscar_encargo_por_codigo(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 2. seguimiento_publico(p_token)
--    Replica exactamente el select anidado de SeguimientoDetalle.jsx:
--      id, numero, estado, fecha_encargo, fecha_entrega_estimada,
--      clientes (nombre, apellidos),
--      encargo_lineas (descripcion, cantidad, precio_unitario, prendas_catalogo (nombre)),
--      historial_estados (estado_nuevo, fecha),
--      pagos (fecha, importe, tipo)
--    Ningún dato fiscal ni de pago adicional (forma_pago, notas,
--    stripe_payment_id...) que no se muestre ya en la pantalla.
-- ------------------------------------------------------------
create or replace function public.seguimiento_publico(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', e.id,
    'numero', e.numero,
    'estado', e.estado,
    'fecha_encargo', e.fecha_encargo,
    'fecha_entrega_estimada', e.fecha_entrega_estimada,
    'clientes', jsonb_build_object('nombre', c.nombre, 'apellidos', c.apellidos),
    'encargo_lineas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'descripcion', el.descripcion,
        'cantidad', el.cantidad,
        'precio_unitario', el.precio_unitario,
        'prendas_catalogo', case when pc.nombre is not null
          then jsonb_build_object('nombre', pc.nombre)
          else null
        end
      ))
      from public.encargo_lineas el
      left join public.prendas_catalogo pc on pc.id = el.prenda_id
      where el.encargo_id = e.id
    ), '[]'::jsonb),
    'historial_estados', coalesce((
      select jsonb_agg(jsonb_build_object('estado_nuevo', h.estado_nuevo, 'fecha', h.fecha))
      from public.historial_estados h
      where h.encargo_id = e.id
    ), '[]'::jsonb),
    'pagos', coalesce((
      select jsonb_agg(jsonb_build_object('fecha', p.fecha, 'importe', p.importe, 'tipo', p.tipo))
      from public.pagos p
      where p.encargo_id = e.id
    ), '[]'::jsonb)
  )
  from public.encargos e
  left join public.clientes c on c.id = e.cliente_id
  where e.token_publico = p_token;
$$;

revoke all on function public.seguimiento_publico(uuid) from public;
grant execute on function public.seguimiento_publico(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- Verificación (ejecutar a mano con un token_publico real):
-- select public.buscar_encargo_por_codigo('AMB-XXXX');
-- select public.seguimiento_publico('00000000-0000-0000-0000-000000000000'::uuid);
-- ------------------------------------------------------------
