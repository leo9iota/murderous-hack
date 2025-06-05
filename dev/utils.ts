import { $ } from 'bun';

// Color constants for console output
export const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
} as const;

// Logging utilities
export const log = {
    info: (message: string) =>
        console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
    success: (message: string) =>
        console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
    warning: (message: string) =>
        console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
    error: (message: string) =>
        console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
    step: (message: string) =>
        console.log(`${colors.cyan}[STEP]${colors.reset} ${message}`),
    header: (message: string) => {
        console.log('\n' + '='.repeat(60));
        console.log(`${colors.magenta}${message}${colors.reset}`);
        console.log('='.repeat(60));
    },
};

// Utility functions
export const utils = {
    // Check if a command exists
    async commandExists(command: string): Promise<boolean> {
        try {
            await $`which ${command}`.quiet();
            return true;
        } catch {
            return false;
        }
    },

    // Check if a port is in use
    async isPortInUse(port: number): Promise<boolean> {
        try {
            await $`lsof -i :${port}`.quiet();
            return true;
        } catch {
            return false;
        }
    },

    // Kill process on port
    async killPort(port: number): Promise<void> {
        try {
            const result = await $`lsof -ti :${port}`.quiet();
            const pid = result.stdout.toString().trim();
            if (pid) {
                log.warning(`Killing process on port ${port} (PID: ${pid})`);
                await $`kill -9 ${pid}`.quiet();
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        } catch {
            // Port not in use or already killed
        }
    },

    // Wait for a condition with timeout
    async waitFor(
        condition: () => Promise<boolean>,
        timeoutMs: number = 30000,
        intervalMs: number = 1000,
        description: string = 'condition',
    ): Promise<boolean> {
        const startTime = Date.now();
        let attempt = 1;
        const maxAttempts = Math.ceil(timeoutMs / intervalMs);

        while (Date.now() - startTime < timeoutMs) {
            log.info(`Waiting for ${description}... (${attempt}/${maxAttempts})`);

            if (await condition()) {
                return true;
            }

            await new Promise((resolve) => setTimeout(resolve, intervalMs));
            attempt++;
        }

        return false;
    },

    // Check if Docker is running
    async isDockerRunning(): Promise<boolean> {
        try {
            await $`docker info`.quiet();
            return true;
        } catch {
            return false;
        }
    },

    // Check if PostgreSQL is ready
    async isPostgresReady(): Promise<boolean> {
        try {
            await $`docker compose exec -T db pg_isready -U user -d murderous-hack-db`.quiet();
            return true;
        } catch {
            return false;
        }
    },

    // Check if file exists
    async fileExists(path: string): Promise<boolean> {
        try {
            await $`test -f ${path}`.quiet();
            return true;
        } catch {
            return false;
        }
    },

    // Sleep utility
    sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

    // Graceful process exit handler
    setupGracefulExit(cleanup: () => Promise<void>) {
        const handleExit = async (signal: string) => {
            log.info(`Received ${signal}, shutting down gracefully...`);
            await cleanup();
            process.exit(0);
        };

        process.on('SIGINT', () => handleExit('SIGINT'));
        process.on('SIGTERM', () => handleExit('SIGTERM'));
        process.on('exit', () => handleExit('EXIT'));
    },
};

// Error handling wrapper
export const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    errorMessage: string,
): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        log.error(`${errorMessage}: ${error}`);
        process.exit(1);
    }
};
