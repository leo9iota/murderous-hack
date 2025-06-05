import { $ } from 'bun';

(async () => {
    try {
        console.log('Stopping existing containers...');
        await $`docker compose down`;

        console.log('Starting database container...');
        await $`docker compose up -d`;

        console.log('Waiting for database to be fully ready...');
        await new Promise((resolve) => setTimeout(resolve, 5000));

        console.log('Pushing database schema...');
        try {
            await $`bun db:push`;
        } catch (error) {
            console.error('Failed to push schema:', error);
            throw error;
        }

        console.log('Starting development server...');
        await $`bun dev`;
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
})();
