-- Datos base. Idempotente: se puede correr más de una vez.

INSERT INTO usuarios (email, nombre, rol) VALUES
  ('da.morande@gmail.com', 'Dario Morandé', 'admin'),
  ('francisco@cfs.cl', 'Francisco Padilla', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO parametros (clave, valor, etiqueta, unidad, nota) VALUES
  ('comision_ferrada', 0.5, 'Comisión Ferrada', 'USD/caja', 'Siempre se cobra, por cada caja'),
  ('rebate_naviera', 1000, 'Rebate de naviera', 'USD/contenedor', 'Variable; valor sugerido al crear una operación. Por confirmar'),
  ('meta_semanal_destino', 2, 'Meta semanal por destino', 'contenedores', 'Contenedores que deben zarpar cada semana a cada destino'),
  ('pallets_por_contenedor', 21, 'Pallets por contenedor', 'pallets', 'Puede ser 20 según la fruta'),
  ('cajas_por_pallet', 49, 'Cajas por pallet', 'cajas', '21 pallets × 49 = 1.029 cajas por contenedor'),
  ('dias_pago2_desde', 5, 'Pago 2 de Ferrada desde', 'días tras la llegada', NULL),
  ('dias_pago2_hasta', 10, 'Pago 2 de Ferrada hasta', 'días tras la llegada', NULL)
ON CONFLICT (clave) DO NOTHING;

-- Destinos sugeridos (editables en Configuración): uno por zona mencionada en la reunión 3
INSERT INTO destinos (puerto, pais, region)
SELECT * FROM (VALUES
  ('Rotterdam', 'Países Bajos', 'Europa'::region),
  ('Jebel Ali', 'Emiratos Árabes Unidos', 'Medio Oriente'::region),
  ('Busan', 'Corea del Sur', 'Asia'::region),
  ('Kaohsiung', 'Taiwán', 'Asia'::region)
) AS v(puerto, pais, region)
WHERE NOT EXISTS (SELECT 1 FROM destinos);
