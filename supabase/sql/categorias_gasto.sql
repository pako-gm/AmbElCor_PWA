-- ============================================================
-- Tabla: categorias_gasto
-- Categorías de los pagos/gastos (módulo Contabilidad).
-- Antes estaban hardcodeadas en src/utils/formatters.js
-- (CATEGORIA_GASTO_LABELS) y src/pages/Contabilidad/ContabilidadDashboard.jsx
-- (CATEGORIA_COLORES). Ahora se gestionan desde Ajustes › Categorías de gasto.
--
-- La columna `clave` es la que se guarda en pagos_proveedor.categoria.
-- Ejecutar en el editor SQL de Supabase (project ref mqbaorcowozqfbdxsvbl).
-- ============================================================

create table if not exists public.categorias_gasto (
  id         uuid primary key default gen_random_uuid(),
  clave      text not null unique,
  etiqueta   text not null,
  color      text not null default '#9CA3AF',
  orden      integer not null default 0,
  created_at timestamptz not null default now()
);

-- RLS deshabilitado para simplificar desarrollo (coherente con el resto de tablas nuevas).
alter table public.categorias_gasto disable row level security;

-- Seed con las 10 categorías que existían hardcodeadas (clave + etiqueta + color).
insert into public.categorias_gasto (clave, etiqueta, color, orden) values
  ('material',                  'Material y suministros confección',            '#1fb39a',  1),
  ('cuota_autonomo',            'Cuota autónomo (SS)',                          '#8b5cd6',  2),
  ('alquiler',                  'Alquiler local',                               '#c2872a',  3),
  ('suministros',               'Suministros (luz, agua, internet)',            '#9b1f8c',  4),
  ('servicios_profesionales',   'Servicios profesionales (gestoría, asesoría)', '#4f86d6',  5),
  ('transporte',                'Transporte y mensajería',                      '#d6537d',  6),
  ('marketing',                 'Marketing y publicidad',                       '#5b7088',  7),
  ('impuestos',                 'Impuestos y tasas',                            '#e0563f',  8),
  ('seguros',                   'Seguros',                                      '#10B981',  9),
  ('otros',                     'Otros gastos',                                 '#9CA3AF', 10)
on conflict (clave) do nothing;

-- pagos_proveedor.categoria tenía un CHECK que limitaba los valores a una lista
-- fija de 9 categorías, lo que impedía crear categorías nuevas. Se elimina para
-- que sea texto libre (la integridad de etiquetas la da ahora categorias_gasto).
alter table public.pagos_proveedor drop constraint if exists pagos_proveedor_categoria_check;
