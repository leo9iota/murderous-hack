#!/usr/bin/env bun
import { $ } from 'bun';

import { log, utils, withErrorHandling } from './utils';

// Stop development environment (IIFE)
(async () => {
    log.header('🛑 Stopping BetterNews Development Environment');

    // Stop development servers
    await withErrorHandling(async () => {
        log.step('Stopping development servers...');

        // Kill processes on development ports
        await utils.killPort(3001);
        await utils.killPort(3000);

        log.success('Development servers stopped!');
    }, 'Failed to stop development servers');

    // Stop Docker services
    await withErrorHandling(async () => {
        log.step('Stopping Docker services...');

        try {
            // Check if any services are running
            const result =
                await $`docker compose ps --services --filter "status=running"`.quiet();
            const runningServices = result.stdout.toString().trim();

            if (runningServices) {
                log.info('Stopping Docker services...');
                await $`docker compose down`;
                log.success('Docker services stopped!');
            } else {
                log.info('No Docker services running');
            }
        } catch (error) {
            log.warning(
                'Could not check Docker services status, attempting to stop anyway...',
            );
            try {
                await $`docker compose down`.quiet();
                log.success('Docker services stopped!');
            } catch {
                log.warning('No Docker services to stop');
            }
        }
    }, 'Failed to stop Docker services');

    // Success message
    log.header('🎉 All Services Stopped!');
    console.log('');
    console.log('To start again, run:');
    console.log("- 'bun run dev:start' - Start development servers");
    console.log("- 'bun run dev:all' - Setup and start everything");
    console.log('');
})().catch((error) => {
    log.error(`Stop failed: ${error.message}`);
    process.exit(1);
});
