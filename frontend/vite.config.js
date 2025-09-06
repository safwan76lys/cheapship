import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Configuration Build pour Railway
  build: {
    outDir: 'dist',
    sourcemap: false, // Pas de sourcemap en production
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          socket: ['socket.io-client'],
          icons: ['lucide-react']
        }
      }
    },
    // Optimisations Railway
    target: 'esnext',
    cssCodeSplit: true
  },
  
  // Configuration serveur pour développement local
  server: {
    port: 3000,
    host: '0.0.0.0', // Important pour Railway
    strictPort: false,
    cors: true,
    proxy: {
      // Proxy API en développement
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        timeout: 30000
      }
    }
  },
  
  // Configuration preview (Railway utilise ceci)
  preview: {
    port: parseInt(process.env.PORT) || 3000,
    host: '0.0.0.0', // Crucial pour Railway
    strictPort: false,
    cors: true,
    allowedHosts: [
      'cheapship-frontend-production.up.railway.app',
      'cheapship.fr',
      'www.cheapship.fr'
    ]
  },
  
  // Optimisations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'socket.io-client']
  },
  
  // Configuration pour Railway
  base: '/',
  
  // Variables d'environnement
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Configuration CSS
  css: {
    devSourcemap: false // Désactivé pour Railway
  },
  
  // Configuration ESBuild
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})