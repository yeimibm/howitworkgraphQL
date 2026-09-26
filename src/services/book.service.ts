import type { BookRepository } from '../data/book.repository.js';
import { badUserInput, notFound } from '../errors/graphql-errors.js';
import type { BookFilterInput, BookRecord, CreateBookInput, UpdateBookInput } from '../types/domain.js';
import { validatePagination, validatePublicationYear, validateTitle } from '../validation/book.validation.js';

export class BookService {
  constructor(private readonly repository: BookRepository) {}

  async getById(id: string) {
    const book = await this.repository.findBook(id);
    if (!book) throw notFound('Libro no encontrado');
    return book;
  }

  async list(filter: BookFilterInput | null | undefined, page: number, limit: number) {
    validatePagination(page, limit);
    const { items, totalItems } = await this.repository.listBooks(filter, page, limit);
    const totalPages = Math.ceil(totalItems / limit);
    return { items, pageInfo: { page, limit, totalItems, totalPages,
      hasNextPage: page < totalPages, hasPreviousPage: page > 1 && totalPages > 0 } };
  }

  async create(input: CreateBookInput) {
    const titulo = validateTitle(input.titulo);
    const anioPublicacion = validatePublicationYear(input.anioPublicacion);
    if (!await this.repository.findAuthor(input.autorId)) throw badUserInput('El autor indicado no existe');
    return this.repository.createBook({ titulo, descripcion: input.descripcion ?? null,
      anioPublicacion, estado: 'DISPONIBLE', autorId: input.autorId });
  }

  async update(id: string, input: UpdateBookInput) {
    await this.getById(id);
    const changes: Partial<Pick<BookRecord, 'titulo' | 'descripcion' | 'anioPublicacion' | 'estado'>> = {};
    if (input.titulo !== undefined) {
      if (input.titulo === null) throw badUserInput('El título no puede ser nulo');
      changes.titulo = validateTitle(input.titulo);
    }
    if (input.descripcion !== undefined) changes.descripcion = input.descripcion;
    if (input.anioPublicacion !== undefined) changes.anioPublicacion = validatePublicationYear(input.anioPublicacion);
    if (input.estado !== undefined && input.estado !== null) changes.estado = input.estado;
    if (Object.keys(changes).length === 0) return this.getById(id);
    const book = await this.repository.updateBook(id, changes);
    if (!book) throw notFound('Libro no encontrado');
    return book;
  }
}
