import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `base: './'` keeps every asset URL relative, so the same build works at
// https://cardondev.github.io/bashin/, under any other sub-path, or from a
// plain directory served by any static server.
//
// `vite build --mode portable` inlines everything into one index.html that
// also opens straight from disk (file://).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss(), ...(mode === 'portable' ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
  build: {
    outDir: mode === 'portable' ? 'dist-portable' : 'dist',
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
}));
