export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/content', '@nuxt/image', 'nuxt-llms', '@nuxtjs/sitemap', 'nuxt-og-image', 'nuxt-schema-org'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },

  // Shared site config consumed by @nuxtjs/sitemap + nuxt-og-image
  // (canonical host, sitemap URLs, absolute og:image URLs).
  site: {
    url: 'https://vyui.dev',
    name: 'Vy UI',
  },

  // Site-wide structured data (JSON-LD). The Organization identity + a WebSite
  // node are injected on every page automatically; per-page SoftwareApplication
  // / Article nodes are added in pages/. Search engines and AI crawlers use this
  // to classify Vy UI as a Vue-Lynx component library that renders natively to
  // iOS, Android, and web.
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Vy UI',
      url: 'https://vyui.dev',
      logo: 'https://vyui.dev/icon-512.png',
      sameAs: ['https://github.com/KealanAU/vyui'],
    },
  },

  // Adds <lastmod> (last git commit per doc) to auto-discovered routes; see
  // server/api/__sitemap__/urls.ts.
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },

  // Generates /llms.txt only. Sections are auto-populated from @nuxt/content
  // via its llms:generate hook; omitting `full` skips /llms-full.txt.
  llms: {
    domain: 'https://vyui.dev',
    title: 'Vy UI',
    description: 'Headless, accessible component primitives for Vue-Lynx — plus a styled kit (@vyui/kit) built on top. Native iOS, Android, and web from one Vue codebase.',
  },

  runtimeConfig: {
    public: {
      siteUrl: 'https://vyui.dev',
    },
  },

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
      routes: ['/', '/changelog.xml'],
      crawlLinks: true,
      autoSubfolderIndex: false,
      // Several component pages link to docs that aren't written yet (button,
      // checkbox, drawer, …). Don't fail the build on those 404s; drop this
      // once the linked pages exist.
      failOnError: false,
    },
  },

  vite: {
    optimizeDeps: {
      include: ['@vueuse/core'],
    },
  },

  // `<lynx-view>` is the Lynx web-runtime custom element used by <LynxPreview>.
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith('lynx-'),
    },
  },

  compatibilityDate: '2024-07-11',

  icon: {
    provider: 'iconify',
  },

  app: {
    head: {
      title: 'Vy UI',
      templateParams: {
        separator: '—',
        siteName: 'Vy UI',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'The component library for Vue-Lynx. Behavioral primitives and a styled kit for native iOS, Android, and web — from one Vue codebase.',
        },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'robots', content: 'index, follow' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'Vy UI — Changelog', href: '/changelog.xml' },
        { rel: 'preconnect', href: 'https://api.fontshare.com' },
        { rel: 'preconnect', href: 'https://cdn.fontshare.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://api.fontshare.com/v2/css?f[]=haskoy@300,400,500,600,700,800&display=swap' },
      ],
    },
  },
})
