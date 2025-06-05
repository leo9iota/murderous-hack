#!/usr/bin/env bun
import { $ } from 'bun';
import { log, utils, run, safeRun } from './utils';

// Complete setup and start
(async () => {
    log.header('🚀 Murderous Hack Complete Setup & Start');

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

    // Kill any existing processes on our ports
    await utils.killPort(3000);
    await utils.killPort(3001);

    // Start backend (in root directory)
    log.info('Starting backend server...');
    const backend = Bun.spawn(['bun', 'run', 'dev'], {
        cwd: process.cwd(),
        stdout: 'inherit',
        stderr: 'inherit',
    });

    // Start frontend (in frontend directory)
    log.info('Starting frontend server...');
    const frontend = Bun.spawn(['bun', 'run', 'dev'], {
        cwd: 'frontend',
        stdout: 'inherit',
        stderr: 'inherit',
    });

    // Setup graceful shutdown
    utils.setupGracefulExit(async () => {
        log.info('Stopping servers...');
        backend.kill();
        frontend.kill();
        await utils.killPort(3000);
        await utils.killPort(3001);
    });

    log.success('Murderous Hack development environment ready!');
    console.log('🌐 Frontend: http://localhost:3001');
    console.log('🔧 Backend:  http://localhost:3000');
    console.log('🗄️ Database: PostgreSQL on localhost:5432');
    console.log('Press Ctrl+C to stop');

    // Keep alive
    await new Promise(() => {});
})().catch((error) => {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
});
