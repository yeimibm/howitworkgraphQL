import DataLoader from 'dataloader';
import type { BookRepository } from '../data/book.repository.js';
import type { AuthorRecord } from '../types/domain.js';

export type BatchLogger = (authorIds: readonly string[]) => void;

export function createAuthorLoader(repository: BookRepository, onBatch: BatchLogger): DataLoader<string, AuthorRecord> {
  return new DataLoader(async (ids) => {
    const uniqueIds = [...new Set(ids)];
    onBatch(uniqueIds);
    const authors = new Map((await repository.findAuthors(uniqueIds)).map((author) => [author.id, author]));
    return ids.map((id) => authors.get(id) ?? new Error(`Autor no encontrado: ${id}`));
  });
}
