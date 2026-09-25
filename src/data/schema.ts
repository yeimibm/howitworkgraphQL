import { check, integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const authors = pgTable('authors', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  nacionalidad: varchar('nacionalidad', { length: 100 })
});

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 150 }).notNull(),
  descripcion: text('descripcion'),
  anioPublicacion: integer('anio_publicacion'),
  estado: varchar('estado', { length: 30 }).notNull(),
  autorId: integer('autor_id').notNull().references(() => authors.id, { onDelete: 'restrict', onUpdate: 'cascade' })
}, (table) => [check('books_estado_check', sql`${table.estado} IN ('DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO')`)]);
