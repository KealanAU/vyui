import type { ContentNavigationItem } from '@nuxt/content'

/**
 * Recursively drop `icon` from every nav node. The docs sidebar reads cleaner
 * without per-page/section icons. Applied at render time (the useAsyncData
 * transform did not reliably reach the provided ref).
 */
export function stripNavIcons(items: ContentNavigationItem[] = []): ContentNavigationItem[] {
  return items.map(({ icon, ...rest }) => ({
    ...rest,
    ...(rest.children ? { children: stripNavIcons(rest.children) } : {}),
  }))
}
