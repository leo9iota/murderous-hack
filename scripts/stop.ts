import { $ } from 'bun';

(async () => {
    try {
        console.log('🆗 Stopping development servers...');
        await $`bunx kill-port 3000 3001`;

        console.log('🆗 Stopping database container...');
        await $`docker compose down`;

        console.log('✅ All services stopped!');
    } catch (error) {
        console.error('❌ Stop failed:', error);
        process.exit(1);
    }
})();
