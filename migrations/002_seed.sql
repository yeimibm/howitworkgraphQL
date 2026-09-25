INSERT INTO authors (nombre, nacionalidad) VALUES
  ('Gabriel García Márquez', 'Colombiana'),
  ('Isabel Allende', 'Chilena'),
  ('George Orwell', 'Británica'),
  ('Jane Austen', 'Británica'),
  ('Julio Cortázar', 'Argentina');

INSERT INTO books (titulo, descripcion, anio_publicacion, estado, autor_id) VALUES
  ('Cien años de soledad', 'Saga de la familia Buendía.', 1967, 'DISPONIBLE', 1),
  ('El amor en los tiempos del cólera', NULL, 1985, 'PRESTADO', 1),
  ('Crónica de una muerte anunciada', NULL, 1981, 'MANTENIMIENTO', 1),
  ('La casa de los espíritus', 'Primera novela de Isabel Allende.', 1982, 'DISPONIBLE', 2),
  ('Eva Luna', NULL, 1987, 'PRESTADO', 2),
  ('1984', 'Novela distópica.', 1949, 'DISPONIBLE', 3),
  ('Rebelión en la granja', NULL, 1945, 'PRESTADO', 3),
  ('Orgullo y prejuicio', NULL, 1813, 'DISPONIBLE', 4),
  ('Emma', NULL, 1815, 'MANTENIMIENTO', 4),
  ('Sentido y sensibilidad', NULL, 1811, 'DISPONIBLE', 4),
  ('Rayuela', 'Novela de estructura no lineal.', 1963, 'DISPONIBLE', 5),
  ('Bestiario', NULL, 1951, 'PRESTADO', 5);
