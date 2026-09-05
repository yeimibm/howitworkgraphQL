# Biblioteca GraphQL

Ejemplo Academico de como es utilizado GraphQL para la optimizacion de consultas.

## Tecnologías y estructura

- Node.js 20+, TypeScript estricto y módulos ESM.
- GraphQL Yoga 5, esquema definido con SDL y `@graphql-tools/schema`.
- DataLoader creado por request para resolver `Libro.autor` por lotes.
- Almacenamiento volátil en memoria: 5 autores y 12 libros iniciales.
- Vitest para pruebas de integración sobre el servidor Yoga real.

```text
src/
├── app.ts                    # fábrica de Yoga y contexto por request
├── server.ts                 # servidor HTTP
├── data/store.ts             # datos iniciales y almacenamiento
├── errors/graphql-errors.ts  # errores públicos controlados
├── loaders/author.loader.ts  # batch loader de autores
├── schema/                   # SDL y resolvers
├── services/book.service.ts  # casos de uso
├── types/domain.ts           # modelo interno
└── validation/               # reglas de entrada
graphql/                      # operaciones nombradas y variables
tests/books.test.ts           # pruebas de integración
```

## Instalación y ejecución

```bash
npm install
npm run dev
```

El endpoint queda disponible en `http://localhost:4000/graphql`. Abrir esa URL en el navegador muestra GraphiQL. Para una ejecución compilada:

```bash
npm run build
npm start
```

## Esquema y nulabilidad

El SDL público está en `src/schema/schema.graphql`. `Libro` expone `id`, `titulo`, `descripcion`, `anioPublicacion`, `estado` y `autor`; `Autor` expone `id`, `nombre`, `nacionalidad` y `libros`. La estructura interna `autorId` no se filtra al esquema público.

La nulabilidad es deliberada: identificadores, nombres, títulos, estados y relaciones requeridas nunca son nulos. `Autor.libros` siempre es una lista, incluso vacía. La descripción, año de publicación y nacionalidad aceptan ausencia porque esos datos pueden desconocerse.

`EstadoLibro` restringe el estado a `DISPONIBLE`, `PRESTADO` o `MANTENIMIENTO`. Las mutations usan inputs independientes (`CrearLibroInput` y `ActualizarLibroInput`), y `FiltroLibrosInput` acepta estado, autor y coincidencia parcial de título.

## Operaciones

Las operaciones reproducibles están en `graphql/operations.graphql` y sus variables en `graphql/variables/`. Todas tienen nombre y reciben valores mediante variables. En GraphiQL, copiar una operación y colocar el JSON correspondiente en el panel **Variables**.

Queries:

- `libro(id: ID!): Libro`: devuelve un libro o el error `NOT_FOUND`.
- `libros(filtro, page, limit): LibroConnection!`: lista elementos y metadatos (`totalItems`, `totalPages`, navegación).

Mutations:

- `crearLibro(input)`: valida, genera el ID y establece `DISPONIBLE`.
- `actualizarLibro(id, input)`: modifica título, descripción, año o estado de forma parcial.



## Validaciones, seguridad y errores

- Título recortado, entre 2 y 150 caracteres.
- Año entero entre 1000 y el año actual; puede ser nulo.
- El autor debe existir. Para creación se considera entrada inválida y devuelve `BAD_USER_INPUT`.
- `page` debe ser al menos 1; `limit`, entre 1 y 20.
- `limit > 20` se rechaza explícitamente con `El límite máximo permitido es 20` y código `BAD_USER_INPUT`.
- Libros inexistentes devuelven `Libro no encontrado` y código `NOT_FOUND`.

Los errores esperados se construyen con `GraphQLError` y `extensions.code`. 

## DataLoader y prevención de N+1

Cada contexto de request construye un DataLoader nuevo. Todos los resolvers `Libro.autor` del mismo ciclo llaman `load(autorId)`; DataLoader elimina duplicados y ejecuta una sola búsqueda por lote. Así se evita una consulta independiente por cada libro y tampoco se comparte caché entre clientes.

En desarrollo, un listado con relaciones produce evidencia controlada como:

```text
[AuthorLoader] batch requested: ["autor-1","autor-2","autor-3","autor-4"]
```

Se realizaron test para comporabar las pruebas realizas para el funcionamiento de DataLoader y asi poder evitar no solo el over-fetching sino tambien N+1.





