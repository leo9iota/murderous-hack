#!/usr/bin/env bun
import { $ } from 'bun';
import { log, utils, run, safeRun } from './utils';

// Simple setup script
(async () => {
    log.header('🔧 Murderous Hack Setup');

    // Create .env if needed
    try {
        await $`test -f .env`.quiet();
        log.success('.env already exists');
    } catch {
        await run('cp .env.example .env', 'Creating .env file');
    }

    // Install dependencies
    await run('bun install', 'Installing root dependencies');
    await run('cd frontend && bun install', 'Installing frontend dependencies');

    // Start database
    await safeRun('docker compose down', 'Stopping existing containers');
    await run('docker compose up -d postgres-db', 'Starting PostgreSQL');
    await utils.waitForPostgres();

    // Setup schema
    await run('bunx drizzle-kit push', 'Setting up database schema');

    log.success('Setup complete! Run: bun run dev:start');
})().catch((error) => {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
});
