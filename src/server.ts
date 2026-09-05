import { createServer } from 'node:http';
import { createLibraryYoga } from './app.js';

const port = Number.parseInt(process.env.PORT ?? '4000', 10);
const yoga = createLibraryYoga();
const server = createServer(yoga);

server.listen(port, () => {
  console.info(`Biblioteca GraphQL disponible en http://localhost:${port}/graphql`);
});
