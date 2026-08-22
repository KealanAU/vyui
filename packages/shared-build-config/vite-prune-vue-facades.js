// Prune plugin-vue's dead re-export facades (`X.vue2.js`) from a
// `preserveModules` build. A chunk is deleted only when nothing reachable from
// an entry imports it AND it has no side effects, so the `X.vue2.js` modules
// that are real (a scoped SFC's compiled script, referenced by its `X.vue.js`)
// stay untouched.

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
