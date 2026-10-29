import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths so it works seamlessly on GitHub Pages (e.g. /buttonmaker/)
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          jspdf: ['jspdf'],
          reactVendor: ['react', 'react-dom'],
          lucide: ['lucide-react']
        }
      }
    }
  }
});
