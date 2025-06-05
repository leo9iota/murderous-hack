import { $ } from 'bun';

// Simple logging
export const log = {
    info: (msg: string) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
    success: (msg: string) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
    error: (msg: string) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
    warn: (msg: string) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
    header: (msg: string) => console.log(`\n\x1b[35m🚀 ${msg}\x1b[0m\n`),
};

// Project paths
export const paths = {
    root: process.cwd(),
    frontend: 'frontend',
    server: 'server',
};

// Simple utilities
export const utils = {
    // Kill process on port
    async killPort(port: number): Promise<void> {
        try {
            await $`npx kill-port ${port}`.quiet();
        } catch {
            // Port not in use
        }
    },

    // Check if PostgreSQL is ready
    async isPostgresReady(): Promise<boolean> {
        try {
            await $`docker compose exec -T postgres-db pg_isready -U user -d murderous-hack-db`.quiet();
            return true;
        } catch {
            return false;
        }
    },

    // Wait for PostgreSQL with simple retry
    async waitForPostgres(): Promise<void> {
        log.info('Waiting for PostgreSQL...');
        for (let i = 0; i < 30; i++) {
            if (await this.isPostgresReady()) {
                log.success('PostgreSQL is ready!');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error('PostgreSQL failed to start');
    },

    // Setup graceful shutdown
    setupGracefulExit(cleanup: () => Promise<void>) {
        process.on('SIGINT', async () => {
            log.info('Shutting down...');
            await cleanup();
            process.exit(0);
        });
    },
};

// Simple error handling
export const run = async (cmd: string, description?: string) => {
    try {
        if (description) log.info(description);
        await $`sh -c ${cmd}`;
    } catch (error) {
        log.error(`Failed: ${description || cmd}`);
        process.exit(1);
    }
};

// Safe run - doesn't exit on failure
export const safeRun = async (cmd: string, description?: string) => {
    try {
        if (description) log.info(description);
        await $`sh -c ${cmd}`;
        return true;
    } catch (error) {
        if (description) log.warn(`Skipped: ${description}`);
        return false;
    }
};
