import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'background.ts'),
        content: resolve(__dirname, 'content.ts'),
        options: resolve(__dirname, 'options.ts'),
        utils: resolve(__dirname, 'utils.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
      },
    },
    minify: 'terser',
    sourcemap: false,
  },
  publicDir: false, // We handle copying manually
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
