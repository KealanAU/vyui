import { computed, ref } from 'vue'

// In-memory settings store. API keys live here for the lifetime of the app and
// are cleared on reload — nothing is persisted to device storage. Module-level
// singleton so the sidebar (opener), the settings sheet (editor) and useChat
// (consumer) all share one source of truth, mirroring useChat / useDrawer.

const anthropicKey = ref('')
const openaiKey = ref('')

// Settings sheet visibility — driven from the sidebar's Settings row.
const open = ref(false)

const hasAnthropicKey = computed(() => anthropicKey.value.trim().length > 0)
const hasOpenAiKey = computed(() => openaiKey.value.trim().length > 0)

export function useSettings() {
  return {
    anthropicKey,
    openaiKey,
    hasAnthropicKey,
    hasOpenAiKey,
    open,
    openSettings: () => { open.value = true },
    closeSettings: () => { open.value = false },
  }
}
