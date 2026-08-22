// Re-attach per-module SFC CSS side-effect imports.
//
// In a `cssCodeSplit` lib build Vite extracts each SFC's `<style>` to its own
// asset but strips the `import "./X.css"` from the JS module. Under
// `preserveModules` the CSS then ships orphaned and consumers render unstyled.

import { dirname, relative } from 'node:path/posix'

/**
 * @returns {import('vite').Plugin}
 */
export function vyuiSfcCssImports() {
  return {
    name: 'vyui:sfc-css-imports',
    // Must run after Vite's `vite:css-post` (also `enforce: 'post'`), which is
    // what records `importedCss` on each chunk's `viteMetadata`.
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue
        const css = chunk.viteMetadata && chunk.viteMetadata.importedCss
        if (!css || css.size === 0) continue
        const dir = dirname(chunk.fileName)
        const lines = [...css].map((cssFile) => {
          let rel = relative(dir, cssFile)
          if (!rel.startsWith('.')) rel = `./${rel}`
          return `import "${rel}";`
        })
        chunk.code = `${lines.join('\n')}\n${chunk.code}`
      }
    },
  }
}
