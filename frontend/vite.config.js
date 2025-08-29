// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Pas de sourcemap en production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          socket: ['socket.io-client']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    historyApiFallback: true  // AJOUT CRITIQUE
  },
  preview: {
    port: 3000,
    host: true,
    historyApiFallback: true  // AJOUT CRITIQUE
  }
})