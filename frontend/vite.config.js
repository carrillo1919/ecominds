import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const previewPort = Number(env.PREVIEW_PORT);
  const previewHost = env.PREVIEW_HOST;

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: { enabled: true },
        includeAssets: ['favicon.png', 'icons/*.png'],
        manifest: {
          name: 'EcoMinds Auditoria',
          short_name: 'EcoMinds',
          description:
            'Sistema de Registro y Control de Cumplimiento: auditorias, requisitos legales y evidencias.',
          lang: 'es',
          start_url: '/app/dashboard',
          scope: '/app/',
          display: 'standalone',
          orientation: 'portrait-primary',
          background_color: '#f7f9fb',
          theme_color: '#004532',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: '/app/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: { cacheName: 'ecominds-html', networkTimeoutSeconds: 5 },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'ecominds-fonts' },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173 },
    preview: {
      allowedHosts: true,
      port: previewPort,
      host: previewHost,
      strictPort: true,
    },
  };
});