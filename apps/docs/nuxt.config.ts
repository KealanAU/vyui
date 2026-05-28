export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  // Cloudflare Pages — static deploy. `nuxi generate` prerenders every route
  // into .output/public, which Pages serves directly. No Worker, no cold start.
  nitro: {
    preset: 'cloudflare-pages-static',
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
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
