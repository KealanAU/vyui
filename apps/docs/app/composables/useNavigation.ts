import type { ContentNavigationItem } from '@nuxt/content'

// Slugs kept out of the Components sidebar (documented but not surfaced yet).
const HIDDEN_COMPONENT_SLUGS = new Set(['keyboard-aware', 'index', 'components'])

export type ComponentLayer = 'all' | 'core' | 'kit'

// Each component page declares which layer it documents via its `package`
// frontmatter (`core` = a headless @vyui/core primitive, `kit` = a styled Vy*
// component). The Core/Kit sub-filter reads that field, so every page lands in
// exactly one bucket — no overlap. `package` is surfaced on nav nodes by the
// `queryCollectionNavigation('docs', ['package', 'category'])` call in app.vue,
// which also surfaces the `category` frontmatter the sidebar groups on.
type LayeredNavItem = ContentNavigationItem & { package?: 'core' | 'kit', category?: string }

// Shared selection for the Components Core/Kit sub-filter (header pills drive it,
// the sidebar reads it).
export function useComponentLayer() {
  return useState<ComponentLayer>('vyui-component-layer', () => 'all')
}

// Sidebar group order. Pages opt in via their `category:` frontmatter.
const CATEGORY_ORDER = [
  'Buttons',
  'Form',
  'Navigation',
  'Overlay',
  'Data Display',
  'Layout',
  'Gestures & Lists',
  'Dynamic Island',
  'Other',
]

// Curated top categories for the second header bar, not the raw content
// sections. Each owns one or more paths — a whole section (`/getting-started`)
// or a single nested page. Categories resolving to no content are dropped.
interface CategoryConfig {
  id: string
  title: string
  icon: string
  paths: string[]
}

const CATEGORY_CONFIG: CategoryConfig[] = [
  // /packages and /guides ride along rather than owning tabs: they fall through
  // to categories[0] anyway, and this puts them in that sidebar.
  { id: 'getting-started', title: 'Getting Started', icon: 'i-lucide-rocket', paths: ['/getting-started', '/packages', '/guides'] },
  { id: 'components', title: 'Components', icon: 'i-lucide-boxes', paths: ['/components'] },
  { id: 'composables', title: 'Composables', icon: 'i-lucide-square-function', paths: ['/composables'] },
  { id: 'styling', title: 'Styling', icon: 'i-lucide-palette', paths: ['/theming', '/accessibility', '/i18n'] },
]

// Recursively drop `icon` from every nav node — the docs sidebar reads cleaner
// without them. Applied at render time (the useAsyncData transform did not
// reliably reach the provided ref).
function stripNavIcons(items: ContentNavigationItem[] = []): ContentNavigationItem[] {
  return items.map(({ icon: _icon, ...rest }) => ({
    ...rest,
    ...(rest.children ? { children: stripNavIcons(rest.children) } : {}),
  }))
}

const slugOf = (path?: string) => (path ?? '').replace(/\/$/, '').split('/').pop() ?? ''

const stripTrailing = (path?: string) => (path ?? '').replace(/\/$/, '')

// Find a nav node by exact path, searching the tree (so nested pages like
// `/packages/core` resolve even though `packages` is the top-level section).
function findNode(items: ContentNavigationItem[], targetPath: string): ContentNavigationItem | undefined {
  const target = stripTrailing(targetPath)
  for (const item of items) {
    if (stripTrailing(item.path) === target)
      return item
    if (item.children?.length) {
      const found = findNode(item.children, target)
      if (found)
        return found
    }
  }
  return undefined
}

// Tab destination: the category root's own page, falling back to its first child.
function firstLeaf(items: ContentNavigationItem[]): string {
  const first = items[0]
  if (!first)
    return '/'
  return first.path ?? first.children?.[0]?.path ?? '/'
}

function groupByCategory(children: ContentNavigationItem[] = []): ContentNavigationItem[] {
  const groups = new Map<string, ContentNavigationItem[]>()
  for (const child of children) {
    const slug = slugOf(child.path)
    if (HIDDEN_COMPONENT_SLUGS.has(slug))
      continue
    // Anything not in CATEGORY_ORDER would be filtered out below, so an
    // unrecognised `category:` falls back to Other rather than vanishing.
    const declared = (child as LayeredNavItem).category
    const cat = declared && CATEGORY_ORDER.includes(declared) ? declared : 'Other'
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
 * the Components category is grouped into labeled sub-sections and can be
 * narrowed to a single package layer via the Core/Kit sub-filter.
 */
export function useNavigation(navigation: Ref<ContentNavigationItem[] | null | undefined>) {
  const route = useRoute()
  const layer = useComponentLayer()

  const sections = computed(() => stripNavIcons(navigation.value ?? []))

  // Curated categories resolved against the real content tree. Empty categories
  // (no matching content) are dropped.
  const categories = computed(() =>
    CATEGORY_CONFIG
      .map(cfg => ({
        ...cfg,
        items: cfg.paths
          .map(p => findNode(sections.value, p))
          .filter((n): n is ContentNavigationItem => !!n),
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

  // Sidebar navigation for the active category. Components is filtered by the
  // active package layer then grouped by category; everything else shows its
  // owned sections as-is (sections with children render as collapsible groups,
  // leaf files as single links).
  const navigationByCategory = computed<ContentNavigationItem[]>(() => {
    const cat = activeCategory.value
    if (!cat)
      return []
    if (cat.id === 'components') {
      const children = (cat.items[0]?.children ?? []).filter((child) => {
        if (layer.value === 'all')
          return true
        return (child as LayeredNavItem).package === layer.value
      })
      return groupByCategory(children)
    }
    return cat.items
  })

  return { sections, categories, categoryLinks, activeCategory, isComponents, navigationByCategory, layer }
}
