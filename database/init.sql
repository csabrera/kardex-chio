-- KardexChio - Inicialización de base de datos v2
-- =============================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'ALMACENERO', 'SUPERVISOR');
CREATE TYPE tipo_documento AS ENUM ('DNI', 'CE', 'PASAPORTE');
CREATE TYPE equipo_estado AS ENUM ('EN_ALMACEN', 'SALIDA', 'INGRESO');
CREATE TYPE persona_tipo AS ENUM ('PROVEEDOR', 'TRABAJADOR', 'TRANSPORTISTA');
CREATE TYPE movimiento_tipo AS ENUM ('ENTRADA', 'SALIDA', 'SALIDA_EQUIPO', 'ENTRADA_EQUIPO');

-- =============================================
-- TABLA: usuarios
-- =============================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento tipo_documento NOT NULL DEFAULT 'DNI',
    documento VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol user_role NOT NULL DEFAULT 'ALMACENERO',
    activo BOOLEAN DEFAULT TRUE,
    primer_inicio BOOLEAN DEFAULT TRUE,
    nombre VARCHAR(100),
    apellido_paterno VARCHAR(100),
    apellido_materno VARCHAR(100),
    celular VARCHAR(15),
    email VARCHAR(150),
    direccion VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: categorias
-- =============================================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: unidades_medida
-- =============================================
CREATE TABLE unidades_medida (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: personas
-- =============================================
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    tipo persona_tipo NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    documento VARCHAR(20),
    email VARCHAR(150),
    telefono VARCHAR(15),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: frentes_trabajo
-- =============================================
CREATE TABLE frentes_trabajo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: medios_transporte
-- =============================================
CREATE TABLE medios_transporte (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: recursos (inventario)
-- =============================================
CREATE TABLE recursos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(300) NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    unidad_medida_id INTEGER NOT NULL REFERENCES unidades_medida(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: entradas
-- =============================================
CREATE TABLE entradas (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL,
    num_guia VARCHAR(50),
    recurso_id INTEGER NOT NULL REFERENCES recursos(id),
    cantidad DECIMAL(12,2) NOT NULL,
    quien_entrega_id INTEGER REFERENCES personas(id),
    quien_recibe_id INTEGER REFERENCES personas(id),
    medio_transporte_id INTEGER REFERENCES medios_transporte(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES usuarios(id)
);

-- =============================================
-- TABLA: salidas
-- =============================================
CREATE TABLE salidas (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL,
    num_registro VARCHAR(50),
    recurso_id INTEGER NOT NULL REFERENCES recursos(id),
    cantidad DECIMAL(12,2) NOT NULL,
    frente_trabajo_id INTEGER REFERENCES frentes_trabajo(id),
    descripcion_trabajo VARCHAR(300),
    quien_entrega_id INTEGER REFERENCES personas(id),
    quien_recibe_id INTEGER REFERENCES personas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES usuarios(id)
);

-- =============================================
-- TABLA: equipos
-- =============================================
CREATE TABLE equipos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(300) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id),
    unidad_medida_id INTEGER REFERENCES unidades_medida(id),
    estado equipo_estado DEFAULT 'EN_ALMACEN',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: salida_equipos
-- =============================================
CREATE TABLE salida_equipos (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL,
    num_registro VARCHAR(50),
    equipo_id INTEGER NOT NULL REFERENCES equipos(id),
    cantidad DECIMAL(12,2) NOT NULL,
    frente_trabajo_id INTEGER REFERENCES frentes_trabajo(id),
    descripcion_trabajo VARCHAR(300),
    quien_entrega_id INTEGER REFERENCES personas(id),
    quien_recibe_id INTEGER REFERENCES personas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES usuarios(id)
);

-- =============================================
-- TABLA: entrada_equipos (retorno de equipos)
-- =============================================
CREATE TABLE entrada_equipos (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL,
    num_registro VARCHAR(50),
    equipo_id INTEGER NOT NULL REFERENCES equipos(id),
    cantidad DECIMAL(12,2) NOT NULL,
    frente_trabajo_id INTEGER REFERENCES frentes_trabajo(id),
    descripcion_trabajo VARCHAR(300),
    quien_entrega_id INTEGER REFERENCES personas(id),
    quien_recibe_id INTEGER REFERENCES personas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES usuarios(id)
);

-- =============================================
-- TABLA: movimientos (auditoría/trazabilidad)
-- =============================================
CREATE TABLE movimientos (
    id SERIAL PRIMARY KEY,
    tipo movimiento_tipo NOT NULL,
    referencia_id INTEGER NOT NULL,
    recurso_id INTEGER REFERENCES recursos(id),
    equipo_id INTEGER REFERENCES equipos(id),
    cantidad DECIMAL(12,2) NOT NULL,
    fecha TIMESTAMP NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES usuarios(id)
);

-- =============================================
-- VISTA: inventario con existencias calculadas
-- =============================================
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
-- ÍNDICES para rendimiento
-- =============================================
CREATE INDEX idx_categorias_activo ON categorias(activo);
CREATE INDEX idx_unidades_medida_activo ON unidades_medida(activo);
CREATE INDEX idx_personas_tipo ON personas(tipo);
CREATE INDEX idx_personas_activo ON personas(activo);
CREATE INDEX idx_frentes_trabajo_activo ON frentes_trabajo(activo);
CREATE INDEX idx_medios_transporte_activo ON medios_transporte(activo);
CREATE INDEX idx_recursos_categoria ON recursos(categoria_id);
CREATE INDEX idx_recursos_codigo ON recursos(codigo);
CREATE INDEX idx_recursos_activo ON recursos(activo);
CREATE INDEX idx_entradas_recurso ON entradas(recurso_id);
CREATE INDEX idx_entradas_fecha ON entradas(fecha);
CREATE INDEX idx_entradas_quien_entrega ON entradas(quien_entrega_id);
CREATE INDEX idx_entradas_quien_recibe ON entradas(quien_recibe_id);
CREATE INDEX idx_salidas_recurso ON salidas(recurso_id);
CREATE INDEX idx_salidas_fecha ON salidas(fecha);
CREATE INDEX idx_salidas_frente ON salidas(frente_trabajo_id);
CREATE INDEX idx_equipos_activo ON equipos(activo);
CREATE INDEX idx_salida_equipos_equipo ON salida_equipos(equipo_id);
CREATE INDEX idx_salida_equipos_fecha ON salida_equipos(fecha);
CREATE INDEX idx_movimientos_recurso ON movimientos(recurso_id);
CREATE INDEX idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX idx_movimientos_tipo ON movimientos(tipo);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Categorías optimizadas (12)
INSERT INTO categorias (nombre) VALUES
    ('Ferretería'),
    ('Pintura'),
    ('Eléctrico'),
    ('Seguridad'),
    ('Maderas'),
    ('Herramientas'),
    ('Limpieza'),
    ('Materiales de Construcción'),
    ('Combustibles'),
    ('Alimentos y Bebidas'),
    ('Oficina'),
    ('Equipos');

-- Unidades de medida
INSERT INTO unidades_medida (codigo, nombre) VALUES
    ('UND', 'Unidad'),
    ('KG', 'Kilogramo'),
    ('LT', 'Litro'),
    ('M', 'Metro'),
    ('M2', 'Metro cuadrado'),
    ('BLS', 'Bolsa'),
    ('GLN', 'Galón'),
    ('RLL', 'Rollo'),
    ('PAR', 'Par'),
    ('CJA', 'Caja'),
    ('PZA', 'Pieza'),
    ('PLG', 'Pliego');

-- Usuario admin por defecto (password: 00000000 - bcrypt hash)
INSERT INTO usuarios (tipo_documento, documento, password, rol, primer_inicio, nombre, apellido_paterno, apellido_materno) VALUES
    ('DNI', '00000000', '$2b$10$N1GIjsmwKS/j2bJRWFhJoeudFOIZk16oCamYleYr1qKOODOTYJ1cO', 'ADMIN', FALSE, 'Administrador', 'Sistema', 'Admin');

-- ============================================================
-- MIGRACION v2: Rediseno flujo equipos
-- ============================================================

-- Agregar AGOTADO al enum equipo_estado
ALTER TYPE equipo_estado ADD VALUE IF NOT EXISTS 'AGOTADO';
ALTER TYPE equipo_estado ADD VALUE IF NOT EXISTS 'INACTIVO';

-- salida_equipos: tipo_salida y cerrada
ALTER TABLE salida_equipos ADD COLUMN IF NOT EXISTS tipo_salida VARCHAR(20) NOT NULL DEFAULT 'PRESTAMO';
ALTER TABLE salida_equipos ADD COLUMN IF NOT EXISTS cerrada BOOLEAN NOT NULL DEFAULT FALSE;

-- entrada_equipos: tipo_entrada y referencia a salida origen
ALTER TABLE entrada_equipos ADD COLUMN IF NOT EXISTS tipo_entrada VARCHAR(20) NOT NULL DEFAULT 'ADQUISICION';
ALTER TABLE entrada_equipos ADD COLUMN IF NOT EXISTS salida_equipo_id INTEGER REFERENCES salida_equipos(id);

-- Vista: stock disponible por equipo
-- Usa subqueries para evitar producto cartesiano entre entrada_equipos y salida_equipos
CREATE OR REPLACE VIEW vista_stock_equipos AS
SELECT
  e.id,
  e.codigo,
  e.nombre,
  e.activo,
  COALESCE(entradas.total_adquirido, 0)  AS total_adquirido,
  COALESCE(entradas.total_retornado, 0)  AS total_retornado,
  COALESCE(salidas.total_despachado, 0)  AS total_despachado,
  (
    COALESCE(entradas.total_adquirido, 0) +
    COALESCE(entradas.total_retornado, 0) -
    COALESCE(salidas.total_despachado, 0)
  ) AS stock_disponible,
  CASE
    WHEN NOT e.activo THEN 'INACTIVO'
    WHEN (
      COALESCE(entradas.total_adquirido, 0) +
      COALESCE(entradas.total_retornado, 0) -
      COALESCE(salidas.total_despachado, 0)
    ) > 0 THEN 'EN_ALMACEN'
    ELSE 'AGOTADO'
  END AS estado
FROM equipos e
LEFT JOIN (
  SELECT equipo_id,
    SUM(CASE WHEN tipo_entrada = 'ADQUISICION' THEN cantidad ELSE 0 END) AS total_adquirido,
    SUM(CASE WHEN tipo_entrada = 'RETORNO'     THEN cantidad ELSE 0 END) AS total_retornado
  FROM entrada_equipos
  GROUP BY equipo_id
) entradas ON entradas.equipo_id = e.id
LEFT JOIN (
  SELECT equipo_id, SUM(cantidad) AS total_despachado
  FROM salida_equipos
  GROUP BY equipo_id
) salidas ON salidas.equipo_id = e.id;

-- Vista: ubicacion tiempo real (salidas abiertas con pendiente > 0)
CREATE OR REPLACE VIEW vista_ubicacion_equipos AS
SELECT
  se.id AS salida_id,
  e.id  AS equipo_id,
  e.codigo,
  e.nombre AS equipo_nombre,
  se.tipo_salida,
  se.fecha,
  se.descripcion_trabajo,
  ft.nombre AS frente_trabajo,
  pe.nombre AS quien_entrega,
  pr.nombre AS quien_recibe,
  se.cantidad AS cantidad_enviada,
  COALESCE(SUM(ee.cantidad), 0) AS cantidad_retornada,
  (se.cantidad - COALESCE(SUM(ee.cantidad), 0)) AS cantidad_pendiente,
  se.cerrada
FROM salida_equipos se
JOIN  equipos e        ON e.id  = se.equipo_id
LEFT JOIN frentes_trabajo ft ON ft.id = se.frente_trabajo_id
LEFT JOIN personas pe        ON pe.id = se.quien_entrega_id
LEFT JOIN personas pr        ON pr.id = se.quien_recibe_id
LEFT JOIN entrada_equipos ee ON ee.salida_equipo_id = se.id AND ee.tipo_entrada = 'RETORNO'
GROUP BY se.id, e.id, ft.id, pe.id, pr.id
ORDER BY e.nombre, se.fecha DESC;
