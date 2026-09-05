import { badUserInput } from '../errors/graphql-errors.js';

export function validateTitle(value: string): string {
  const title = value.trim();
  if (title.length < 2 || title.length > 150) {
    throw badUserInput('El título debe tener entre 2 y 150 caracteres');
  }
  return title;
}

export function validatePublicationYear(value: number | null | undefined): number | null {
  if (value == null) return null;
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(value) || value < 1000 || value > currentYear) {
    throw badUserInput(`El año de publicación debe estar entre 1000 y ${currentYear}`);
  }
  return value;
}

export function validatePagination(page: number, limit: number): void {
  if (!Number.isInteger(page) || page < 1) {
    throw badUserInput('La página debe ser un entero mayor o igual a 1');
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw badUserInput('El límite debe ser un entero mayor o igual a 1');
  }
  if (limit > 20) {
    throw badUserInput('El límite máximo permitido es 20');
  }
}
