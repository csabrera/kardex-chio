import { DataSource } from 'typeorm';

export async function initializeDatabase(dataSource: DataSource) {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const queryRunner = dataSource.createQueryRunner();

  try {
    // Verificar si las tablas ya existen
    const tableExists = await queryRunner.hasTable('usuarios');

    if (tableExists) {
      console.log('✓ Database already initialized');
      return;
    }

    console.log('🔄 Initializing database...');

    // Crear extensión UUID
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Crear ENUMs
    await queryRunner.query(`CREATE TYPE user_role AS ENUM ('ADMIN', 'ALMACENERO', 'SUPERVISOR')`);
    await queryRunner.query(`CREATE TYPE tipo_documento AS ENUM ('DNI', 'CE', 'PASAPORTE')`);
    await queryRunner.query(`CREATE TYPE equipo_estado AS ENUM ('EN_ALMACEN', 'SALIDA', 'INGRESO')`);
    await queryRunner.query(`CREATE TYPE persona_tipo AS ENUM ('PROVEEDOR', 'TRABAJADOR', 'TRANSPORTISTA')`);
    await queryRunner.query(`CREATE TYPE movimiento_tipo AS ENUM ('ENTRADA', 'SALIDA', 'SALIDA_EQUIPO', 'ENTRADA_EQUIPO')`);

    // Crear tablas (basadas en entities de TypeORM)
    // Las tablas se crearán automáticamente por TypeORM synchronize

    // Insertar datos iniciales
    await queryRunner.query(`
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
        ('Equipos')
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
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
        ('PLG', 'Pliego')
      ON CONFLICT DO NOTHING
    `);

    // Usuario admin (password: 00000000)
    await queryRunner.query(`
      INSERT INTO usuarios (tipo_documento, documento, password, rol, primer_inicio, nombre, apellido_paterno, apellido_materno)
      VALUES ('DNI', '00000000', '$2b$10$N1GIjsmwKS/j2bJRWFhJoeudFOIZk16oCamYleYr1qKOODOTYJ1cO', 'ADMIN', FALSE, 'Administrador', 'Sistema', 'Admin')
      ON CONFLICT (documento) DO NOTHING
    `);

    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    // No lanzar error para permitir que continúe el startup
  } finally {
    await queryRunner.release();
  }
}
