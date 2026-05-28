import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function isKnownAppRoute(url: string) {
  return ['/', '/vite', '/vite/', '/admin', '/admin/', '/admin/auth', '/admin/auth/'].includes(url)
}

function shouldServeCustom404(url: string) {
  return !url.includes('.') && !isKnownAppRoute(url)
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-react-entry-for-admin-routes',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url ?? ''
          const viteRoutes = ['/vite', '/vite/', '/admin', '/admin/', '/admin/auth', '/admin/auth/']
          if (viteRoutes.includes(url)) {
            req.url = '/vite.html'
          }
          next()
        })

        server.middlewares.use((req, res, next) => {
          const url = req.url ?? ''
          if (shouldServeCustom404(url)) {
            res.statusCode = 404
            req.url = '/404.html'
          }
          next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url ?? ''
          const viteRoutes = ['/vite', '/vite/', '/admin', '/admin/', '/admin/auth', '/admin/auth/']
          if (viteRoutes.includes(url)) {
            req.url = '/vite.html'
          }
          next()
        })

        server.middlewares.use((req, res, next) => {
          const url = req.url ?? ''
          if (shouldServeCustom404(url)) {
            res.statusCode = 404
            req.url = '/404.html'
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
  appType: 'mpa',
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
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/supabase.ts']
    }
  }
})
