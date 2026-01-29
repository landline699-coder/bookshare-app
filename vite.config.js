import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // This splits your heavy libraries into a separate file to fix the 500kB warning
            return 'vendor';
          }
        },
      },
    },
  },
});