import type DataLoader from 'dataloader';
import type { LibraryStore } from '../data/store.js';
import type { AuthorRecord, BookFilterInput, BookRecord, CreateBookInput, UpdateBookInput } from '../types/domain.js';
import type { BookService } from '../services/book.service.js';

export interface GraphQLContext {
  store: LibraryStore;
  bookService: BookService;
  authorsById: DataLoader<string, AuthorRecord>;
}

export const resolvers = {
  Query: {
    libro: (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => context.bookService.getById(id),
    libros: (
      _parent: unknown,
      { filtro, page, limit }: { filtro?: BookFilterInput | null; page: number; limit: number },
      context: GraphQLContext
    ) => context.bookService.list(filtro, page, limit)
  },
  Mutation: {
    crearLibro: (_parent: unknown, { input }: { input: CreateBookInput }, context: GraphQLContext) =>
      context.bookService.create(input),
    actualizarLibro: (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateBookInput },
      context: GraphQLContext
    ) => context.bookService.update(id, input)
  },
  Libro: {
    autor: (book: BookRecord, _args: unknown, context: GraphQLContext) => context.authorsById.load(book.autorId)
  },
  Autor: {
    libros: (author: AuthorRecord, _args: unknown, context: GraphQLContext) =>
      context.store.books.filter((book) => book.autorId === author.id)
  }
};
