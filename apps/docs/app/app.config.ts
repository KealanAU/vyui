export default defineAppConfig({
  ui: {
    colors: {
      primary: 'ink',
      neutral: 'stone',
    },
    button: {
      slots: {
        base: 'rounded-full font-medium',
      },
      defaultVariants: {
        size: 'md',
      },
    },
    card: {
      slots: {
        root: 'rounded-3xl shadow-steep ring-0',
      },
    },
    input: {
      slots: {
        base: 'rounded-2xl',
      },
    },
    pageHero: {
      slots: {
        title: 'font-display tracking-tight',
        description: 'text-toned',
      },
    },
    pageHeader: {
      slots: {
        title: 'font-display tracking-tight',
      },
    },
    pageSection: {
      slots: {
        title: 'font-display tracking-tight',
      },
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted',
      },
    },
  },
  repository: 'KealanAU/vyui',
  seo: {
    siteName: 'Vy UI',
  },
  header: {
    title: '',
    to: '/',
    search: true,
    colorMode: true,
    // Empty-state rows for the phone ⌘K palette (wired up in app.vue).
    quickLinks: [
      { label: 'Get Started', icon: 'i-lucide-square-play', to: '/getting-started' },
      { label: '@vyui/core', icon: 'i-lucide-box', to: '/packages/core' },
      { label: '@vyui/kit', icon: 'i-lucide-layers', to: '/packages/kit' },
      { label: 'Theming', icon: 'i-lucide-palette', to: '/theming' },
    ],
    // Icon buttons on the right of the header, beside search and color mode.
    links: [{
      'icon': 'i-lucide-history',
      'to': '/changelog',
      'aria-label': 'Changelog',
    }, {
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/KealanAU/vyui',
      'target': '_blank',
      'aria-label': 'GitHub',
    }],
  },
  footer: {
    credits: `MIT © ${new Date().getFullYear()} — Built for Vue-Lynx`,
    colorMode: false,
    links: [{
      'icon': 'i-lucide-component',
      'to': 'https://vue.lynxjs.org/',
      'target': '_blank',
      'aria-label': 'Vue-Lynx',
    }, {
      'icon': 'i-lucide-book-open',
      'to': 'https://lynxjs.org/',
      'target': '_blank',
      'aria-label': 'Lynx',
    }, {
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/KealanAU/vyui',
      'target': '_blank',
      'aria-label': 'Vy UI on GitHub',
    }],
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/KealanAU/vyui/edit/main/apps/docs/content',
      links: [{
        icon: 'i-lucide-star',
        label: 'Star on GitHub',
        to: 'https://github.com/KealanAU/vyui',
        target: '_blank',
      }, {
        icon: 'i-lucide-component',
        label: 'Vue-Lynx docs',
        to: 'https://vue.lynxjs.org/',
        target: '_blank',
      }, {
        icon: 'i-lucide-book-open',
        label: 'Lynx docs',
        to: 'https://lynxjs.org/',
        target: '_blank',
      }],
    },
  },
})
