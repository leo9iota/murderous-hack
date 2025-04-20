import { $ } from 'bun';

// Start database
await $`docker compose up -d`;

// Wait for database to be ready
console.log('Waiting for database to start...');
await new Promise((resolve) => setTimeout(resolve, 3000));

// Push schema
await $`bun drizzle-kit push`;

// Start dev server
await $`bun run dev`;
