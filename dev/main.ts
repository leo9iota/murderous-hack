#!/usr/bin/env bun
import { $ } from 'bun';

import { log, utils, withErrorHandling } from './utils';

// Main development environment setup and start
(async () => {
    log.header('🚀 BetterNews Development Environment');

    // Step 1: Check requirements
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

    // Step 2: Setup environment
    await withErrorHandling(async () => {
        log.step('Setting up environment...');

        if (!(await utils.fileExists('.env'))) {
            log.info('Creating .env file from .env.example...');
            await $`cp .env.example .env`;
            log.success('.env file created!');
        } else {
            log.info('.env file already exists');
        }
    }, 'Environment setup failed');

    // Step 3: Install dependencies
    await withErrorHandling(async () => {
        log.step('Installing dependencies...');

        log.info('Installing root dependencies...');
        await $`bun install`;

        log.info('Installing frontend dependencies...');
        await $`cd frontend && bun install`;

        log.success('Dependencies installed!');
    }, 'Dependency installation failed');

    // Step 4: Setup database
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

    // Step 5: Run database migrations
    await withErrorHandling(async () => {
        log.step('Setting up database schema...');

        log.info('Pushing database schema...');
        await $`bunx drizzle-kit push`;

        log.success('Database schema created!');
    }, 'Database migration failed');

    // Step 6: Start development servers
    await withErrorHandling(async () => {
        log.step('Starting development servers...');

        // Kill any existing processes on our ports
        await utils.killPort(3000);
        await utils.killPort(3001);

        // Start backend server
        log.info('Starting backend server on http://localhost:3000...');
        const backendProcess = Bun.spawn(
            ['bun', 'run', '--hot', 'server/index.ts'],
            {
                stdout: 'pipe',
                stderr: 'pipe',
            },
        );

        // Start frontend server
        log.info('Starting frontend server on http://localhost:3001...');
        const frontendProcess = Bun.spawn(['bun', 'run', 'dev'], {
            cwd: './frontend',
            stdout: 'pipe',
            stderr: 'pipe',
        });

        // Wait a moment for servers to start
        await utils.sleep(3000);

        // Check if servers are running
        const backendRunning = await utils.isPortInUse(3000);
        const frontendRunning = await utils.isPortInUse(3001);

        if (!backendRunning) {
            throw new Error('Backend server failed to start on port 3000');
        }

        if (!frontendRunning) {
            throw new Error('Frontend server failed to start on port 3001');
        }

        log.success('Development servers started!');

        // Setup graceful shutdown
        utils.setupGracefulExit(async () => {
            log.info('Stopping development servers...');

            try {
                backendProcess.kill();
                frontendProcess.kill();
            } catch {
                // Ignore errors during cleanup
            }

            await utils.killPort(3000);
            await utils.killPort(3001);

            log.success('Development servers stopped!');
        });

        // Display success message
        log.header('🎉 Development Environment Ready!');
        console.log('');
        console.log('🌐 Frontend: http://localhost:3001');
        console.log('🔧 Backend:  http://localhost:3000');
        console.log('🗄️ Database: PostgreSQL on localhost:5432');
        console.log('');
        console.log('Press Ctrl+C to stop all services');
        console.log('');

        // Keep the process alive
        await new Promise(() => {}); // Infinite wait
    }, 'Development server startup failed');
})().catch((error) => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
});
