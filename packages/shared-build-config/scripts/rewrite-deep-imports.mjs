// Rewrites barrel imports of a dependency package into per-file deep imports,
// so consumers that deep-import THIS package don't drag the dependency's whole
// barrel along.
//
// Why this exists: the vue-lynx MT worklet pipeline pulls packages into the
// main-thread bundle via BARE side-effect imports (no export usage survives),
// so pruning is governed solely by `sideEffects` globs — everything *reached*
// ships. @vyui/kit's per-component subpath entries shrink what is reached, but
// only if kit's own dist doesn't re-enter @vyui/core through its barrel
// (`import { Button } from "@vyui/core"` reaches ALL of core). This script
// re-points every such binding at the module that actually defines it
// (`@vyui/core/dist/components/Button/Button.vue.js`), resolved from the
// barrel's own import/export statements.
//
// Only machine-generated (Rollup preserveModules) statement shapes are
// accepted; anything else — namespace imports, `export *`, names the barrel
// doesn't map — fails the build rather than shipping an unshaken dist.
//
// Usage: node rewrite-deep-imports.mjs <distDir> <pkgName> <barrelPath>
//   e.g. node rewrite-deep-imports.mjs dist @vyui/core ../core/dist/index.js
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, relative, posix } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Parse a preserveModules barrel into `exported name → defining module`.
 *
 * @param {string} code  barrel source (e.g. @vyui/core dist/index.js)
 * @returns {Map<string, { module: string, imported: string }>}
 *   `module` is barrel-relative ('./components/X.vue.js'), `imported` the name
 *   to import from it ('default' for SFC default exports).
 */
export function parseBarrel(code) {
  /** local binding → { module, imported } */
  const locals = new Map()
  for (const m of code.matchAll(/^import\s*\{([^}]*)\}\s*from\s*["'](\.[^"']+)["'];?\s*$/gm)) {
    for (const spec of m[1].split(',')) {
      const s = spec.trim()
      if (!s) continue
      const asMatch = s.match(/^(\S+)\s+as\s+(\S+)$/)
      const [imported, local] = asMatch ? [asMatch[1], asMatch[2]] : [s, s]
      locals.set(local, { module: m[2], imported })
    }
  }

  const map = new Map()
  for (const block of code.matchAll(/^export\s*\{([^}]*)\};?\s*$/gm)) {
    for (const spec of block[1].split(',')) {
      const s = spec.trim()
      if (!s) continue
      const asMatch = s.match(/^(\S+)\s+as\s+(\S+)$/)
      const [local, exported] = asMatch ? [asMatch[1], asMatch[2]] : [s, s]
      const from = locals.get(local)
      // A name with no import binding is defined in the barrel itself; deep
      // imports can't reach it without keeping the whole barrel, so surface it.
      if (!from) throw new Error(`barrel defines '${exported}' inline (local '${local}') — cannot deep-rewrite it`)
      map.set(exported, from)
    }
  }
  if (map.size === 0) throw new Error('no export block found in barrel — did its output shape change?')
  return map
}

/**
 * Rewrite every `import/export { … } from "<pkgName>"` in one module to deep
 * per-file specifiers. Returns null when the module doesn't touch the barrel.
 *
 * @param {string} code
 * @param {string} pkgName    e.g. '@vyui/core'
 * @param {Map<string, { module: string, imported: string }>} barrelMap
 * @param {(msg: string) => Error} err  error factory (prefixes file context)
 */
export function rewriteModule(code, pkgName, barrelMap, err = (m) => new Error(m)) {
  const esc = pkgName.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')
  // Reject shapes the rewrite can't preserve BEFORE rewriting named forms,
  // so a default/namespace/star usage never slips through half-rewritten.
  const illegal = code.match(new RegExp(`(import\\s+(?!\\{)[^;]*?|export\\s*\\*[^;]*?)from\\s*["']${esc}["']`))
  if (illegal) throw err(`unsupported ${illegal[0].trim().split(/\s/)[0]} form for '${pkgName}': ${illegal[0].trim()}`)

  const stmtRe = new RegExp(`(import|export)\\s*\\{([^}]*)\\}\\s*from\\s*["']${esc}["'];?`, 'g')
  let touched = false
  const out = code.replace(stmtRe, (_, kind, specList) => {
    touched = true
    /** deep module → rewritten specifier strings */
    const byModule = new Map()
    for (const spec of specList.split(',')) {
      const s = spec.trim()
      if (!s) continue
      const asMatch = s.match(/^(\S+)\s+as\s+(\S+)$/)
      const [name, alias] = asMatch ? [asMatch[1], asMatch[2]] : [s, s]
      const target = barrelMap.get(name)
      if (!target) throw err(`'${name}' is not exported by ${pkgName}'s barrel`)
      const deep = posix.join(pkgName, 'dist', target.module)
      const rewritten = target.imported === alias ? alias : `${target.imported} as ${alias}`
      if (!byModule.has(deep)) byModule.set(deep, [])
      byModule.get(deep).push(rewritten)
    }
    return [...byModule]
      .map(([deep, specs]) => `${kind} { ${specs.join(', ')} } from "${deep}";`)
      .join('\n')
  })
  if (!touched) return null
  // Nothing may still point at the barrel — a miss here means a statement
  // shape the regexes didn't recognize.
  if (new RegExp(`["']${esc}["']`).test(out)) throw err(`'${pkgName}' barrel specifier survived the rewrite`)
  return out
}

function walkJs(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.js'))
    .map(e => join(e.parentPath, e.name))
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url
if (isMain) {
  const [distDir, pkgName, barrelPath] = process.argv.slice(2)
  if (!distDir || !pkgName || !barrelPath) {
    console.error('usage: rewrite-deep-imports.mjs <distDir> <pkgName> <barrelPath>')
    process.exit(1)
  }
  const dist = resolve(distDir)
  const barrelMap = parseBarrel(readFileSync(resolve(barrelPath), 'utf8'))

  let files = 0
  const modules = new Set()
  for (const file of walkJs(dist)) {
    const rel = relative(dist, file)
    const out = rewriteModule(readFileSync(file, 'utf8'), pkgName, barrelMap, (m) => new Error(`${rel}: ${m}`))
    if (out === null) continue
    writeFileSync(file, out)
    files++
    for (const m of out.matchAll(new RegExp(`from\\s*"(${pkgName.replace(/[/\\]/g, '\\$&')}/dist/[^"]+)"`, 'g'))) modules.add(m[1])
  }
  console.log(`rewrite-deep-imports: ${files} file(s) now deep-import ${modules.size} ${pkgName} module(s) (barrel maps ${barrelMap.size} exports)`)
}
