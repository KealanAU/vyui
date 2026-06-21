interface PropDoc {
  name: string
  type: string
  required: boolean
  default?: string
  description?: string
}
interface EventDoc { name: string, type: string, description?: string }
interface SlotDoc { name: string, type: string, description?: string }
export interface ComponentApi { props: PropDoc[], events: EventDoc[], slots: SlotDoc[] }

// Eagerly load every generated API JSON; key by component name (file basename).
const modules = import.meta.glob<{ default: ComponentApi }>(
  '../generated/api/*.json',
  { eager: true },
)

const byName: Record<string, ComponentApi> = {}
for (const [path, mod] of Object.entries(modules)) {
  const name = path.split('/').pop()!.replace(/\.json$/, '')
  byName[name] = mod.default
}

export function useComponentApi(name: string): ComponentApi | undefined {
  return byName[name]
}
