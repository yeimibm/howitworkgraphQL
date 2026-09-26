import { and, count, eq, ilike, inArray } from 'drizzle-orm';
import type { AuthorRecord, BookFilterInput, BookRecord, BookStatus } from '../types/domain.js';
import type { Database } from './database.js';
import { authors, books } from './schema.js';

function bookRecord(row: typeof books.$inferSelect): BookRecord {
  return { id: String(row.id), titulo: row.titulo, descripcion: row.descripcion,
    anioPublicacion: row.anioPublicacion, estado: row.estado as BookStatus, autorId: String(row.autorId) };
}

function authorRecord(row: typeof authors.$inferSelect): AuthorRecord {
  return { id: String(row.id), nombre: row.nombre, nacionalidad: row.nacionalidad };
}

function numericId(id: string): number {
  return /^\d+$/.test(id) ? Number(id) : -1;
}

export interface BookRepository {
  findBook(id: string): Promise<BookRecord | null>;
  listBooks(filter: BookFilterInput | null | undefined, page: number, limit: number): Promise<{ items: BookRecord[]; totalItems: number }>;
  findAuthor(id: string): Promise<AuthorRecord | null>;
  findAuthors(ids: readonly string[]): Promise<AuthorRecord[]>;
  findBooksByAuthor(id: string): Promise<BookRecord[]>;
  createBook(book: Omit<BookRecord, 'id'>): Promise<BookRecord>;
  updateBook(id: string, changes: Partial<Omit<BookRecord, 'id' | 'autorId'>>): Promise<BookRecord | null>;
}

export class PostgresBookRepository implements BookRepository {
  constructor(private readonly db: Database) {}

  async findBook(id: string) {
    const [row] = await this.db.select().from(books).where(eq(books.id, numericId(id)));
    return row ? bookRecord(row) : null;
  }

  async listBooks(filter: BookFilterInput | null | undefined, page: number, limit: number) {
    const predicates = [];
    if (filter?.estado) predicates.push(eq(books.estado, filter.estado));
    if (filter?.autorId) predicates.push(eq(books.autorId, numericId(filter.autorId)));
    if (filter?.titulo?.trim()) predicates.push(ilike(books.titulo, `%${filter.titulo.trim().replace(/[\\%_]/g, '\\$&')}%`));
    const where = and(...predicates);
    const [rows, total] = await Promise.all([
      this.db.select().from(books).where(where).orderBy(books.id).limit(limit).offset((page - 1) * limit),
      this.db.select({ value: count() }).from(books).where(where)
    ]);
    return { items: rows.map(bookRecord), totalItems: total[0].value };
  }

  async findAuthor(id: string) {
    const [row] = await this.db.select().from(authors).where(eq(authors.id, numericId(id)));
    return row ? authorRecord(row) : null;
  }

  async findAuthors(ids: readonly string[]) {
    if (ids.length === 0) return [];
    const rows = await this.db.select().from(authors).where(inArray(authors.id, ids.map(numericId)));
    return rows.map(authorRecord);
  }

  async findBooksByAuthor(id: string) {
    const rows = await this.db.select().from(books).where(eq(books.autorId, numericId(id))).orderBy(books.id);
    return rows.map(bookRecord);
  }

  async createBook(book: Omit<BookRecord, 'id'>) {
    const [row] = await this.db.insert(books).values({ ...book, autorId: numericId(book.autorId) }).returning();
    return bookRecord(row);
  }

  async updateBook(id: string, changes: Partial<Omit<BookRecord, 'id' | 'autorId'>>) {
    const [row] = await this.db.update(books).set(changes).where(eq(books.id, numericId(id))).returning();
    return row ? bookRecord(row) : null;
  }
}
