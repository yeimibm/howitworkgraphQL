# Biblioteca GraphQL

para esta práctica de comprensión tecnología y académica, se utilizo un proyecto que se realizo con anterioridad, para esta ocasión se utilizó graphql , drizzle-orm para la conexión a la base de datos compatible con typescript y añadiendo el uso de vitest para las pruebas unitaria para autor-libro y Testcontainers para pruebas de integración 

## Reproducir localmente

Se requiere Node.js 20 o posterior y Docker con el daemon activo. Instalar dependencias y levantar PostgreSQL:

```bash
npm ci
docker compose -f docker/docker-compose.yml up -d
npm run db:migrate
npm run dev
```

La conexión a la DB es `postgres://postgres:postgres@localhost:55432/library`. 

GraphiQL queda disponible en `http://localhost:4000/graphql`. Para ejecutar el código compilado:

```bash
npm run build
npm start
```


## Pruebas

```bash
npm run test:unit
npm run test:integration
```

`test:unit` usa Vitest sin conectarse a PostgreSQL. `test:integration` usa Vitest y Testcontainers: inicia PostgreSQL temporal, aplica las migraciones, comprueba escritura, lectura e integridad con el código real de persistencia y libera los recursos al terminar. 


