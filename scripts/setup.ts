import { $ } from 'bun';

(async () => {
    try {
        console.log('🆗 Creating .env file...');
        try {
            await $`test -f .env`;
            console.log('⚠️ .env already exists');
        } catch {
            await $`cp .env.example .env`;
            console.log('🆗 .env created from .env.example');
        }

        console.log('🆗 Installing root dependencies...');
        await $`bun install`;

        console.log('🆗 Installing frontend dependencies...');
        await $`cd frontend && bun install`;

        console.log('🆗 Stopping existing containers...');
        await $`docker compose down`;

        console.log('🆗 Starting database container...');
        await $`docker compose up -d postgres-db`;

        console.log('🆗 Waiting for database to be fully ready...');
        await new Promise((resolve) => setTimeout(resolve, 8000));

        console.log('🆗 Pushing database schema...');
        try {
            await $`bunx drizzle-kit push`;
        } catch (error) {
            console.error('❌ Failed to push schema:', error);
            throw error;
        }

        console.log('✅ Setup complete!');
        console.log('');
        console.log('💡 Next steps:');
        console.log('$ bun run dev');
        console.log('$ cd frontend && bun run dev');
        console.log('');
        console.log('💡 Or use the start script:');
        console.log('$ bun run start');
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
})();
