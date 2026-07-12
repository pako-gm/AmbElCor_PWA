-- ============================================================
-- Tabla: historial_incrementos_precio
-- Registro de cada subida anual de precios aplicada desde
-- Ajustes > Incremento de precios ("Aplicar a todo el Catálogo").
-- Guarda fecha, porcentaje aplicado, nº de prendas afectadas y
-- quién lo aplicó, para poder auditar más adelante si ya se ha
-- aplicado la subida de un año concreto.
--
-- Ejecutar en el editor SQL de Supabase (project ref mqbaorcowozqfbdxsvbl).
-- ============================================================

create table if not exists public.historial_incrementos_precio (
  id                 uuid primary key default gen_random_uuid(),
  porcentaje         numeric not null,
  prendas_afectadas  integer not null default 0,
  usuario_nombre     text,
  created_at         timestamptz not null default now()
);

-- RLS deshabilitado para simplificar desarrollo (coherente con el resto de tablas nuevas).
alter table public.historial_incrementos_precio disable row level security;
