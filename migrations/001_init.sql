CREATE TABLE authors (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nacionalidad VARCHAR(100)
);

CREATE TABLE books (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    anio_publicacion INTEGER,

    estado VARCHAR(30) NOT NULL
        CHECK (
            estado IN (
                'DISPONIBLE',
                'PRESTADO',
                'MANTENIMIENTO'
            )
        ),

    autor_id INTEGER NOT NULL,

    CONSTRAINT fk_books_authors
        FOREIGN KEY (autor_id)
        REFERENCES authors(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
