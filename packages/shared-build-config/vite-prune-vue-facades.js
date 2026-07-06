// Prune plugin-vue's redundant re-export sub-modules from a `preserveModules`
// build.
//
// Under Rollup `preserveModules`, `@vitejs/plugin-vue` emits two modules for
// most SFCs: the canonical component module (id `X.vue`, always written to
// `X.vue.js` — this is what the barrel and siblings import, and it carries the
// `_export_sfc` scopeId wrapper for `<style scoped>` SFCs) and the
// `X.vue?vue&type=script` sub-module. For SFCs whose script is inlined into the
// canonical module, that sub-module collapses to a pure re-export facade
// (`X.vue2.js`) that nothing imports — dead weight in the published package.
//
// This plugin deletes those facades, but ONLY when both hold:
//   1. no other emitted chunk (nor entry) imports the facade — removing it
//      cannot change any consumer's module graph, and
//   2. the facade has no side effects — every statement is an import/export or
//      comment, so it registers nothing and imports nothing for effect.
//
// The `X.vue2.js` sub-modules that ARE real (the compiled script behind a
// scoped SFC's `_export_sfc` wrapper) are referenced by their `X.vue.js` and so
// are kept untouched.

/**
 * @returns {import('vite').Plugin}
 */
export function vyuiPruneVueFacades() {
  return {
    name: 'vyui:prune-vue-facades',
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter((c) => c.type === 'chunk')

      // Everything reachable from an entry via static/dynamic imports must stay.
      const referenced = new Set()
      const queue = chunks.filter((c) => c.isEntry).map((c) => c.fileName)
      while (queue.length) {
        const name = queue.shift()
        if (referenced.has(name)) continue
        referenced.add(name)
        const chunk = bundle[name]
        if (chunk && chunk.type === 'chunk') {
          for (const dep of [...chunk.imports, ...chunk.dynamicImports]) queue.push(dep)
        }
      }

      let pruned = 0
      for (const chunk of chunks) {
        if (chunk.isEntry) continue
        if (referenced.has(chunk.fileName)) continue
        if (!isSideEffectFree(chunk.code)) continue
        delete bundle[chunk.fileName]
        pruned++
      }
      if (pruned) this.warn(`pruned ${pruned} dead re-export facade module(s)`)
    },
  }
}

// True when every top-level statement is an import, export, comment, or blank —
// i.e. the module runs no code and imports nothing for side effects.
function isSideEffectFree(code) {
  const stripped = code
    // block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // line comments
    .replace(/(^|\n)\s*\/\/[^\n]*/g, '$1')
  // Collapse to logical statements; a facade is only import/export declarations.
  const meaningful = stripped
    .split(/;|\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  // A bare `import "..."` (no bindings) is a side-effect import — reject it.
  if (meaningful.some((s) => /^import\s*["']/.test(s))) return false
  return meaningful.every((s) => /^(import\b|export\b|\})/.test(s) || /^[\w$,\s]+$/.test(s))
}
