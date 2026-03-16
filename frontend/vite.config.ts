import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Permite folosirea @/ in loc de cai relative lungi (../../)
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});