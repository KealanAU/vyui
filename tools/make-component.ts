// Scaffolds a new @vyui/core primitive directory matching project conventions.
//
// Usage:
//   pnpm new-component <Name>             # generate + wire into barrel
//   pnpm new-component <Name> --no-barrel # generate without touching barrel
//   pnpm new-component <Name> --dry-run   # print what would be created

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const COMPONENTS_DIR = path.join(REPO_ROOT, 'packages/core/src/components')
const BARREL_FILE = path.join(REPO_ROOT, 'packages/core/src/index.ts')

// ---------- arg parsing ----------
const args = process.argv.slice(2)
const flags = new Set(args.filter(a => a.startsWith('--')))
const positional = args.filter(a => !a.startsWith('--'))
const name = positional[0]
const dryRun = flags.has('--dry-run')
const noBarrel = flags.has('--no-barrel')

if (!name || flags.has('--help')) {
  console.log(`Usage: pnpm new-component <Name> [--no-barrel] [--dry-run]`)
  process.exit(name ? 0 : 1)
}
if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
  console.error(`Error: component name must be PascalCase (got "${name}")`)
  process.exit(1)
}

const targetDir = path.join(COMPONENTS_DIR, name)
if (fs.existsSync(targetDir)) {
  console.error(`Error: ${path.relative(REPO_ROOT, targetDir)} already exists`)
  process.exit(1)
}

// ---------- templates ----------
function rootSfc(n: string): string {
  return `<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export type ${n}Emits = {
  /** Event handler called when the value changes. */
  'update:modelValue': [value: boolean]
}

export interface ${n}Props extends PrimitiveProps {
  /** The controlled value. Can be bind as \`v-model\`. */
  modelValue?: boolean | null
  /** Initial value when uncontrolled. */
  defaultValue?: boolean
  /** When \`true\`, prevents the user from interacting with the component. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import type { Ref } from 'vue'
import { useVModel } from '@vueuse/core'
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<${n}Props>(), {
  modelValue: undefined,
  disabled: false,
  as: 'view',
})

const emits = defineEmits<${n}Emits>()

const { forwardRef } = useForwardExpose()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<boolean>
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="props.asChild"
    :as="as"
    :data-disabled="disabled ? '' : undefined"
    :disabled="disabled ? '' : undefined"
  >
    <slot :model-value="modelValue" :disabled="disabled" />
  </Primitive>
</template>
`
}

function indexTs(n: string): string {
  return `export {
  default as ${n},
  default as ${n}Root,
  type ${n}Emits,
  type ${n}Props,
} from './${n}Root.vue'
`
}

function storySfc(n: string): string {
  return `<script setup lang="ts">
import type { ${n}Props } from '..'
import { ${n} } from '..'

const props = defineProps<${n}Props>()
</script>

<template>
  <${n} v-bind="props">Label</${n}>
</template>
`
}

function testTs(n: string): string {
  return `import { describe, expect, it } from 'vitest'
import * as Exports from '.'

describe('${n}', () => {
  it('exports ${n}Root', () => {
    expect(Exports.${n}Root).toBeDefined()
    expect(Exports.${n}).toBeDefined()
  })

  // TODO: blocked on MTS test infra — re-enable once render harness is wired
  it.skip('renders correctly', () => {
    // placeholder: render(<${n}Story />) and assert DOM contract
  })
})
`
}

// ---------- plan ----------
const files: Array<{ rel: string; content: string }> = [
  { rel: `${name}/index.ts`, content: indexTs(name) },
  { rel: `${name}/${name}Root.vue`, content: rootSfc(name) },
  { rel: `${name}/${name}.test.ts`, content: testTs(name) },
  { rel: `${name}/story/_${name}.vue`, content: storySfc(name) },
]

const barrelLine = `export * from './components/${name}'\n`

// ---------- execute ----------
if (dryRun) {
  console.log(`[dry-run] would create:`)
  for (const f of files) console.log(`  ${path.join('packages/core/src/components', f.rel)}`)
  if (!noBarrel) console.log(`[dry-run] would append to barrel: ${barrelLine.trim()}`)
  process.exit(0)
}

for (const f of files) {
  const abs = path.join(COMPONENTS_DIR, f.rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, f.content)
  console.log(`created ${path.relative(REPO_ROOT, abs)}`)
}

if (!noBarrel) {
  const barrel = fs.readFileSync(BARREL_FILE, 'utf8')
  if (barrel.includes(`./components/${name}`)) {
    console.log(`barrel already references ${name}, skipping`)
  } else {
    // Insert in alphabetical position within the "Disclosure + universal" block
    // if a sibling alphabetical neighbor exists; otherwise append.
    const lines = barrel.split('\n')
    const exportRegex = /^export \* from '\.\/components\/([A-Za-z0-9]+)'$/
    let inserted = false
    for (let i = 0; i < lines.length; i++) {
      const m = exportRegex.exec(lines[i])
      if (m && m[1].localeCompare(name) > 0) {
        lines.splice(i, 0, barrelLine.trimEnd())
        inserted = true
        break
      }
    }
    const next = inserted ? lines.join('\n') : barrel.replace(/\n*$/, `\n${barrelLine}`)
    fs.writeFileSync(BARREL_FILE, next)
    console.log(`wired into ${path.relative(REPO_ROOT, BARREL_FILE)}`)
  }
}

console.log(`\nDone. Next: pnpm --filter @vyui/core exec vitest run src/components/${name}`)
