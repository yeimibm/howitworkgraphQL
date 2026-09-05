import { cp, mkdir } from 'node:fs/promises';

await mkdir(new URL('../dist/schema/', import.meta.url), { recursive: true });
await cp(
  new URL('../src/schema/schema.graphql', import.meta.url),
  new URL('../dist/schema/schema.graphql', import.meta.url)
);
