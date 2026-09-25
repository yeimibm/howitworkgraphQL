# Biblioteca GraphQL

API de biblioteca con TypeScript, GraphQL Yoga, Drizzle ORM y PostgreSQL. Las consultas y mutations usan la misma persistencia PostgreSQL; las pruebas unitarias validan reglas sin servicios externos y las pruebas de integración crean una base temporal con Testcontainers.

## Reproducir localmente

Se requiere Node.js 20 o posterior y Docker con el daemon activo. Instalar dependencias y levantar PostgreSQL:

```bash
npm ci
docker compose -f docker/docker-compose.yml up -d
npm run db:migrate
npm run dev
```

La conexión predeterminada es `postgres://postgres:postgres@localhost:5432/library`. Se puede reemplazar mediante `DATABASE_URL`. `db:migrate` aplica las migraciones pendientes y carga los datos de ejemplo de forma idempotente.

GraphiQL queda disponible en `http://localhost:4000/graphql`. Para ejecutar el código compilado:

```bash
npm run build
npm start
```

La migración de datos de ejemplo carga cinco autores y doce libros. `crearLibro` requiere un autor existente; usar un ID retornado por la base para `autorId`.

## Pruebas

```bash
npm run test:unit
npm run test:integration
```

`test:unit` usa Vitest sin conectarse a PostgreSQL. `test:integration` usa Vitest y Testcontainers: inicia PostgreSQL temporal, aplica las migraciones, comprueba escritura, lectura e integridad con el código real de persistencia y libera los recursos al terminar. Requiere Docker activo, pero no requiere levantar el servicio de Docker Compose ni usa la base de desarrollo. Ambos comandos terminan automáticamente, sin modo de observación.

El workflow [`.github/workflows/tests.yml`](.github/workflows/tests.yml) ejecuta las dos suites en pasos separados ante `push` y `pull_request`. GitHub Actions usa un runner Ubuntu con Docker disponible, instala dependencias con `npm ci` y falla si cualquiera de las suites falla.

## Flujo y reglas de la aplicación

Las operaciones GraphQL entran por Yoga y sus resolvers. `BookService` valida las entradas y ejecuta los casos de uso mediante la capa de persistencia de Drizzle. PostgreSQL conserva autores y libros. Cada request crea un DataLoader para resolver `Libro.autor` por lotes y evitar consultas independientes por cada libro.

- `libro(id)` recupera un libro o devuelve `NOT_FOUND`.
- `libros(filtro, page, limit)` permite filtrar por estado, autor y parte del título; devuelve elementos y metadatos de paginación.
- `crearLibro(input)` comprueba que el autor exista, recorta el título y crea el libro en estado `DISPONIBLE`.
- `actualizarLibro(id, input)` modifica solo los campos proporcionados; un libro inexistente devuelve `NOT_FOUND`.
- El título debe tener entre 2 y 150 caracteres tras recortarlo.
- El año de publicación puede ser nulo; si se proporciona, debe ser un entero entre 1000 y el año actual.
- `page` debe ser un entero desde 1 y `limit` un entero entre 1 y 20.
- La creación con un autor inexistente y las entradas inválidas devuelven `BAD_USER_INPUT`.

Los estados permitidos son `DISPONIBLE`, `PRESTADO` y `MANTENIMIENTO`. La relación entre libros y autores y el estado permitido también están protegidos por restricciones de PostgreSQL.

## Operaciones GraphQL

El esquema está en [`src/schema/schema.graphql`](src/schema/schema.graphql). Las operaciones con variables están en [`graphql/operations.graphql`](graphql/operations.graphql) y [`graphql/variables/`](graphql/variables/). Copiar una operación en GraphiQL y colocar el JSON correspondiente en el panel **Variables**. Los IDs públicos son cadenas que representan los identificadores numéricos de PostgreSQL.

## Migraciones y configuración

Las migraciones SQL están en [`migrations/`](migrations/) y se aplican mediante `npm run db:migrate` a la base configurada por `DATABASE_URL`. El migrador lleva un registro de las migraciones aplicadas, por lo que el comando puede repetirse. Las pruebas de integración lo aplican a su propia base temporal. La base local de Docker Compose se configura en [`docker/docker-compose.yml`](docker/docker-compose.yml); levantarla no sustituye el paso de migración.
