import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    plugins: [svelte()],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: 'src/main.js',
            output: {
                entryFileNames: 'main.js',
                format: 'iife',
                name: 'SwiftTabs'
            },
        },
        // Ensure we generate a single CSS file
        cssCodeSplit: false
    },
});