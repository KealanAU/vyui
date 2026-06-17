import { ref } from 'vue'

// Module-level singleton so the burger (TopBar), the under-sheet panel
// (ConversationsDrawer) and the sliding shell (App) all read/write the same
// open flag without prop-drilling. Mirrors the useChat pattern.
const open = ref(false)

export function useDrawer() {
  return {
    open,
    toggle: () => { open.value = !open.value },
    close: () => { open.value = false },
  }
}
