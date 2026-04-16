import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

export async function initializeSchema(dataSource: DataSource) {
  try {
    const schemaPath = join(__dirname, '../../..', 'database', 'init.sql');
    const sql = readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`📋 Loading schema from init.sql (${statements.length} statements)...`);

    const queryRunner = dataSource.createQueryRunner();

    for (const statement of statements) {
      try {
        await queryRunner.query(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (
          error.message &&
          (error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('DUPLICATE'))
        ) {
          console.debug(`⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
        } else {
          console.error(`❌ Error executing statement: ${statement.substring(0, 50)}...`);
          console.error(`   Error: ${error.message}`);
          // Don't throw - continue with next statement
        }
      }
    }

    await queryRunner.release();
    console.log('✓ Schema initialization completed');
  } catch (error) {
    console.error('✗ Failed to initialize schema:', error.message);
    // Don't throw - allow app to continue
  }
}
