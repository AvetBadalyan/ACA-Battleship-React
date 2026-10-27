import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the big, rarely-changing libraries into their own chunk so
        // the browser can cache them across deploys (app code changes far
        // more often than React/Framer Motion/Zustand do).
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion', 'zustand'],
        },
      },
    },
  },
});
