import { $ } from 'bun'; // Use shell API from Bun

// Make use of IIFE (because I can)
(async () => {
    try {
        // Stop any existing containers first
        console.log('Stopping existing containers...');
        await $`docker-compose down`;

        // Start database
        console.log('Starting database container...');
        await $`docker-compose up -d`;

        // More explicit waiting with longer timeout
        console.log('Waiting for database to be fully ready...');
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Try to push schema
        console.log('Pushing database schema...');
        try {
            await $`bun db:push`;
        } catch (error) {
            console.error('Failed to push schema:', error);
            throw error;
        }

        // Start dev server
        console.log('Starting development server...');
        await $`bun dev`;
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
})();
