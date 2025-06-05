#!/usr/bin/env bun
import { $ } from 'bun';
import { log, utils, safeRun } from './utils';

// Simple stop script
(async () => {
    log.header('🛑 Stopping Murderous Hack');

    // Kill processes on development ports
    await utils.killPort(3000);
    await utils.killPort(3001);

    // Stop Docker services (don't fail if Docker isn't available)
    await safeRun('docker compose down', 'Stopping Docker services');

    log.success('All services stopped!');
})().catch((error) => {
    log.error(`Stop failed: ${error.message}`);
    process.exit(1);
});
