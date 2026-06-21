import type { ContentNavigationItem } from '@nuxt/content'

// Component docs are flat files, so categories live here (no per-page
// frontmatter, no edits to the fleet-authored .md files). Unmapped slugs fall
// into "Other" — add them here as new components are documented.
const COMPONENT_CATEGORY: Record<string, string> = {
  // Form
  input: 'Form',
  textarea: 'Form',
  select: 'Form',
  combobox: 'Form',
  checkbox: 'Form',
  'radio-group': 'Form',
  switch: 'Form',
  slider: 'Form',
  'number-field': 'Form',
  'pin-input': 'Form',
  toggle: 'Form',
  'toggle-group': 'Form',
  label: 'Form',
  rating: 'Form',
  form: 'Form',
  // Navigation & Disclosure
  tabs: 'Navigation',
  accordion: 'Navigation',
  stepper: 'Navigation',
  collapsible: 'Navigation',
  pagination: 'Navigation',
  navigation: 'Navigation',
  // Overlay
  modal: 'Overlay',
  dialog: 'Overlay',
  drawer: 'Overlay',
  sheet: 'Overlay',
  'action-sheet': 'Overlay',
  popover: 'Overlay',
  tooltip: 'Overlay',
  'dropdown-menu': 'Overlay',
  toast: 'Overlay',
  // Data Display
  avatar: 'Data Display',
  'avatar-group': 'Data Display',
  alert: 'Data Display',
  badge: 'Data Display',
  chip: 'Data Display',
  progress: 'Data Display',
  icon: 'Data Display',
  // Layout
  'aspect-ratio': 'Layout',
  separator: 'Layout',
  card: 'Layout',
  placeholder: 'Layout',
  skeleton: 'Layout',
  // Gestures & Lists
  'swipe-action': 'Gestures & Lists',
  swiper: 'Gestures & Lists',
  sortable: 'Gestures & Lists',
  draggable: 'Gestures & Lists',
  feedlist: 'Gestures & Lists',
  'feed-list': 'Gestures & Lists',
  // Dynamic Island
  island: 'Dynamic Island',
  'island-button': 'Dynamic Island',
  'island-group': 'Dynamic Island',
  // Utilities
  'keyboard-aware': 'Utilities',
  button: 'Buttons',
}

const CATEGORY_ORDER = [
  'Buttons',
  'Form',
  'Navigation',
  'Overlay',
  'Data Display',
  'Layout',
  'Gestures & Lists',
  'Dynamic Island',
  'Utilities',
  'Other',
]

// The second header bar is a curated set of top categories (not the raw
// top-level content sections). Each owns one or more content sections, keyed by
// their top-level slug. Categories that resolve to no content (e.g. Composables
// until it ships) are hidden automatically.
interface CategoryConfig {
  id: string
  title: string
  icon: string
  sections: string[]
}

const CATEGORY_CONFIG: CategoryConfig[] = [
  { id: 'getting-started', title: 'Getting Started', icon: 'i-lucide-rocket', sections: ['getting-started', 'packages'] },
  { id: 'components', title: 'Components', icon: 'i-lucide-boxes', sections: ['components'] },
  { id: 'composables', title: 'Composables', icon: 'i-lucide-square-function', sections: ['composables'] },
  { id: 'styling', title: 'Styling', icon: 'i-lucide-palette', sections: ['theming', 'accessibility', 'i18n', 'roadmap'] },
]

const slugOf = (path?: string) => (path ?? '').replace(/\/$/, '').split('/').pop() ?? ''

const stripTrailing = (path?: string) => (path ?? '').replace(/\/$/, '')

// First navigable path within a list of sections (drills into the first child).
function firstLeaf(items: ContentNavigationItem[]): string {
  const first = items[0]
  if (!first)
    return '/'
  return first.children?.[0]?.path ?? first.path ?? '/'
}

function groupByCategory(children: ContentNavigationItem[] = []): ContentNavigationItem[] {
  const groups = new Map<string, ContentNavigationItem[]>()
  for (const child of children) {
    const cat = COMPONENT_CATEGORY[slugOf(child.path)] ?? 'Other'
    if (!groups.has(cat))
      groups.set(cat, [])
    groups.get(cat)!.push(child)
  }
  return CATEGORY_ORDER
    .filter(cat => groups.has(cat))
    .map(cat => ({ title: cat, path: `#${cat}`, children: groups.get(cat)! } as ContentNavigationItem))
}

/**
 * Mirrors Nuxt UI's docs `useNavigation`, but the header is driven by a curated
 * set of categories (Getting Started, Components, Composables, Styling) rather
 * than the raw content sections. The sidebar is scoped to the active category;
 * the Components category is grouped into labeled sub-sections.
 */
export function useNavigation(navigation: Ref<ContentNavigationItem[] | null | undefined>) {
  const route = useRoute()

  const sections = computed(() => stripNavIcons(navigation.value ?? []))

  // Curated categories resolved against the real content sections. Empty
  // categories (no matching content) are dropped.
  const categories = computed(() =>
    CATEGORY_CONFIG
      .map(cfg => ({
        ...cfg,
        items: sections.value.filter(s => cfg.sections.includes(slugOf(s.path))),
      }))
      .filter(cat => cat.items.length > 0),
  )

  const activeCategory = computed(() => {
    const path = route.path
    const match = categories.value.find(cat =>
      cat.items.some((s) => {
        const base = stripTrailing(s.path)
        return path === base || path.startsWith(`${base}/`)
      }),
    )
    return match ?? categories.value[0]
  })

  // Tabs for the second header bar.
  const categoryLinks = computed(() =>
    categories.value.map(cat => ({
      label: cat.title,
      icon: cat.icon,
      to: firstLeaf(cat.items),
      active: cat.id === activeCategory.value?.id,
    })),
  )

  const isComponents = computed(() => activeCategory.value?.id === 'components')

  // Sidebar navigation for the active category. Components is grouped by
  // category; everything else shows its owned sections as-is (sections with
  // children render as collapsible groups, leaf files as single links).
  const navigationByCategory = computed<ContentNavigationItem[]>(() => {
    const cat = activeCategory.value
    if (!cat)
      return []
    if (cat.id === 'components')
      return groupByCategory(cat.items[0]?.children)
    return cat.items
  })

  return { sections, categories, categoryLinks, activeCategory, isComponents, navigationByCategory }
}
