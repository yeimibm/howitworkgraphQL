export const BOOK_STATUSES = ['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO'] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number];

export interface AuthorRecord {
  id: string;
  nombre: string;
  nacionalidad: string | null;
}

export interface BookRecord {
  id: string;
  titulo: string;
  descripcion: string | null;
  anioPublicacion: number | null;
  estado: BookStatus;
  autorId: string;
}

export interface CreateBookInput {
  titulo: string;
  descripcion?: string | null;
  anioPublicacion?: number | null;
  autorId: string;
}

export interface UpdateBookInput {
  titulo?: string | null;
  descripcion?: string | null;
  anioPublicacion?: number | null;
  estado?: BookStatus | null;
}

export interface BookFilterInput {
  estado?: BookStatus | null;
  autorId?: string | null;
  titulo?: string | null;
}
