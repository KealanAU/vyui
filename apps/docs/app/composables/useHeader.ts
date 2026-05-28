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
    label: 'Theming',
    to: '/theming',
    active: route.path === '/theming',
  }, {
    label: 'Roadmap',
    to: '/roadmap',
    active: route.path === '/roadmap',
  }, {
    label: 'Changelog',
    to: '/changelog',
    active: route.path === '/changelog',
  }])

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
    active: route.path === '/theming',
  }, {
    label: 'Roadmap',
    icon: 'i-lucide-map',
    to: '/roadmap',
    active: route.path === '/roadmap',
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
    active: route.path === '/theming',
  }, {
    label: 'Roadmap',
    icon: 'i-lucide-map',
    to: '/roadmap',
    active: route.path === '/roadmap',
  }])

  return {
    desktopLinks,
    mobileLinks,
    docsLinks,
  }
}
