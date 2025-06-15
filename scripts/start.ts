import { $ } from 'bun';

const openDocs = process.argv.includes('--docs') || process.argv.includes('-d');

async function openDocumentation() {
    const DOCS_URL = 'http://localhost:3000/docs';
    const SPEC_URL = 'http://localhost:3000/api-spec.json';

    console.log('\n📚 API Documentation URLs:');
    console.log(`Interactive Docs:  ${DOCS_URL}`);
    console.log(`OpenAPI Spec:      ${SPEC_URL}\n`);

    try {
        if (process.platform === 'win32') {
            await $`start ${DOCS_URL}`;
        } else if (process.platform === 'darwin') {
            await $`open ${DOCS_URL}`;
        } else {
            await $`xdg-open ${DOCS_URL}`;
        }
        console.log('🆗 Opened documentation in your default browser');
    } catch (error) {
        console.log('⚠️  Could not open browser automatically');
        console.log(`⚠️  Please visit: ${DOCS_URL}`);
    }

    console.log('\n🎯 Features:');
    console.log('    • Interactive API playground');
    console.log('    • Try endpoints directly in browser');
    console.log('    • Authentication support');
    console.log('    • Custom Murderous Hack branding');
    console.log('    • Export to Postman/Insomnia');
}

(async () => {
    console.log(`
███╗   ███╗██╗   ██╗██████╗ ██████╗ ███████╗██████╗  ██████╗ ██╗   ██╗███████╗
████╗ ████║██║   ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔═══██╗██║   ██║██╔════╝
██╔████╔██║██║   ██║██████╔╝██║  ██║█████╗  ██████╔╝██║   ██║██║   ██║███████╗
██║╚██╔╝██║██║   ██║██╔══██╗██║  ██║██╔══╝  ██╔══██╗██║   ██║██║   ██║╚════██║
██║ ╚═╝ ██║╚██████╔╝██║  ██║██████╔╝███████╗██║  ██║╚██████╔╝╚██████╔╝███████║
╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝

                       ██╗  ██╗ █████╗  ██████╗██╗  ██╗
                       ██║  ██║██╔══██╗██╔════╝██║ ██╔╝
                       ███████║███████║██║     █████╔╝
                       ██╔══██║██╔══██║██║     ██╔═██╗
                       ██║  ██║██║  ██║╚██████╗██║  ██╗
                       ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
`);

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
            console.log('💡 Ports 3000 and 3001 are not in use');
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
        console.log('✨ Frontend:  http://localhost:3001');
        console.log('✨ Server:    http://localhost:3000');
        console.log('✨ Docs:      http://localhost:3000/docs');

        if (openDocs) {
            console.log('⌛ Waiting for backend to be ready...');
            let retries = 0;
            const maxRetries = 30;

            while (retries < maxRetries) {
                try {
                    await fetch('http://localhost:3000/api/user');
                    await openDocumentation();
                    break;
                } catch {
                    retries++;
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            if (retries >= maxRetries) {
                console.log('⚠️ Backend took too long to start, skipping docs!');
            }
        }

        console.log('💡 Press Ctrl+C to stop');
        console.log('💡 Use --docs or -d flag to open API documentation');

        await new Promise(() => {});
    } catch (error) {
        console.error('❌ Start failed:', error);
        process.exit(1);
    }
})();
