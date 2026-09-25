import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createDatabase, type Database } from '../../src/data/database.js';
import { applyMigrations } from '../../src/data/migrate.js';
import { PostgresBookRepository } from '../../src/data/book.repository.js';
import { BookService } from '../../src/services/book.service.js';
import { authors, books } from '../../src/data/schema.js';
import type pg from 'pg';
import { createLibraryYoga } from '../../src/app.js';

describe('PostgreSQL persistence with Testcontainers', () => {
  let container: StartedPostgreSqlContainer;
  let pool: pg.Pool;
  let db: Database;
  let repository: PostgresBookRepository;
  let service: BookService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    ({ db, pool } = createDatabase(container.getConnectionUri()));
    await applyMigrations(pool);
    repository = new PostgresBookRepository(db);
    service = new BookService(repository);
  }, 120_000);

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE books, authors RESTART IDENTITY CASCADE');
    await db.insert(authors).values({ nombre: 'Test Author', nacionalidad: null });
  });

  afterAll(async () => {
    if (pool) await pool.end();
    if (container) await container.stop();
  }, 60_000);

  it('writes a book through the service and reads it back through the real repository', async () => {
    // Arrange
    const input = { titulo: '  Persistent book  ', autorId: '1', anioPublicacion: 2020 };
    // Act
    const created = await service.create(input);
    const loaded = await repository.findBook(created.id);
    // Assert
    expect(loaded).toEqual({ id: created.id, titulo: 'Persistent book', descripcion: null,
      anioPublicacion: 2020, estado: 'DISPONIBLE', autorId: '1' });
  });

  it('enforces the foreign key when writing through the real repository', async () => {
    await expect(repository.createBook({ titulo: 'Orphan book', descripcion: null, anioPublicacion: null,
      estado: 'DISPONIBLE', autorId: '999' })).rejects.toMatchObject({ cause: { code: '23503' } });
    expect(await db.select().from(books)).toHaveLength(0);
  });

  it('keeps data isolated and supports filtering and partial updates', async () => {
    const created = await service.create({ titulo: 'Another Book', autorId: '1' });
    await service.update(created.id, { estado: 'PRESTADO' });
    const result = await service.list({ estado: 'PRESTADO', titulo: 'another' }, 1, 20);
    expect(result.items).toMatchObject([{ id: created.id, estado: 'PRESTADO' }]);
    expect(result.pageInfo.totalItems).toBe(1);
  });

  it('resolves GraphQL mutations and relations through the PostgreSQL repository', async () => {
    const yoga = createLibraryYoga({ repository, onAuthorBatch: () => undefined });
    const response = await yoga.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `mutation {
        crearLibro(input: { titulo: "GraphQL book", autorId: "1" }) {
          id titulo autor { id nombre libros { titulo } }
        }
      }` })
    });
    const result = await response.json() as { data?: { crearLibro: { titulo: string; autor: {
      id: string; nombre: string; libros: Array<{ titulo: string }> } } }; errors?: unknown[] };
    expect(result.errors).toBeUndefined();
    expect(result.data?.crearLibro).toMatchObject({ titulo: 'GraphQL book', autor: {
      id: '1', nombre: 'Test Author', libros: [{ titulo: 'GraphQL book' }] } });
  });
});
