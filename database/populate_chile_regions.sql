-- ============================================
-- POBLAR REGIONES DE CHILE EN EMPLOYEES
-- ============================================

-- Regiones de Chile (16 regiones)
WITH regiones_chile AS (
  SELECT * FROM (VALUES 
    ('Arica y Parinacota'),
    ('Tarapacá'),
    ('Antofagasta'),
    ('Atacama'),
    ('Coquimbo'),
    ('Valparaíso'),
    ('Metropolitana'),
    ('O''Higgins'),
    ('Maule'),
    ('Ñuble'),
    ('Biobío'),
    ('Araucanía'),
    ('Los Ríos'),
    ('Los Lagos'),
    ('Aysén'),
    ('Magallanes')
  ) AS t(region)
),
-- Enumerar empleados
empleados_enumerados AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id) - 1 as row_num
  FROM employees
)
-- Actualizar empleados con regiones cíclicamente
UPDATE employees e
SET region = (
  SELECT region 
  FROM regiones_chile 
  CROSS JOIN empleados_enumerados ee
  WHERE ee.id = e.id
  AND regiones_chile.region = (
    SELECT region 
    FROM regiones_chile 
    LIMIT 1 OFFSET (ee.row_num % 16)
  )
)
WHERE e.id IN (SELECT id FROM empleados_enumerados);

-- Verificar resultado
SELECT 
  region,
  COUNT(*) as cantidad_empleados
FROM employees
WHERE region IS NOT NULL
GROUP BY region
ORDER BY region;

-- Mostrar muestra de empleados actualizados
SELECT 
  id,
  email,
  region
FROM employees
WHERE region IS NOT NULL
LIMIT 10;