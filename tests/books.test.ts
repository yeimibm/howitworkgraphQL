import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLibraryYoga } from '../src/app.js';
import { LibraryStore } from '../src/data/store.js';

interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

const queries = {
  getBook: `query ObtenerLibro($id: ID!) {
    libro(id: $id) { id titulo estado autor { id nombre } }
  }`,
  list: `query ListarLibros($filtro: FiltroLibrosInput, $page: Int!, $limit: Int!) {
    libros(filtro: $filtro, page: $page, limit: $limit) {
      items { id titulo estado autor { id nombre } }
      pageInfo { page limit totalItems totalPages hasNextPage hasPreviousPage }
    }
  }`,
  create: `mutation CrearNuevoLibro($input: CrearLibroInput!) {
    crearLibro(input: $input) { id titulo descripcion anioPublicacion estado autor { nombre } }
  }`,
  update: `mutation ActualizarLibro($id: ID!, $input: ActualizarLibroInput!) {
    actualizarLibro(id: $id, input: $input) { id titulo descripcion anioPublicacion estado }
  }`
};

describe('Biblioteca GraphQL', () => {
  let store: LibraryStore;
  let batches: string[][];
  let yoga: ReturnType<typeof createLibraryYoga>;

  beforeEach(() => {
    store = new LibraryStore();
    batches = [];
    yoga = createLibraryYoga({ store, onAuthorBatch: (ids) => batches.push([...ids]) });
  });

  async function execute(query: string, variables: Record<string, unknown>): Promise<GraphQLResponse> {
    const response = await yoga.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    return response.json() as Promise<GraphQLResponse>;
  }

  it('consulta un libro existente y resuelve su autor', async () => {
    const result = await execute(queries.getBook, { id: 'libro-1' });
    expect(result.errors).toBeUndefined();
    expect(result.data?.libro).toMatchObject({
      id: 'libro-1', titulo: 'Cien años de soledad', autor: { id: 'autor-1', nombre: 'Gabriel García Márquez' }
    });
  });

  it('devuelve NOT_FOUND para un libro inexistente sin stack trace', async () => {
    const result = await execute(queries.getBook, { id: 'inexistente' });
    expect(result.data?.libro).toBeNull();
    expect(result.errors?.[0]).toEqual({ message: 'Libro no encontrado', locations: expect.any(Array), path: ['libro'], extensions: { code: 'NOT_FOUND' } });
    expect(JSON.stringify(result)).not.toContain('stack');
  });

  it('lista libros con metadatos de paginación', async () => {
    const result = await execute(queries.list, { filtro: null, page: 1, limit: 5 });
    expect(result.data?.libros.items).toHaveLength(5);
    expect(result.data?.libros.pageInfo).toEqual({ page: 1, limit: 5, totalItems: 12, totalPages: 3, hasNextPage: true, hasPreviousPage: false });
  });

  it('filtra por estado', async () => {
    const result = await execute(queries.list, { filtro: { estado: 'MANTENIMIENTO' }, page: 1, limit: 20 });
    expect(result.data?.libros.items).toHaveLength(2);
    expect(result.data?.libros.items.every((book: { estado: string }) => book.estado === 'MANTENIMIENTO')).toBe(true);
  });

  it('filtra por autor y título parcial sin distinguir mayúsculas', async () => {
    const result = await execute(queries.list, { filtro: { autorId: 'autor-3', titulo: 'REBELIÓN' }, page: 1, limit: 10 });
    expect(result.data?.libros.items.map((book: { id: string }) => book.id)).toEqual(['libro-7']);
  });

  it('devuelve la segunda página correcta', async () => {
    const result = await execute(queries.list, { filtro: null, page: 2, limit: 5 });
    expect(result.data?.libros.items.map((book: { id: string }) => book.id)).toEqual(['libro-6', 'libro-7', 'libro-8', 'libro-9', 'libro-10']);
    expect(result.data?.libros.pageInfo.hasPreviousPage).toBe(true);
  });

  it('rechaza limit mayor que 20', async () => {
    const result = await execute(queries.list, { filtro: null, page: 1, limit: 21 });
    expect(result.data).toBeNull();
    expect(result.errors?.[0]).toMatchObject({ message: 'El límite máximo permitido es 20', extensions: { code: 'BAD_USER_INPUT' } });
  });

  it('crea un libro, recorta el título y asigna DISPONIBLE', async () => {
    const result = await execute(queries.create, { input: { titulo: '  Pedro Páramo  ', descripcion: 'Novela mexicana', anioPublicacion: 1955, autorId: 'autor-1' } });
    expect(result.errors).toBeUndefined();
    expect(result.data?.crearLibro).toMatchObject({ id: 'libro-13', titulo: 'Pedro Páramo', estado: 'DISPONIBLE', autor: { nombre: 'Gabriel García Márquez' } });
    expect(store.books).toHaveLength(13);
  });

  it('rechaza título y año inválidos con BAD_USER_INPUT', async () => {
    const invalidTitle = await execute(queries.create, { input: { titulo: ' ', autorId: 'autor-1' } });
    expect(invalidTitle.errors?.[0]).toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } });
    const futureYear = new Date().getFullYear() + 1;
    const invalidYear = await execute(queries.create, { input: { titulo: 'Libro válido', anioPublicacion: futureYear, autorId: 'autor-1' } });
    expect(invalidYear.errors?.[0]).toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } });
  });

  it('rechaza la creación con autor inexistente', async () => {
    const result = await execute(queries.create, { input: { titulo: 'Libro válido', autorId: 'autor-999' } });
    expect(result.errors?.[0]).toMatchObject({ message: 'El autor indicado no existe', extensions: { code: 'BAD_USER_INPUT' } });
  });

  it('actualiza parcialmente un libro', async () => {
    const result = await execute(queries.update, { id: 'libro-2', input: { titulo: 'Título actualizado', descripcion: 'Nueva descripción' } });
    expect(result.data?.actualizarLibro).toMatchObject({ id: 'libro-2', titulo: 'Título actualizado', descripcion: 'Nueva descripción', estado: 'PRESTADO' });
  });

  it('cambia el estado a PRESTADO', async () => {
    const result = await execute(queries.update, { id: 'libro-1', input: { estado: 'PRESTADO' } });
    expect(result.data?.actualizarLibro.estado).toBe('PRESTADO');
  });

  it('devuelve NOT_FOUND al actualizar un libro inexistente', async () => {
    const result = await execute(queries.update, { id: 'libro-999', input: { estado: 'PRESTADO' } });
    expect(result.errors?.[0]).toMatchObject({ message: 'Libro no encontrado', extensions: { code: 'NOT_FOUND' } });
  });

  it('agrupa autores únicos en un solo batch por request', async () => {
    const result = await execute(queries.list, { filtro: null, page: 1, limit: 10 });
    expect(result.errors).toBeUndefined();
    expect(batches).toEqual([['autor-1', 'autor-2', 'autor-3', 'autor-4']]);
  });

  it('crea un DataLoader nuevo en cada request', async () => {
    await execute(queries.getBook, { id: 'libro-1' });
    await execute(queries.getBook, { id: 'libro-1' });
    expect(batches).toEqual([['autor-1'], ['autor-1']]);
  });
});
