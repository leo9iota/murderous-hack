#!/usr/bin/env bun
import { $ } from 'bun';
import { log, utils, run } from './utils';

// Simple start script
(async () => {
    log.header('🚀 Starting Murderous Hack');

    // Start database if not running
    if (!(await utils.isPostgresReady())) {
        await run('docker compose up -d postgres-db', 'Starting PostgreSQL');
        await utils.waitForPostgres();
    } else {
        log.success('PostgreSQL already running');
    }

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

    log.success('Development environment running!');
    console.log('🌐 Frontend: http://localhost:3001');
    console.log('🔧 Backend:  http://localhost:3000');
    console.log('Press Ctrl+C to stop');

    // Keep alive
    await new Promise(() => {});
})().catch((error) => {
    log.error(`Start failed: ${error.message}`);
    process.exit(1);
});
