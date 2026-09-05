import DataLoader from 'dataloader';
import type { LibraryStore } from '../data/store.js';
import type { AuthorRecord } from '../types/domain.js';

export type BatchLogger = (authorIds: readonly string[]) => void;

export function createAuthorLoader(store: LibraryStore, onBatch: BatchLogger): DataLoader<string, AuthorRecord> {
  return new DataLoader(async (ids) => {
    const uniqueIds = [...new Set(ids)];
    onBatch(uniqueIds);
    const authors = new Map(
      store.authors.filter((author) => uniqueIds.includes(author.id)).map((author) => [author.id, author])
    );
    return ids.map((id) => authors.get(id) ?? new Error(`Autor no encontrado: ${id}`));
  });
}
