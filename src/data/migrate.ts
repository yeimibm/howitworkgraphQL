import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type pg from 'pg';

export async function applyMigrations(pool: pg.Pool, directory = resolve(process.cwd(), 'migrations')) {
  const client = await pool.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
    for (const name of (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()) {
      await client.query('BEGIN');
      try {
        const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
        if (applied.rowCount === 0) {
          await client.query(await readFile(resolve(directory, name), 'utf8'));
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
  }
}
