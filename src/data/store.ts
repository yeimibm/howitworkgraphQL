import type { AuthorRecord, BookRecord } from '../types/domain.js';

const seedAuthors: AuthorRecord[] = [
  { id: 'autor-1', nombre: 'Gabriel García Márquez', nacionalidad: 'Colombiana' },
  { id: 'autor-2', nombre: 'Isabel Allende', nacionalidad: 'Chilena' },
  { id: 'autor-3', nombre: 'George Orwell', nacionalidad: 'Británica' },
  { id: 'autor-4', nombre: 'Jane Austen', nacionalidad: 'Británica' },
  { id: 'autor-5', nombre: 'Julio Cortázar', nacionalidad: 'Argentina' }
];

const seedBooks: BookRecord[] = [
  { id: 'libro-1', titulo: 'Cien años de soledad', descripcion: 'Saga de la familia Buendía.', anioPublicacion: 1967, estado: 'DISPONIBLE', autorId: 'autor-1' },
  { id: 'libro-2', titulo: 'El amor en los tiempos del cólera', descripcion: null, anioPublicacion: 1985, estado: 'PRESTADO', autorId: 'autor-1' },
  { id: 'libro-3', titulo: 'Crónica de una muerte anunciada', descripcion: null, anioPublicacion: 1981, estado: 'MANTENIMIENTO', autorId: 'autor-1' },
  { id: 'libro-4', titulo: 'La casa de los espíritus', descripcion: 'Primera novela de Isabel Allende.', anioPublicacion: 1982, estado: 'DISPONIBLE', autorId: 'autor-2' },
  { id: 'libro-5', titulo: 'Eva Luna', descripcion: null, anioPublicacion: 1987, estado: 'PRESTADO', autorId: 'autor-2' },
  { id: 'libro-6', titulo: '1984', descripcion: 'Novela distópica.', anioPublicacion: 1949, estado: 'DISPONIBLE', autorId: 'autor-3' },
  { id: 'libro-7', titulo: 'Rebelión en la granja', descripcion: null, anioPublicacion: 1945, estado: 'PRESTADO', autorId: 'autor-3' },
  { id: 'libro-8', titulo: 'Orgullo y prejuicio', descripcion: null, anioPublicacion: 1813, estado: 'DISPONIBLE', autorId: 'autor-4' },
  { id: 'libro-9', titulo: 'Emma', descripcion: null, anioPublicacion: 1815, estado: 'MANTENIMIENTO', autorId: 'autor-4' },
  { id: 'libro-10', titulo: 'Sentido y sensibilidad', descripcion: null, anioPublicacion: 1811, estado: 'DISPONIBLE', autorId: 'autor-4' },
  { id: 'libro-11', titulo: 'Rayuela', descripcion: 'Novela de estructura no lineal.', anioPublicacion: 1963, estado: 'DISPONIBLE', autorId: 'autor-5' },
  { id: 'libro-12', titulo: 'Bestiario', descripcion: null, anioPublicacion: 1951, estado: 'PRESTADO', autorId: 'autor-5' }
];

export class LibraryStore {
  readonly authors: AuthorRecord[];
  readonly books: BookRecord[];
  private nextBookNumber: number;

  constructor(authors = seedAuthors, books = seedBooks) {
    this.authors = structuredClone(authors);
    this.books = structuredClone(books);
    this.nextBookNumber = this.books.reduce((max, book) => {
      const value = Number.parseInt(book.id.replace('libro-', ''), 10);
      return Number.isNaN(value) ? max : Math.max(max, value);
    }, 0) + 1;
  }

  generateBookId(): string {
    return `libro-${this.nextBookNumber++}`;
  }
}

export const store = new LibraryStore();
