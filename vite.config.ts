import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-react-entry-for-admin-routes',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url ?? ''
          if (url === '/' || url === '/admin' || url === '/admin/') {
            req.url = '/vite.html'
          }
          next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url ?? ''
          if (url === '/' || url === '/admin' || url === '/admin/') {
            req.url = '/vite.html'
          }
          next()
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  appType: 'spa',
  build: {
    outDir: 'dist',
    // Generate source maps for better debugging
    sourcemap: true,
    // Don't clear the output directory to preserve existing files
    emptyOutDir: false,
    rollupOptions: {
      input: {
        legacy: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'vite.html'),
      },
    },
  },
  // Preserve existing static files during dev
  publicDir: 'public',
})
