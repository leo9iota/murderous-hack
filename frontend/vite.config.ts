import path from 'path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// Tailwind CSS v4 dedicated Vite plugin — provides the PostCSS pipeline and fast incremental build support
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        // Order: Tailwind first so subsequent plugins can tweak its generated CSS if needed
        tailwindcss(),
        TanStackRouterVite({}),
        react(),
    ],
    resolve: {
        alias: {
            '@/shared': path.resolve(__dirname, '../shared'),
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
