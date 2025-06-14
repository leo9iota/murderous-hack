import { $ } from 'bun';

(async () => {
    try {
        console.log('🆗 Checking database...');
        try {
            await $`docker compose exec -T postgres-db pg_isready -U user -d murderous-hack-db`.quiet();
            console.log('🆗 Database is ready');
        } catch {
            console.log('🆗 Starting database...');
            await $`docker compose up -d postgres-db`;
            console.log('⌛ Waiting for database...');
            await new Promise((resolve) => setTimeout(resolve, 6969));
        }

        console.log('🆗 Killing any existing processes on ports 3000 and 3001...');
        try {
            await $`bunx kill-port 3000 3001`.quiet();
        } catch {
            console.log(
                '💡 Ports 3000 and 3001 are not in use',
            );
        }

        console.log('🆗 Starting backend server...');
        const backend = Bun.spawn(['bun', 'run', 'dev'], {
            cwd: process.cwd(),
            stdout: 'inherit',
            stderr: 'inherit',
        });

        console.log('🆗 Starting frontend server...');
        const frontend = Bun.spawn(['bun', 'run', 'dev'], {
            cwd: 'frontend',
            stdout: 'inherit',
            stderr: 'inherit',
        });

        process.on('SIGINT', async () => {
            console.log('\n🆗 Shutting down servers...');
            backend.kill();
            frontend.kill();
            try {
                await $`bunx kill-port 3000 3001`.quiet();
            } catch {}
            process.exit(0);
        });

        console.log('✅ Development environment is up and running!');
        console.log('✨ Frontend:     http://localhost:3001');
        console.log('✨ Backend:      http://localhost:3000');
        console.log('💡 Press Ctrl+C to stop');

        await new Promise(() => {});
    } catch (error) {
        console.error('❌ Start failed:', error);
        process.exit(1);
    }
})();
