-- =============================================
-- MIGRATION 01: Refactorización de Recursos
-- Fecha: 2026-04-21
-- Descripción:
-- - Elimina código único y automático de recursos
-- - Agrega tablas para distribución a frentes
-- - Implementa sistema de devoluciones
-- =============================================

-- =============================================
-- ENUMS nuevos
-- =============================================
CREATE TYPE devolucion_estado AS ENUM ('BUENO', 'DAÑADO', 'PARCIAL');

-- =============================================
-- PASO 1: Modificar tabla recursos
-- =============================================
-- Remover UNIQUE constraint de codigo (se permite NULL o duplicados)
ALTER TABLE recursos DROP CONSTRAINT recursos_codigo_key;
-- Hacer codigo nullable si es necesario, pero por compatibilidad lo dejamos
-- ALTER TABLE recursos ALTER COLUMN codigo DROP NOT NULL;

-- =============================================
-- PASO 2: Crear tabla distribucion_frentes
-- =============================================
CREATE TABLE distribucion_frentes (
    id SERIAL PRIMARY KEY,
    recurso_id INTEGER NOT NULL REFERENCES recursos(id),
    frente_trabajo_id INTEGER NOT NULL REFERENCES frentes_trabajo(id),
    cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
    responsable_id UUID NOT NULL REFERENCES usuarios(id),
    fecha_distribucion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT TRUE,
    fecha_cierre TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PASO 3: Crear tabla devoluciones
-- =============================================
CREATE TABLE devoluciones (
    id SERIAL PRIMARY KEY,
    distribucion_frente_id INTEGER NOT NULL REFERENCES distribucion_frentes(id),
    cantidad_devuelta DECIMAL(12,2) NOT NULL CHECK (cantidad_devuelta > 0),
    quien_devuelve_id UUID NOT NULL REFERENCES usuarios(id),
    estado devolucion_estado NOT NULL DEFAULT 'BUENO',
    fecha_devolucion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PASO 4: Crear vista: stock por frente
-- =============================================
CREATE VIEW vista_stock_por_frente AS
SELECT
    r.id AS recurso_id,
    r.nombre,
    r.codigo,
    c.nombre AS categoria,
    um.nombre AS unidad,
    -- Stock en almacén central
    COALESCE(e.total_entradas, 0) AS total_entradas,
    COALESCE(s.total_salidas, 0) AS total_salidas,
    COALESCE(e.total_entradas, 0) - COALESCE(s.total_salidas, 0) AS stock_disponible,
    -- Stock distribuido a frentes
    COALESCE(df.total_distribuido, 0) AS stock_distribuido,
    -- Desglose por frente
    df.distribucion_por_frente,
    -- Estado general
    CASE
        WHEN COALESCE(e.total_entradas, 0) - COALESCE(s.total_salidas, 0) <= 0 THEN 'AGOTADO'
        ELSE 'DISPONIBLE'
    END AS status
FROM recursos r
JOIN categorias c ON r.categoria_id = c.id
JOIN unidades_medida um ON r.unidad_medida_id = um.id
LEFT JOIN (
    SELECT recurso_id, SUM(cantidad) AS total_entradas
    FROM entradas
    GROUP BY recurso_id
) e ON r.id = e.recurso_id
LEFT JOIN (
    SELECT recurso_id, SUM(cantidad) AS total_salidas
    FROM salidas
    GROUP BY recurso_id
) s ON r.id = s.recurso_id
LEFT JOIN (
    SELECT
        recurso_id,
        SUM(CASE WHEN activa = TRUE THEN cantidad ELSE 0 END) AS total_distribuido,
        STRING_AGG(DISTINCT ft.nombre || ': ' || COALESCE(SUM(CASE WHEN activa = TRUE THEN cantidad ELSE 0 END), 0)::TEXT, ', ' ORDER BY ft.nombre) AS distribucion_por_frente
    FROM distribucion_frentes df
    LEFT JOIN frentes_trabajo ft ON df.frente_trabajo_id = ft.id
    GROUP BY recurso_id
) df ON r.id = df.recurso_id
WHERE r.activo = TRUE;

-- =============================================
-- PASO 5: ÍNDICES para distribucion_frentes
-- =============================================
CREATE INDEX idx_distribucion_frentes_recurso ON distribucion_frentes(recurso_id);
CREATE INDEX idx_distribucion_frentes_frente ON distribucion_frentes(frente_trabajo_id);
CREATE INDEX idx_distribucion_frentes_responsable ON distribucion_frentes(responsable_id);
CREATE INDEX idx_distribucion_frentes_activa ON distribucion_frentes(activa);
CREATE INDEX idx_distribucion_frentes_fecha ON distribucion_frentes(fecha_distribucion);

-- =============================================
-- PASO 6: ÍNDICES para devoluciones
-- =============================================
CREATE INDEX idx_devoluciones_distribucion ON devoluciones(distribucion_frente_id);
CREATE INDEX idx_devoluciones_quien_devuelve ON devoluciones(quien_devuelve_id);
CREATE INDEX idx_devoluciones_estado ON devoluciones(estado);
CREATE INDEX idx_devoluciones_fecha ON devoluciones(fecha_devolucion);

-- =============================================
-- PASO 7: Actualizar vista_inventario para mayor claridad
-- =============================================
DROP VIEW vista_inventario;

CREATE VIEW vista_inventario AS
SELECT
    r.id,
    r.codigo,
    r.nombre,
    r.categoria_id,
    c.nombre AS categoria,
    um.nombre AS unidad,
    COALESCE(e.total_entradas, 0) AS total_entradas,
    COALESCE(s.total_salidas, 0) AS total_salidas,
    COALESCE(e.total_entradas, 0) - COALESCE(s.total_salidas, 0) AS existencia_actual,
    CASE
        WHEN COALESCE(e.total_entradas, 0) - COALESCE(s.total_salidas, 0) = 0 THEN 'AGOTADO'
        ELSE 'DISPONIBLE'
    END AS status
FROM recursos r
JOIN categorias c ON r.categoria_id = c.id
JOIN unidades_medida um ON r.unidad_medida_id = um.id
LEFT JOIN (
    SELECT recurso_id, SUM(cantidad) AS total_entradas
    FROM entradas
    GROUP BY recurso_id
) e ON r.id = e.recurso_id
LEFT JOIN (
    SELECT recurso_id, SUM(cantidad) AS total_salidas
    FROM salidas
    GROUP BY recurso_id
) s ON r.id = s.recurso_id
WHERE r.activo = TRUE;

-- =============================================
-- FIN MIGRATION 01
-- =============================================
