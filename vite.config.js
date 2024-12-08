import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            // Add this to handle HMR properly
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
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
    build: {
        chunkSizeWarningLimit: 1000,
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['@mui/material', '@mui/icons-material'],
                },
            },
        },
        typescript: {
            ignoreBuildErrors: true,
        },
    },
});
