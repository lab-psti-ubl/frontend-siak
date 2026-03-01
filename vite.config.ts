import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 5 MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      manifest: {
        name: 'iSchola',
        short_name: 'iSchola',
        description: 'Aplikasi iSchola dengan Vite + React',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#317EFB',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],

  server: {
    historyApiFallback: true,
  },

  optimizeDeps: {
    exclude: ['lucide-react'],
  },

// untuk menghilangkan console
  //npx vite build
  //npm run preview .. untuk melihat hasil build
  build: {
    // Minify and obfuscate code in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console statements
        drop_debugger: true, // Remove debugger statements
      },
      
    },
    
  }

});
