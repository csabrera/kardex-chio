const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:GsyJzNPCu0BFzVyNAVTFuukNBHlVQqT@postgres.railway.internal:5432/railway';

async function loadSchema() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('✓ Conectado');

    const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Ejecutando schema SQL...');
    await client.query(sql);
    console.log('✓ Schema cargado exitosamente');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

loadSchema();
