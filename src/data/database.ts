import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export function createDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString });
  return { db: drizzle(pool), pool };
}

export type Database = ReturnType<typeof createDatabase>['db'];
