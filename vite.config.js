import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            hmr: {
                host: 'localhost'
            }
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            '~': path.resolve(__dirname, 'store-frontend/src'),
        },
    },
    server: {
        host: '0.0.0.0',
        hmr: {
            host: 'localhost'
        },
        watch: {
            usePolling: true
        }
    },
    base: '/build/',
    build: {
        manifest: "manifest.json",
        outDir: 'public/build',
        rollupOptions: {
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['@inertiajs/react', '@mui/material']
                }
            }
        }
    },
    optimizeDeps: {
        exclude: ['lucide-react']
    },
    typescript: {
        ignoreBuildErrors: true
    }
});
