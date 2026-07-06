// Re-attach per-module SFC CSS side-effect imports.
//
// In a `cssCodeSplit` lib build, Vite extracts each SFC's `<style>` to its own
// `.css` asset but strips the `import "./X.css"` side-effect from the JS module
// (its browser CSS-injection path doesn't apply to a published library). Under
// `preserveModules` that leaves the CSS orphaned: the file ships but no module
// pulls it in, so consumers silently render unstyled — the same net result as
// the old bundle, which stubbed SFC CSS entirely.
//
// This restores the side-effect import at the top of each JS chunk that owns
// CSS, using the `importedCss` set Vite records on `chunk.viteMetadata`. The
// consumer's bundler then loads the CSS whenever the component module is
// imported, exactly as an SFC `<style>` implies.

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
