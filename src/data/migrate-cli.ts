import { createDatabase } from './database.js';
import { applyMigrations } from './migrate.js';

const { pool } = createDatabase(process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/library');
try {
  await applyMigrations(pool);
} finally {
  await pool.end();
}
