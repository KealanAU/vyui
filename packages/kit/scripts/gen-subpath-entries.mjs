// Runs after `vite build` (writes dist/entries/*.{js,d.ts}) and BEFORE
// rewrite-deep-imports (so `@vyui/core` re-exports here get deep-rewritten).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { subpathEntries } from './subpath-entries.mjs'

const pkgRoot = new URL('..', import.meta.url).pathname

const entries = subpathEntries()

mkdirSync(join(pkgRoot, 'dist/entries'), { recursive: true })
for (const [name, { js, dts }] of entries) {
  writeFileSync(join(pkgRoot, `dist/entries/${name}.js`), js.join('\n') + '\n')
  writeFileSync(join(pkgRoot, `dist/entries/${name}.d.ts`), dts.join('\n') + '\n')
}

console.log(`gen-subpath-entries: ${entries.size} entries written to dist/entries/`)
