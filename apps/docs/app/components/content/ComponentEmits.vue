<script setup lang="ts">
const props = defineProps<{ name: string }>()
const api = useComponentApi(props.name)
</script>

<template>
  <div v-if="api?.events?.length" class="not-prose my-4 overflow-x-auto rounded-lg border border-default">
    <table class="w-full text-sm">
      <thead class="bg-elevated/50 text-left text-muted">
        <tr>
          <th class="px-3 py-2 font-medium">Event</th>
          <th class="px-3 py-2 font-medium">Payload</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-for="e in api.events" :key="e.name" class="align-top">
          <td class="px-3 py-2 whitespace-nowrap"><code class="text-primary">{{ e.name }}</code></td>
          <td class="px-3 py-2">
            <code class="text-highlighted">{{ e.type }}</code>
            <p v-if="e.description" class="mt-1 text-muted whitespace-pre-line">{{ e.description }}</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="text-sm text-muted italic">No emitted events.</p>
</template>
