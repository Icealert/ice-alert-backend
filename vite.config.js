import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/',
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  server: {
    port: process.env.PORT || 5173,
    cors: {
      origin: process.env.CORS_ORIGIN || 'https://aaaa-arduino-proj-91evnvz20-icealerts-projects.vercel.app',
      credentials: true
    },
    proxy: {
      '/api': {
        target: process.env.SUPABASE_URL || 'https://xxdjtvevvszefsvgjwye.supabase.co',
        changeOrigin: true,
        secure: true,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        },
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY
        }
      }
    },
    historyApiFallback: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-recharts': ['recharts'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion']
        },
      }
    },
    chunkSizeWarningLimit: 800,
  },
  publicDir: 'public',
  optimizeDeps: {
    include: ['recharts', 'react', 'react-dom', 'react-router-dom'],
  },
})) 