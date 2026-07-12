-- Carga inicial del catálogo real de indumentaria fallera/fallero en prendas_catalogo,
-- sustituyendo los 12 artículos de prueba genéricos.
--
-- La tabla prendas_catalogo es plana (nombre, descripcion, precio_base,
-- activo, tipo_uso, material_id): no tiene columnas para categoría/tipo/estilo/
-- segmento de edad/elaboración, así que esa taxonomía se incrusta como texto
-- legible dentro de descripcion.
--
-- Incluye 31 prendas + 7 servicios + 15 tipos de arreglo (53 filas), siguiendo la
-- convención ya existente en la app de mezclar prendas y servicios/arreglos como
-- líneas de catálogo (p. ej. "Ajuste de talla", "Arreglo general" ya convivían con
-- prendas antes de esta carga).
--
-- precio_base son valores semilla (aleatorios, sin decimales, por banda razonable
-- según el tipo de artículo) — Carmen los ajustará desde el panel de Catálogo.
-- tipo_uso se deja en 'solo_encargo' (default) y material_id en NULL para todos:
-- activar venta directa exige vincular un material de stock real, que se hace
-- desde la UI de Catálogo cuando Carmen decida qué artículos vender sueltos.

-- 1. Limpieza de ventas de prueba que referencian el catálogo antiguo
DELETE FROM movimientos_inventario WHERE venta_id IN (
  SELECT venta_id FROM venta_lineas WHERE prenda_id IN (
    SELECT id FROM prendas_catalogo WHERE nombre IN ('Aderezo oro viejo','Cancan seda salvaje')
  )
);

DELETE FROM venta_lineas WHERE prenda_id IN (
  SELECT id FROM prendas_catalogo WHERE nombre IN ('Aderezo oro viejo','Cancan seda salvaje')
);

DELETE FROM ventas WHERE id NOT IN (SELECT DISTINCT venta_id FROM venta_lineas WHERE venta_id IS NOT NULL);

-- 2. Borrado del catálogo de prueba actual (encargo_lineas.prenda_id -> ON DELETE SET NULL)
DELETE FROM prendas_catalogo;

