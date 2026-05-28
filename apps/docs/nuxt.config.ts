export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/content', '@nuxt/image', '@nuxtjs/mdc'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },

  content: {
    build: {
      markdown: {
        toc: {
          searchDepth: 1,
        },
      },
    },
    experimental: {
      sqliteConnector: 'native',
    },
  },

  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true,
      autoSubfolderIndex: false,
    },
  },

  compatibilityDate: '2024-07-11',

  icon: {
    provider: 'iconify',
  },

  app: {
    head: {
      title: 'Vy UI — Headless components for Vue-Lynx',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Vy UI is a headless, accessible component library for Vue-Lynx — bring Radix-style primitives and a styled kit to ByteDance’s native cross-platform framework.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://api.fontshare.com' },
        { rel: 'preconnect', href: 'https://cdn.fontshare.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://api.fontshare.com/v2/css?f[]=haskoy@300,400,500,600,700,800&display=swap' },
      ],
    },
  },
})
