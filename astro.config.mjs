import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  prefetch: false,
  output: 'server',
  devToolbar: {
    enabled: false,
  },
  vite: {
    ssr: {
      noExternal: ['lucide-react']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'lucide-react': ['lucide-react']
          }
        }
      }
    }
  },
  site: 'https://singforhope.org',
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    imageService: true,
    functionPerRoute: false,
    edgeMiddleware: false,
  }),
  integrations: [
    tailwind(),
    react(),
    icon(),
    sitemap(),
  ],
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sfhmedia.nyc3.digitaloceanspaces.com',
      },
      {
        protocol: 'https',
        hostname: 'app.singforhope.org',
      },
      {
        protocol: 'https', 
        hostname: 'cdnc.heyzine.com',
      },
      {
        protocol: 'https',
        hostname: 'customer-zqf7uphf6x9b8fuh.cloudflarestream.com',
      },
      // Allow any *.supabase.co domain for dynamic Supabase storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      }
    ],
  },
});