-- 3. Carga del catálogo real
INSERT INTO prendas_catalogo (nombre, descripcion, precio_base, activo, tipo_uso, material_id) VALUES
-- PRENDAS FALLERA
('Camisa (ropa interior)', 'Camisa interior, habitualmente a juego con las enaguas. Categoría: Indumentaria de fallera. Tipo: Prenda interior. Estilos: Siglo XVIII, Siglo XIX (de farolet), Justillo / coteta (huertana). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Confección propia en el taller.', 55, true, 'solo_encargo', NULL),
('Enaguas', 'Ropa interior bajo la falda; da base al vuelo. Categoría: Indumentaria de fallera. Tipo: Prenda interior. Estilos: Siglo XVIII, Siglo XIX (de farolet), Justillo / coteta (huertana). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Confección propia en el taller.', 62, true, 'solo_encargo', NULL),
('Ahuecador / cancán', 'Da vuelo a la falda; vuelo medio-alto según modelo. Categoría: Indumentaria de fallera. Tipo: Prenda interior. Estilos: Siglo XVIII, Siglo XIX (de farolet). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 78, true, 'solo_encargo', NULL),
('Falda', 'En espolín, seda, sedalina o rayón; estampada con flores o brocatelada. Categoría: Indumentaria de fallera. Tipo: Prenda exterior. Estilos: Siglo XVIII, Siglo XIX (de farolet), Justillo / coteta (huertana). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Confección propia en el taller. (pieza estructural)', 265, true, 'solo_encargo', NULL),
('Corpiño / gipó / jubón (val. Gipó)', 'Cuerpo del traje; pieza estructural y la que concentra más arreglos. Categoría: Indumentaria de fallera. Tipo: Prenda exterior. Estilos: Siglo XVIII, Siglo XIX (de farolet). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Confección propia en el taller. (pieza estructural)', 310, true, 'solo_encargo', NULL),
('Justillo / coteta (val. Justillo)', 'Corpiño de huertana para traje de faena o de mudar. Categoría: Indumentaria de fallera. Tipo: Prenda exterior. Estilos: Justillo / coteta (huertana). Segmentos: Adulto, Niño / niña. Elaboración: Confección propia en el taller. (pieza estructural)', 195, true, 'solo_encargo', NULL),
('Manteleta (pico)', 'Parte superior sobre el corpiño; de tul cristal, seda, muselina o batista, bordada. Algunos talleres la confeccionan. Categoría: Indumentaria de fallera. Tipo: Prenda exterior. Estilos: Siglo XVIII, Siglo XIX (de farolet). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 95, true, 'solo_encargo', NULL),
('Delantal', 'Parte inferior de la manteleta, va sobre la falda; forma juego con el pico. Categoría: Indumentaria de fallera. Tipo: Prenda exterior. Estilos: Siglo XVIII, Siglo XIX (de farolet). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 72, true, 'solo_encargo', NULL),
('Medias', 'De algodón o seda, con bordados a juego con el traje. Categoría: Indumentaria de fallera. Tipo: Complemento. Estilos: Siglo XVIII, Siglo XIX (de farolet), Justillo / coteta (huertana). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 28, true, 'solo_encargo', NULL),
('Zapatos', 'Habitualmente forrados con la tela del traje (ver servicio de forrado de zapatos). Categoría: Indumentaria de fallera. Tipo: Calzado. Estilos: Siglo XVIII, Siglo XIX (de farolet), Justillo / coteta (huertana). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 89, true, 'solo_encargo', NULL),
('Juego de peinetas', 'Tres piezas: una grande trasera y dos laterales para los rodetes; latón dorado o plateado. Categoría: Indumentaria de fallera. Tipo: Tocado / peinado. Estilos: Siglo XVIII, Siglo XIX (de farolet). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 68, true, 'solo_encargo', NULL),
('Aderezo (joya, collar, pendientes)', 'Realizado por orfebre; estilos Balconet, Verge y Racimo según el siglo. Categoría: Indumentaria de fallera. Tipo: Joyería / aderezo. Estilos: Siglo XVIII, Siglo XIX (de farolet). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 320, true, 'solo_encargo', NULL),
('Agujas, pasadores, rascamoños y pinta', 'Fijan y adornan el moño trasero y los rodetes. Categoría: Indumentaria de fallera. Tipo: Tocado / peinado. Estilos: Siglo XVIII, Siglo XIX (de farolet). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 42, true, 'solo_encargo', NULL),
('Postizos / posticería', 'Rodetes y moño postizos para el peinado tradicional. Categoría: Indumentaria de fallera. Tipo: Tocado / peinado. Estilos: Siglo XVIII, Siglo XIX (de farolet). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 85, true, 'solo_encargo', NULL),
('Abanico', 'Complemento de mano. Categoría: Indumentaria de fallera. Tipo: Complemento. Estilos: Siglo XVIII, Siglo XIX (de farolet), Justillo / coteta (huertana). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 22, true, 'solo_encargo', NULL),
('Mantón', 'Opcional, en algunos conjuntos de huertana. Categoría: Indumentaria de fallera. Tipo: Complemento. Estilos: Justillo / coteta (huertana). Segmentos: Adulto. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 65, true, 'solo_encargo', NULL),
-- PRENDAS FALLERO
('Camisa blanca', 'Camisa blanca de cuello alto o tradicional, generalmente de algodón. Categoría: Indumentaria de fallero. Tipo: Prenda exterior. Estilos: Saragüell (llaurador), Torrentí, De calzón (s. XVIII de gala). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 38, true, 'solo_encargo', NULL),
('Blusón / brusa (val. Brusa)', 'Prenda cómoda de comisión/diario, abotonada por delante. Categoría: Indumentaria de fallero. Tipo: Prenda exterior. Estilos: Saragüell (llaurador). Segmentos: Adulto, Niño / niña. Elaboración: Confección propia en el taller.', 58, true, 'solo_encargo', NULL),
('Saragüell (pantalón) (val. Saragüell)', 'Pantalón blanco ancho hasta la rodilla; deja ver las lligacames. Categoría: Indumentaria de fallero. Tipo: Prenda exterior. Estilos: Saragüell (llaurador). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Confección propia en el taller. (pieza estructural)', 175, true, 'solo_encargo', NULL),
('Pantalón torrentí', 'Más ceñido a la pierna, con forma de campana. Categoría: Indumentaria de fallero. Tipo: Prenda exterior. Estilos: Torrentí. Segmentos: Adulto, Niño / niña. Elaboración: Confección propia en el taller. (pieza estructural)', 165, true, 'solo_encargo', NULL),
('Calzón (s. XVIII)', 'De terciopelo o seda; propio del traje de gala. Categoría: Indumentaria de fallero. Tipo: Prenda exterior. Estilos: De calzón (s. XVIII de gala). Segmentos: Adulto, Niño / niña. Elaboración: Confección propia en el taller. (pieza estructural)', 340, true, 'solo_encargo', NULL),
('Chaleco / jupetí / chopetí (val. Jupetí)', 'Chaleco, con o sin solapas según el estilo. Categoría: Indumentaria de fallero. Tipo: Prenda exterior. Estilos: Saragüell (llaurador), Torrentí, De calzón (s. XVIII de gala). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Confección propia en el taller.', 95, true, 'solo_encargo', NULL),
('Chaquetilla / chaqueta corta', 'Chaquetilla corta hasta la cintura. Categoría: Indumentaria de fallero. Tipo: Prenda exterior. Estilos: Torrentí, De calzón (s. XVIII de gala). Segmentos: Adulto, Niño / niña. Elaboración: Confección propia en el taller.', 128, true, 'solo_encargo', NULL),
('Medias / calces (val. Calces)', 'Calcetines o medias, a veces bordados. Categoría: Indumentaria de fallero. Tipo: Complemento. Estilos: Saragüell (llaurador), Torrentí, De calzón (s. XVIII de gala). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 24, true, 'solo_encargo', NULL),
('Espardeñas / alpargatas (val. Espardenyes)', 'De esparto o cáñamo, con vetas cosidas a mano. Categoría: Indumentaria de fallero. Tipo: Calzado. Estilos: Saragüell (llaurador), Torrentí. Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 47, true, 'solo_encargo', NULL),
('Zapatos / chapines', 'Para el traje de calzón/gala. Categoría: Indumentaria de fallero. Tipo: Calzado. Estilos: De calzón (s. XVIII de gala). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 132, true, 'solo_encargo', NULL),
('Manta morellana / capa de paño', 'Manta larga y estrecha de vivos colores, o capa de paño en la versión de abrigo. Categoría: Indumentaria de fallero. Tipo: Complemento. Estilos: Saragüell (llaurador), Torrentí. Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 55, true, 'solo_encargo', NULL),
('Faja / fajín (val. Faixa)', 'De colores vivos, algodón o seda/rayón; ajusta el pantalón a la cintura. Categoría: Indumentaria de fallero. Tipo: Complemento. Estilos: Saragüell (llaurador), Torrentí, De calzón (s. XVIII de gala). Segmentos: Adulto, Niño / niña, Bebé. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 33, true, 'solo_encargo', NULL),
('Pañuelo / mocador de cabeza (val. Mocador)', 'De seda, damasco o viscosa, para la cabeza. Categoría: Indumentaria de fallero. Tipo: Tocado / peinado. Estilos: Saragüell (llaurador), Torrentí. Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 44, true, 'solo_encargo', NULL),
('Sombrero / barret (val. Barret)', 'Montera, cossiol, rodina o catite según la variante. Categoría: Indumentaria de fallero. Tipo: Tocado / peinado. Estilos: Saragüell (llaurador), Torrentí, De calzón (s. XVIII de gala). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 76, true, 'solo_encargo', NULL),
('Lligacames (ligas) (val. Lligacames)', 'Ligas visibles bajo el saragüell, aportan un toque de color. Categoría: Indumentaria de fallero. Tipo: Complemento. Estilos: Saragüell (llaurador). Segmentos: Adulto, Niño / niña. Elaboración: Compra a proveedor y reventa (orfebre, alpargatería, mercería...).', 15, true, 'solo_encargo', NULL),
-- SERVICIOS
('Confección de traje completo', 'Traje de fallera o fallero a medida, completo. Requiere prueba: Sí. Estacional: Sí.', 480, true, 'solo_encargo', NULL),
('Confección de prenda suelta', 'Confección a medida de una prenda concreta (corpiño, falda, chaleco...). Requiere prueba: Sí. Estacional: Sí.', 140, true, 'solo_encargo', NULL),
('Arreglo / ajuste', 'Ajustes y reparaciones sobre prenda existente (ver tipos de arreglo). Requiere prueba: Sí. Estacional: Sí.', 35, true, 'solo_encargo', NULL),
('Restauración', 'Recuperación de traje heredado o antiguo. Requiere prueba: Sí. Estacional: No.', 210, true, 'solo_encargo', NULL),
('Forrado de zapatos', 'Forrar zapatos con la tela del traje. Requiere prueba: No. Estacional: Sí.', 25, true, 'solo_encargo', NULL),
('Alquiler', 'Alquiler de traje o complementos, con o sin opción a compra. Requiere prueba: Sí. Estacional: Sí.', 120, true, 'solo_encargo', NULL),
('Venta de complemento', 'Reventa de complementos y accesorios (aderezo, peinetas, espardeñas...). Requiere prueba: No. Estacional: Sí.', 40, true, 'solo_encargo', NULL),
-- TIPOS DE ARREGLO
('Estrechar / ensanchar corpiño', 'El arreglo más habitual, especialmente en niñas por el crecimiento año a año. Frecuencia: muy alta. Segmento principal: Niño / niña. Prendas relacionadas: Corpiño / gipó / jubón, Justillo / coteta.', 38, true, 'solo_encargo', NULL),
('Estrechar / ensanchar falda', 'Ajuste de cintura y vuelo de la falda. Frecuencia: alta. Segmento principal: Adulto. Prendas relacionadas: Falda.', 32, true, 'solo_encargo', NULL),
('Subir / bajar el bajo de la falda', 'Ajuste de largo respetando la altura característica de la falda. Frecuencia: alta. Segmento principal: Niño / niña. Prendas relacionadas: Falda.', 22, true, 'solo_encargo', NULL),
('Añadir tela de reserva (crecimiento)', 'Incorporar el trozo de tela guardado para agrandar la prenda cuando la niña crece, casando el dibujo. Frecuencia: alta. Segmento principal: Niño / niña. Prendas relacionadas: Falda, Corpiño / gipó / jubón.', 45, true, 'solo_encargo', NULL),
('Transformar / cambiar forma del corpiño', 'Rehacer un corpiño que tira o rediseñar su forma, escote u hombros. Frecuencia: media. Segmento principal: Adulto. Prendas relacionadas: Corpiño / gipó / jubón.', 65, true, 'solo_encargo', NULL),
('Ajuste de mangas y sisa', 'Ajuste de mangas de farol (XIX) o ajustadas (XVIII) y de la sisa. Frecuencia: media. Segmento principal: Adulto. Prendas relacionadas: Corpiño / gipó / jubón.', 40, true, 'solo_encargo', NULL),
('Cambio de cierres', 'Corchetes, cremalleras, ganchos y tirantes. Frecuencia: alta. Segmento principal: Adulto. Prendas relacionadas: Corpiño / gipó / jubón, Falda.', 18, true, 'solo_encargo', NULL),
('Ajuste de manteleta y delantal', 'Recolocar picos, cintas y puntillas. Frecuencia: media. Segmento principal: Adulto. Prendas relacionadas: Manteleta (pico), Delantal.', 28, true, 'solo_encargo', NULL),
('Ajuste de volumen (enaguas / cancán)', 'Corregir la caída de la falda añadiendo o quitando vuelo. Frecuencia: media. Segmento principal: Adulto. Prendas relacionadas: Enaguas, Ahuecador / cancán.', 30, true, 'solo_encargo', NULL),
('Reparación de tejido (espolín, damasco, seda)', 'Descosidos y enganchones en tejido delicado. Frecuencia: media. Segmento principal: Adulto. Prendas relacionadas: Falda, Corpiño / gipó / jubón.', 48, true, 'solo_encargo', NULL),
('Reparación de puntillas y encajes', 'Recuperar o sustituir puntillas y encajes dañados. Frecuencia: baja. Segmento principal: Adulto. Prendas relacionadas: Manteleta (pico), Delantal, Corpiño / gipó / jubón.', 35, true, 'solo_encargo', NULL),
('Forrado / entretelado', 'Entretelar para dar cuerpo a la prenda. Frecuencia: baja. Segmento principal: Adulto. Prendas relacionadas: Corpiño / gipó / jubón, Falda.', 42, true, 'solo_encargo', NULL),
('Ajuste de saragüell / pantalón', 'Ajuste de cintura y largo del pantalón masculino. Frecuencia: baja. Segmento principal: Niño / niña. Prendas relacionadas: Saragüell (pantalón), Pantalón torrentí, Calzón (s. XVIII).', 20, true, 'solo_encargo', NULL),
('Ajuste de chaleco', 'Estrechar o ensanchar el chaleco/jupetí. Frecuencia: baja. Segmento principal: Adulto. Prendas relacionadas: Chaleco / jupetí / chopetí.', 24, true, 'solo_encargo', NULL),
('Ajuste de faja', 'Ajuste de largo de la faja/fajín. Frecuencia: baja. Segmento principal: Adulto. Prendas relacionadas: Faja / fajín.', 15, true, 'solo_encargo', NULL);
