import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In dev, the React app runs on :5173 and the Express API on :5000.
      // Forward API/auth calls so cookies stay same-site during development.
      '/api': 'http://localhost:5000',
      '/login': 'http://localhost:5000',
      '/logout': 'http://localhost:5000',
      '/auth': 'http://localhost:5000',
    },
  },
})
