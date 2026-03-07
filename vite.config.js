import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react({
            fastRefresh: true,
        }),
    ],
      build: {
        // Establece el límite de advertencia de tamaño de chunk a 1000 kB (1 MB)
        chunkSizeWarningLimit: 5000, 
    },
    // server: {
    //     host: '0.0.0.0', 
    //     port: 5173,
    //     cors: true, // Crucial para permitir la conexión desde la tableta
    //     hmr: {
    //         host: '192.168.138.141', // Tu IP según el ipconfig
    //     },
    // },
});