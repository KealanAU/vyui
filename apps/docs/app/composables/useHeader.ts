import type { NavigationMenuItem } from '@nuxt/ui'

export function useHeader() {
  const route = useRoute()

  const desktopLinks = computed<NavigationMenuItem[]>(() => [{
    label: 'Docs',
    to: '/getting-started',
    active: route.path === '/getting-started' || route.path.startsWith('/getting-started/'),
  }, {
    label: 'Components',
    active: route.path.startsWith('/packages/'),
    children: [{
      label: '@vyui/core',
      description: 'Headless primitives — behavior, no opinions.',
      icon: 'i-lucide-box',
      to: '/packages/core',
    }, {
      label: '@vyui/kit',
      description: 'Styled Vy* components on top of core.',
      icon: 'i-lucide-layers',
      to: '/packages/kit',
    }],
  }, {
    label: 'Guides',
    to: '/guides',
    active: route.path === '/guides' || route.path.startsWith('/guides/'),
  }])
  // Theming, Roadmap and Changelog live in the Styling tab, the Getting Started
  // sidebar, and header.links — all three stay in mobileLinks, the only nav below lg.

  const mobileLinks = computed<NavigationMenuItem[]>(() => [{
    label: 'Get Started',
    icon: 'i-lucide-square-play',
    to: '/getting-started',
    active: route.path === '/getting-started' || route.path.startsWith('/getting-started/'),
  }, {
    label: '@vyui/core',
    icon: 'i-lucide-box',
    to: '/packages/core',
    active: route.path === '/packages/core',
  }, {
    label: '@vyui/kit',
    icon: 'i-lucide-layers',
    to: '/packages/kit',
    active: route.path === '/packages/kit',
  }, {
    label: 'Theming',
    icon: 'i-lucide-palette',
    to: '/theming',
    active: route.path === '/theming' || route.path.startsWith('/theming/'),
  }, {
    label: 'Guides',
    icon: 'i-lucide-book-open',
    to: '/guides',
    active: route.path === '/guides' || route.path.startsWith('/guides/'),
  }, {
    label: 'Roadmap',
    icon: 'i-lucide-map',
    to: '/getting-started/roadmap',
    active: route.path === '/getting-started/roadmap',
  }, {
    label: 'Changelog',
    icon: 'i-lucide-rocket',
    to: '/changelog',
    active: route.path === '/changelog',
  }, {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/KealanAU/vyui',
    target: '_blank',
  }])

  const docsLinks = computed<NavigationMenuItem[]>(() => [{
    label: 'Get Started',
    icon: 'i-lucide-square-play',
    to: '/getting-started',
    active: route.path === '/getting-started' || route.path.startsWith('/getting-started/'),
  }, {
    label: '@vyui/core',
    icon: 'i-lucide-box',
    to: '/packages/core',
    active: route.path === '/packages/core',
  }, {
    label: '@vyui/kit',
    icon: 'i-lucide-layers',
    to: '/packages/kit',
    active: route.path === '/packages/kit',
  }, {
    label: 'Theming',
    icon: 'i-lucide-palette',
    to: '/theming',
    active: route.path === '/theming' || route.path.startsWith('/theming/'),
  }, {
    label: 'Roadmap',
    icon: 'i-lucide-map',
    to: '/getting-started/roadmap',
    active: route.path === '/getting-started/roadmap',
  }])

  return {
    desktopLinks,
    mobileLinks,
    docsLinks,
  }
}
