import { describe, expect, it, vi } from 'vitest';
import type { BookRepository } from '../../src/data/book.repository.js';
import { BookService } from '../../src/services/book.service.js';
import type { AuthorRecord, BookRecord } from '../../src/types/domain.js';

const author: AuthorRecord = { id: '1', nombre: 'Autora', nacionalidad: null };
const book: BookRecord = { id: '1', titulo: 'Libro válido', descripcion: null, anioPublicacion: null,
  estado: 'DISPONIBLE', autorId: '1' };

function fixture() {
  const repository: BookRepository = {
    findBook: vi.fn(async (id) => id === '1' ? book : null),
    listBooks: vi.fn(async () => ({ items: [book], totalItems: 1 })),
    findAuthor: vi.fn(async (id) => id === '1' ? author : null),
    findAuthors: vi.fn(async () => [author]),
    findBooksByAuthor: vi.fn(async () => [book]),
    createBook: vi.fn(async (input) => ({ ...input, id: '2' })),
    updateBook: vi.fn(async (_id, changes) => ({ ...book, ...changes }))
  };
  return { repository, service: new BookService(repository) };
}

describe('BookService business rules without PostgreSQL', () => {
  it('creates a book with a trimmed two-character title and the default status', async () => {
    // Arrange
    const { service, repository } = fixture();
    // Act
    const created = await service.create({ titulo: '  AB  ', autorId: '1', anioPublicacion: 1000 });
    // Assert
    expect(created).toMatchObject({ id: '2', titulo: 'AB', anioPublicacion: 1000, estado: 'DISPONIBLE' });
    expect(repository.createBook).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'AB', descripcion: null }));
  });

  it('rejects a 151-character title before writing', async () => {
    const { service, repository } = fixture();
    await expect(service.create({ titulo: 'A'.repeat(151), autorId: '1' })).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' }
    });
    expect(repository.createBook).not.toHaveBeenCalled();
  });

  it('rejects a future publication year before writing', async () => {
    const { service, repository } = fixture();
    await expect(service.create({ titulo: 'Valid book', autorId: '1', anioPublicacion: new Date().getFullYear() + 1 }))
      .rejects.toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } });
    expect(repository.createBook).not.toHaveBeenCalled();
  });

  it('rejects an unknown author without creating a book', async () => {
    const { service, repository } = fixture();
    await expect(service.create({ titulo: 'Valid book', autorId: '999' })).rejects.toMatchObject({
      message: 'El autor indicado no existe', extensions: { code: 'BAD_USER_INPUT' }
    });
    expect(repository.createBook).not.toHaveBeenCalled();
  });

  it('computes pagination boundaries from repository totals', async () => {
    const { service, repository } = fixture();
    vi.mocked(repository.listBooks).mockResolvedValue({ items: [book], totalItems: 21 });
    const result = await service.list(null, 2, 20);
    expect(result.pageInfo).toEqual({ page: 2, limit: 20, totalItems: 21, totalPages: 2,
      hasNextPage: false, hasPreviousPage: true });
  });

  it('rejects pagination limits above 20 before querying', async () => {
    const { service, repository } = fixture();
    await expect(service.list(null, 1, 21)).rejects.toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } });
    expect(repository.listBooks).not.toHaveBeenCalled();
  });

  it('rejects a null title when updating and preserves persistence', async () => {
    const { service, repository } = fixture();
    await expect(service.update('1', { titulo: null })).rejects.toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } });
    expect(repository.updateBook).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND for an absent book', async () => {
    const { service } = fixture();
    await expect(service.getById('999')).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
  });
});
