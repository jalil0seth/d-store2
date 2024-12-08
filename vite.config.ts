import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', '@inertiajs/react'],
                    ui: [
                        '@/Components/ui/button',
                        '@/Components/ui/dialog',
                        '@/Components/ui/input',
                        '@/Components/ui/textarea',
                        '@/Components/ui/tabs',
                        '@/Components/ui/select',
                        '@/Components/ui/label',
                        '@/Components/ui/checkbox'
                    ]
                }
            }
        }
    }
});
