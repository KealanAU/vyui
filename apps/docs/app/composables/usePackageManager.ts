// Tab order of every `::code-group{sync="pm"}` — Nuxt UI persists the tab
// index, not its label, so each synced group must list exactly these, in order.
const MANAGERS = [
  { add: 'pnpm add', dlx: 'pnpm dlx' },
  { add: 'yarn add', dlx: 'yarn dlx' },
  { add: 'bun add', dlx: 'bunx' },
  { add: 'npm i', dlx: 'npx' },
] as const

const NPM = 3
const KEY = 'code-group-pm'

export function usePackageManager() {
  const index = useState<string | null>(KEY, () => null)

  // Claiming the key during SSR skips Nuxt UI's own localStorage initialiser.
  onMounted(() => {
    index.value ??= localStorage.getItem(KEY)
  })

  const manager = computed(() => MANAGERS[Number(index.value ?? NPM)] ?? MANAGERS[NPM])

  return {
    add: computed(() => manager.value.add),
    dlx: computed(() => manager.value.dlx),
  }
}
