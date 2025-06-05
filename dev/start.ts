#!/usr/bin/env bun
import { $ } from 'bun';

import { log, utils, withErrorHandling } from './utils';

// Start development environment (IIFE)
(async () => {
    log.header('🚀 Starting Murderous Hack Development Environment');

    // Check Docker
    await withErrorHandling(async () => {
        log.step('Checking Docker...');

        if (!(await utils.isDockerRunning())) {
            throw new Error('Docker is not running. Please start Docker Desktop');
        }

        log.success('Docker is running!');
    }, 'Docker check failed');

    // Start database
    await withErrorHandling(async () => {
        log.step('Starting database...');

        // Check if PostgreSQL is already running
        const isRunning = await utils.isPostgresReady();

        if (!isRunning) {
            log.info('Starting PostgreSQL database...');
            await $`docker compose up -d db`;

            // Wait for PostgreSQL to be ready
            log.info('Waiting for PostgreSQL to be ready...');
            const isReady = await utils.waitFor(
                utils.isPostgresReady,
                20000,
                2000,
                'PostgreSQL to be ready',
            );

            if (!isReady) {
                throw new Error('PostgreSQL failed to start within 20 seconds');
            }

            log.success('PostgreSQL is ready!');
        } else {
            log.success('PostgreSQL is already running!');
        }
    }, 'Database startup failed');

    // Start development servers
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
        log.header('🎉 Murderous Hack Services Running!');
        console.log('');
        console.log('🌐 Frontend: http://localhost:3001');
        console.log('🔧 Backend:  http://localhost:3000');
        console.log('🗄️  Database: PostgreSQL on localhost:5432');
        console.log('');
        console.log('Press Ctrl+C to stop all services');
        console.log('');

        // Keep the process alive
        await new Promise(() => {}); // Infinite wait
    }, 'Development server startup failed');
})().catch((error) => {
    log.error(`Startup failed: ${error.message}`);
    process.exit(1);
});
