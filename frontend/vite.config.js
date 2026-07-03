import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api and /auth are proxied to the backend so the browser sees a single origin —
// no CORS headaches, and session cookies just work.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
});
