#!/usr/bin/env bun
import { $ } from 'bun';

import { log, utils, withErrorHandling } from './utils';

// Reset development environment (IIFE)
(async () => {
    // Confirm reset action
    const confirmReset = async (): Promise<boolean> => {
        log.header('⚠️ DATABASE RESET WARNING ⚠️');
        console.log('');
        console.log('This will:');
        console.log('• Stop all running services');
        console.log('• Delete the PostgreSQL database and all data');
        console.log('• Recreate the database with fresh schema');
        console.log('• Restart all development services');
        console.log('');
        log.warning('ALL DATA WILL BE LOST!');
        console.log('');

        // Simple confirmation for automated environments
        const args = process.argv.slice(2);
        if (args.includes('--yes') || args.includes('-y')) {
            return true;
        }

        // Interactive confirmation
        console.log("Type 'yes' to continue or anything else to cancel:");

        // Read from stdin
        const input = await new Promise<string>((resolve) => {
            process.stdin.once('data', (data) => {
                resolve(data.toString().trim().toLowerCase());
            });
        });

        return input === 'yes';
    };

    if (!(await confirmReset())) {
        log.info('Reset cancelled.');
        process.exit(0);
    }

    log.header('🔄 Murderous Hack Development Environment Reset');

    // Stop all services
    await withErrorHandling(async () => {
        log.step('Stopping all services...');

        // Kill development servers
        await utils.killPort(3001);
        await utils.killPort(3000);

        // Stop Docker services
        try {
            await $`docker compose down`.quiet();
        } catch {
            // Ignore if no services are running
        }

        log.success('All services stopped!');
    }, 'Failed to stop services');

    // Reset database
    await withErrorHandling(async () => {
        log.step('Resetting database...');

        log.info('Removing database containers and volumes...');
        await $`docker compose down -v`;

        log.info('Pruning unused volumes...');
        await $`docker volume prune -f`;

        log.success('Database reset complete!');
    }, 'Database reset failed');

    // Start fresh database
    await withErrorHandling(async () => {
        log.step('Starting fresh database...');

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

        log.success('Fresh PostgreSQL database is ready!');
    }, 'Fresh database startup failed');

    // Setup fresh schema
    await withErrorHandling(async () => {
        log.step('Setting up fresh database schema...');

        log.info('Pushing database schema...');
        await $`bunx drizzle-kit push`;

        log.success('Fresh database schema created!');
    }, 'Fresh schema setup failed');

    // Start development servers
    await withErrorHandling(async () => {
        log.step('Starting development servers...');

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

        // Success message
        log.header('🎉 Reset Complete - Fresh Murderous Hack Environment Ready!');
        console.log('');
        console.log('🌐 Frontend: http://localhost:3001');
        console.log('🔧 Backend:  http://localhost:3000');
        console.log('🗄️  Database: Fresh PostgreSQL on localhost:5432');
        console.log('');
        console.log('Press Ctrl+C to stop all services');
        console.log('');

        // Keep the process alive
        await new Promise(() => {}); // Infinite wait
    }, 'Development server startup failed');
})().catch((error) => {
    log.error(`Reset failed: ${error.message}`);
    process.exit(1);
});
