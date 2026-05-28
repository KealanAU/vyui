import type { RsbuildPlugin } from '@lynx-js/rspeedy'

// Appends a "∟ No nav" line under the Lynx bundle URL. Lynx Explorer
// strips its in-app nav chrome when the bundle URL has ?fullscreen=true.
//
// `name` must be unique per demo (e.g. `'ui-demo:lynx-fullscreen-hint'`) so
// running multiple demos in the same process doesn't collide on plugin id.
export const createLynxFullscreenHintPlugin = (name: string): RsbuildPlugin => ({
  name,
  setup(api) {
    api.modifyRsbuildConfig({
      order: 'post',
      handler: (config, { mergeRsbuildConfig }) => {
        const prev = config.server?.printUrls
        if (typeof prev !== 'function') return
        return mergeRsbuildConfig(config, {
          server: {
            printUrls: (params) => {
              const urls = prev(params) ?? []
              const out: typeof urls = []
              for (const entry of urls) {
                out.push(entry)
                if (typeof entry !== 'string' && entry.label === 'Lynx') {
                  out.push({
                    label: '∟ No nav',
                    url: `${entry.url}?fullscreen=true`,
                  })
                }
              }
              return out
            },
          },
        })
      },
    })
  },
})
