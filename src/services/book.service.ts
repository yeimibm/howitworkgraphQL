import type { LibraryStore } from '../data/store.js';
import { badUserInput, notFound } from '../errors/graphql-errors.js';
import type { BookFilterInput, BookRecord, CreateBookInput, UpdateBookInput } from '../types/domain.js';
import { validatePagination, validatePublicationYear, validateTitle } from '../validation/book.validation.js';

export class BookService {
  constructor(private readonly store: LibraryStore) {}

  getById(id: string): BookRecord {
    const book = this.store.books.find((item) => item.id === id);
    if (!book) throw notFound('Libro no encontrado');
    return book;
  }

  list(filter: BookFilterInput | null | undefined, page: number, limit: number) {
    validatePagination(page, limit);
    const title = filter?.titulo?.trim().toLocaleLowerCase('es') ?? null;
    const filtered = this.store.books.filter((book) =>
      (!filter?.estado || book.estado === filter.estado) &&
      (!filter?.autorId || book.autorId === filter.autorId) &&
      (!title || book.titulo.toLocaleLowerCase('es').includes(title))
    );
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit);
    const start = (page - 1) * limit;
    return {
      items: filtered.slice(start, start + limit),
      pageInfo: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0
      }
    };
  }

  create(input: CreateBookInput): BookRecord {
    const authorExists = this.store.authors.some((author) => author.id === input.autorId);
    if (!authorExists) throw badUserInput('El autor indicado no existe');
    const book: BookRecord = {
      id: this.store.generateBookId(),
      titulo: validateTitle(input.titulo),
      descripcion: input.descripcion ?? null,
      anioPublicacion: validatePublicationYear(input.anioPublicacion),
      estado: 'DISPONIBLE',
      autorId: input.autorId
    };
    this.store.books.push(book);
    return book;
  }

  update(id: string, input: UpdateBookInput): BookRecord {
    const book = this.getById(id);
    if (input.titulo !== undefined) {
      if (input.titulo === null) throw badUserInput('El título no puede ser nulo');
      book.titulo = validateTitle(input.titulo);
    }
    if (input.descripcion !== undefined) book.descripcion = input.descripcion;
    if (input.anioPublicacion !== undefined) book.anioPublicacion = validatePublicationYear(input.anioPublicacion);
    if (input.estado !== undefined && input.estado !== null) book.estado = input.estado;
    return book;
  }
}
