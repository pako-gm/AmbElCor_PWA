-- Descuento en euros por línea de encargo: sustituye al descuento porcentual
-- de la ficha de prenda del catálogo. Carmen decide, por línea de encargo,
-- si aplica descuento y de cuánto, en vez de que sea fijo por prenda.

-- Descuento por línea de encargo, en euros
alter table encargo_lineas
  add column descuento numeric not null default 0
  check (descuento >= 0);

-- El descuento porcentual del catálogo deja de existir
alter table prendas_catalogo
  drop column descuento;
