// Post-build canary for the vue-lynx worklet pipeline: every worklet id the
// bundle references via `_workletMap["<id>"]` must have a matching
// `registerWorkletInternal("main-thread", "<id>", ...)` registration. Every
// known pipeline failure (dropped MT-graph imports, truncated/dropped
// registration extraction — see docs/upstream/vue-lynx-mt-worklet-import-issue.md)
// converges on this symptom, so run it against a demo build after any
// vue-lynx bump, BEFORE device testing:
//
//   pnpm --dir apps/examples/kit-demo build
//   node tools/audit-worklet-bundle.mjs apps/examples/kit-demo/dist/main.web.bundle
//
// Exit 1 = unresolved ids (worklets that will crash `bind of undefined` on
// device). Exit 2 = usage / bundle-shape problem.
import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('usage: node tools/audit-worklet-bundle.mjs <main.web.bundle>')
  process.exit(2)
}
const code = readFileSync(file, 'utf8')

// MT code ships string-embedded in web bundles, so quotes may be \"-escaped.
const refs = new Set([...code.matchAll(/_workletMap\[\\*"([\w:]+)\\*"\]/g)].map((m) => m[1]))
const regs = new Set(
  [...code.matchAll(/registerWorkletInternal\(\\*"main-thread\\*",\s*\\*"([\w:]+)\\*"/g)].map((m) => m[1]),
)
const unresolved = [...refs].filter((id) => !regs.has(id))

console.log(`${file}: ${refs.size} worklet ids referenced, ${regs.size} registered, ${unresolved.length} unresolved`)
if (refs.size === 0) {
  console.error('no worklet references found — wrong file, or bundle shape changed and this audit needs updating')
  process.exit(2)
}
if (unresolved.length) {
  console.error('UNRESOLVED ids (crash `bind of undefined` on first use on device):')
  for (const id of unresolved) console.error(`  ${id}`)
  process.exit(1)
}
