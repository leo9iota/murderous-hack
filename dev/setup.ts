#!/usr/bin/env bun
import { $ } from 'bun';

import { log, utils, withErrorHandling } from './utils';

// Setup development environment (IIFE)
(async () => {
    log.header('🔧 Murderous Hack Development Environment Setup');

    // Check requirements
    await withErrorHandling(async () => {
        log.step('Checking system requirements...');

        if (!(await utils.commandExists('bun'))) {
            throw new Error(
                'Bun is not installed. Please install from https://bun.sh',
            );
        }

        if (!(await utils.commandExists('docker'))) {
            throw new Error(
                'Docker is not installed. Please install from https://docker.com',
            );
        }

        if (!(await utils.isDockerRunning())) {
            throw new Error('Docker is not running. Please start Docker Desktop');
        }

        log.success('All system requirements met!');
    }, 'System requirements check failed');

    // Setup environment
    await withErrorHandling(async () => {
        log.step('Setting up environment variables...');

        if (!(await utils.fileExists('.env'))) {
            log.info('Creating .env file from .env.example...');
            await $`cp .env.example .env`;
            log.success('.env file created!');
        } else {
            log.warning('.env file already exists, skipping...');
        }
    }, 'Environment setup failed');

    // Install dependencies
    await withErrorHandling(async () => {
        log.step('Installing dependencies...');

        log.info('Installing root dependencies...');
        await $`bun install`;

        log.info('Installing frontend dependencies...');
        await $`cd frontend && bun install`;

        log.success('Dependencies installed!');
    }, 'Dependency installation failed');

    // Setup database
    await withErrorHandling(async () => {
        log.step('Setting up database...');

        // Stop any existing containers
        try {
            await $`docker compose down`.quiet();
        } catch {
            // Ignore if no containers are running
        }

        // Start PostgreSQL
        log.info('Starting PostgreSQL database...');
        await $`docker compose up -d db`;

        // Wait for PostgreSQL to be ready
        log.info('Waiting for PostgreSQL to be ready...');
        const isReady = await utils.waitFor(
            utils.isPostgresReady,
            30000,
            2000,
            'PostgreSQL to be ready',
        );

        if (!isReady) {
            throw new Error('PostgreSQL failed to start within 30 seconds');
        }

        log.success('PostgreSQL is ready!');
    }, 'Database setup failed');

    // Setup database schema
    await withErrorHandling(async () => {
        log.step('Setting up database schema...');

        log.info('Pushing database schema...');
        await $`bunx drizzle-kit push`;

        log.success('Database schema created!');
    }, 'Database schema setup failed');

    // Success message
    log.header('🎉 Setup Complete!');
    console.log('');
    console.log('Next steps:');
    console.log("1. Run 'bun run dev:start' to start the development servers");
    console.log('2. Open http://localhost:3001 for the frontend');
    console.log('3. Backend API will be available at http://localhost:3000');
    console.log('');
    console.log('Other useful commands:');
    console.log("- 'bun run dev:stop' - Stop all services");
    console.log("- 'bun run dev:reset' - Reset database and restart");
    console.log("- 'bun run dev:all' - Setup and start everything in one command");
    console.log("- 'bun run db:push' - Update database schema");
    console.log('');
})().catch((error) => {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
});
