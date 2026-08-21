// Generates the per-component subpath entries (`@vyui/kit/button`, …) that
// let consumers avoid the `.` barrel. Under the vue-lynx MT worklet pipeline,
// pruning is `sideEffects`-glob-based, so everything *reached* ships in both
// the BG bundle and the MT worklet slice; deep entries shrink the reached set
// to the imported components' subtrees (the rewrite-deep-imports pass keeps
// kit's own dist from re-entering @vyui/core's barrel for the same reason).
//
// Each entry re-exports the canonical `Vy*` name (same binding as the barrel,
// per the no-bare-aliases rule in src/index.ts), so migrating an app is a
// specifier swap only. Sources of truth:
//   - component entries: parsed from `export { default as VyX } from
//     './components/X.vue'` lines in src/index.ts
//   - core re-exports + extra bindings: the hand map below (a new
//     `from '@vyui/core'` value export in src/index.ts fails this script until
//     it's mapped or deliberately skipped)
//
// Runs after `vite build` (writes dist/entries/*.{js,d.ts}) and BEFORE
// rewrite-deep-imports (so `@vyui/core` re-exports here get deep-rewritten).
// package.json `exports` must match the generated set: default mode verifies,
// `--write` updates it.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const pkgRoot = new URL('..', import.meta.url).pathname
const write = process.argv.includes('--write')

// Entries whose bindings live in @vyui/core (no kit SFC to point at) — the
// js re-export is barrel-shaped here and made deep by rewrite-deep-imports.
const CORE_ENTRIES = {
  'aspect-ratio': {
    js: ['export { AspectRatio as VyAspectRatio } from "@vyui/core";'],
    dts: ['export { AspectRatio as VyAspectRatio, type AspectRatioProps } from "@vyui/core";'],
    covers: ['AspectRatio'],
  },
  icon: {
    js: ['export { Icon as VyIcon } from "@vyui/core";'],
    dts: ['export { Icon as VyIcon, type IconProps } from "@vyui/core";'],
    covers: ['Icon'],
  },
  'keyboard-aware': {
    js: [
      'export { KeyboardAwareResponder as VyKeyboardAwareResponder, KeyboardAwareRoot as VyKeyboardAwareRoot, KeyboardAwareTrigger as VyKeyboardAwareTrigger } from "@vyui/core";',
    ],
    dts: [
      'export { KeyboardAwareResponder as VyKeyboardAwareResponder, KeyboardAwareRoot as VyKeyboardAwareRoot, KeyboardAwareTrigger as VyKeyboardAwareTrigger } from "@vyui/core";',
    ],
    covers: ['KeyboardAwareResponder', 'KeyboardAwareRoot', 'KeyboardAwareTrigger'],
  },
}

// Non-component bindings that belong WITH a component entry (or form their own
// small one) so a deep-import app never needs the barrel at runtime.
const EXTRA_LINES = {
  tray: {
    js: ['export { useTray } from "../components/trayContext.js";'],
    dts: ['export { useTray, type TrayContext } from "../components/trayContext.js";'],
  },
}
const STANDALONE_ENTRIES = {
  provide: {
    js: [
      'export { provideVyUI } from "../provide.js";',
      'export { useAppConfig } from "../composables/useAppConfig.js";',
      'export { resolveColorHex } from "../utils/resolveColor.js";',
    ],
    dts: [
      'export { provideVyUI } from "../provide.js";',
      'export { useAppConfig } from "../composables/useAppConfig.js";',
      'export { resolveColorHex } from "../utils/resolveColor.js";',
    ],
  },
}

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const index = readFileSync(join(pkgRoot, 'src/index.ts'), 'utf8')

/** @type {Map<string, { js: string[], dts: string[] }>} */
const entries = new Map()

for (const m of index.matchAll(/^export \{ default as (Vy\w+) \} from '\.\/components\/(\w+)\.vue'$/gm)) {
  const [, exported, file] = m
  const line = `export { default as ${exported} } from "../components/${file}.vue.js";`
  entries.set(kebab(file), { js: [line], dts: [line] })
}
if (entries.size === 0) throw new Error('no component export lines matched in src/index.ts — did its shape change?')

// Guard: every VALUE binding re-exported from @vyui/core must be covered by a
// CORE_ENTRIES mapping, so new core re-exports can't silently ship barrel-only.
const covered = new Set(Object.values(CORE_ENTRIES).flatMap((e) => e.covers))
for (const m of index.matchAll(/^export \{([^}]*)\} from '@vyui\/core'$/gm)) {
  for (const spec of m[1].split(',')) {
    const s = spec.trim()
    if (!s || s.startsWith('type ')) continue
    const name = s.split(/\s+as\s+/)[0]
    if (!covered.has(name)) {
      throw new Error(`'${name}' is re-exported from @vyui/core but has no subpath entry — add it to CORE_ENTRIES in ${import.meta.url}`)
    }
  }
}

for (const [name, entry] of Object.entries(CORE_ENTRIES)) {
  if (entries.has(name)) throw new Error(`core entry '${name}' collides with a component entry`)
  entries.set(name, { js: [...entry.js], dts: [...entry.dts] })
}
for (const [name, extra] of Object.entries(EXTRA_LINES)) {
  const entry = entries.get(name)
  if (!entry) throw new Error(`EXTRA_LINES target '${name}' has no entry`)
  entry.js.push(...extra.js)
  entry.dts.push(...extra.dts)
}
for (const [name, entry] of Object.entries(STANDALONE_ENTRIES)) {
  if (entries.has(name)) throw new Error(`standalone entry '${name}' collides with a component entry`)
  entries.set(name, { js: [...entry.js], dts: [...entry.dts] })
}

// ---- write dist/entries/*.{js,d.ts} --------------------------------------
mkdirSync(join(pkgRoot, 'dist/entries'), { recursive: true })
for (const [name, { js, dts }] of entries) {
  writeFileSync(join(pkgRoot, `dist/entries/${name}.js`), js.join('\n') + '\n')
  writeFileSync(join(pkgRoot, `dist/entries/${name}.d.ts`), dts.join('\n') + '\n')
}

// ---- sync package.json `exports` ------------------------------------------
const pkgPath = join(pkgRoot, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

// Fixed surface keeps its existing keys, targets and order; generated entries
// slot back into the same slice they occupy now. Derived, not listed, so
// adding or removing a fixed export is a package.json-only edit.
const isGenerated = key => pkg.exports[key]?.import?.startsWith('./dist/entries/')
const keys = Object.keys(pkg.exports)
const cut = keys.findIndex(isGenerated)
const head = cut === -1 ? keys : keys.slice(0, cut)
const tail = cut === -1 ? [] : keys.slice(cut).filter(key => !isGenerated(key))
const expected = {}
for (const key of head) expected[key] = pkg.exports[key]
for (const name of [...entries.keys()].sort()) {
  expected[`./${name}`] = {
    types: `./dist/entries/${name}.d.ts`,
    import: `./dist/entries/${name}.js`,
  }
}
for (const key of tail) expected[key] = pkg.exports[key]

const current = JSON.stringify(pkg.exports, null, 2)
const wanted = JSON.stringify(expected, null, 2)
if (current !== wanted) {
  if (!write) {
    console.error('gen-subpath-entries: package.json `exports` is out of sync with the generated entries.')
    console.error('Run: node scripts/gen-subpath-entries.mjs --write')
    process.exit(1)
  }
  pkg.exports = expected
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log('gen-subpath-entries: package.json exports updated')
}

console.log(`gen-subpath-entries: ${entries.size} entries written to dist/entries/`)
