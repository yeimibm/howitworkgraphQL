import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLError } from 'graphql';
import { createYoga } from 'graphql-yoga';
import { LibraryStore } from './data/store.js';
import { createAuthorLoader, type BatchLogger } from './loaders/author.loader.js';
import { resolvers } from './schema/resolvers.js';
import { BookService } from './services/book.service.js';

const typeDefs = readFileSync(fileURLToPath(new URL('./schema/schema.graphql', import.meta.url)), 'utf8');
const schema = makeExecutableSchema({ typeDefs, resolvers });
const publicErrorCodes = new Set(['BAD_USER_INPUT', 'NOT_FOUND']);

function maskInternalError(error: unknown, message: string): Error {
  // GraphQL Tools can wrap resolver errors across package boundaries, so use the
  // serialized GraphQLError contract instead of relying only on instanceof.
  if (
    error instanceof Error &&
    'extensions' in error &&
    typeof error.extensions === 'object' &&
    error.extensions !== null &&
    publicErrorCodes.has(String((error.extensions as Record<string, unknown>).code))
  ) {
    return error;
  }
  return new GraphQLError(message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
}

export interface AppOptions {
  store?: LibraryStore;
  onAuthorBatch?: BatchLogger;
}

export function createLibraryYoga(options: AppOptions = {}) {
  const libraryStore = options.store ?? new LibraryStore();
  const onAuthorBatch = options.onAuthorBatch ?? ((ids: readonly string[]) => {
    console.info(`[AuthorLoader] batch requested: ${JSON.stringify(ids)}`);
  });

  return createYoga({
    schema,
    graphqlEndpoint: '/graphql',
    landingPage: false,
    logging: false,
    maskedErrors: {
      errorMessage: 'Error interno del servidor',
      maskError: maskInternalError
    },
    context: () => ({
      store: libraryStore,
      bookService: new BookService(libraryStore),
      authorsById: createAuthorLoader(libraryStore, onAuthorBatch)
    })
  });
}
