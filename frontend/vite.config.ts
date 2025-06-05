import path from 'path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        TanStackRouterVite({
            target: 'react',
            autoCodeSplitting: true,
        }),
        react(),
        tailwindcss(),
        tsconfigPaths()
    ],
    resolve: {
        alias: {
            '@/shared': path.resolve(__dirname, '../shared'),
            '@': path.resolve(__dirname, './src'),
            buffer: 'buffer',
        },
    },
    define: {
        global: 'globalThis',
    },
    optimizeDeps: {
        include: ['buffer'],
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
