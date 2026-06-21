<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

// Page-level actions for docs pages: copy the raw markdown, view it, or open it
// in an AI assistant. Mirrors the Nuxt UI docs header actions. Relies on the
// `/raw/*.md` server route.
const route = useRoute()
const toast = useToast()
const { copy, copied } = useClipboard()
const { public: { siteUrl } } = useRuntimeConfig()

const rawPath = computed(() => `/raw${route.path.replace(/\/$/, '')}.md`)
const mdUrl = computed(() => `${siteUrl}${rawPath.value}`)
const aiPrompt = computed(() =>
  `I'm looking at this Vy UI documentation: ${mdUrl.value}\nHelp me understand how to use it. Be ready to explain concepts, give examples, or help debug based on it.`,
)

const items = computed(() => [{
  label: 'Copy Markdown link',
  icon: 'i-lucide-link',
  onSelect() {
    copy(mdUrl.value)
    toast.add({ title: 'Copied to clipboard', icon: 'i-lucide-circle-check' })
  },
}, {
  label: 'View as Markdown',
  icon: 'i-simple-icons-markdown',
  target: '_blank',
  to: rawPath.value,
}, {
  label: 'Open in ChatGPT',
  icon: 'i-simple-icons-openai',
  target: '_blank',
  to: `https://chatgpt.com/?prompt=${encodeURIComponent(aiPrompt.value)}`,
}, {
  label: 'Open in Claude',
  icon: 'i-simple-icons-anthropic',
  target: '_blank',
  to: `https://claude.ai/new?q=${encodeURIComponent(aiPrompt.value)}`,
}])

async function copyPage() {
  copy(await $fetch<string>(rawPath.value))
  toast.add({ title: 'Page copied as Markdown', icon: 'i-lucide-circle-check' })
}
</script>

<template>
  <UFieldGroup>
    <UButton
      label="Copy page"
      :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      color="neutral"
      variant="outline"
      :ui="{ leadingIcon: [copied ? 'text-primary' : 'text-neutral', 'size-3.5'] }"
      @click="copyPage"
    />
    <UDropdownMenu
      :items="items"
      :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
      :ui="{ content: 'w-48' }"
    >
      <UButton
        icon="i-lucide-chevron-down"
        size="sm"
        color="neutral"
        variant="outline"
        aria-label="Open copy actions menu"
      />
    </UDropdownMenu>
  </UFieldGroup>
</template>
