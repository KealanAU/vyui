<script setup lang="ts">
const props = defineProps<{ name: string }>()
const api = useComponentApi(props.name)
</script>

<template>
  <div v-if="api?.slots?.length" class="not-prose my-4 overflow-x-auto rounded-lg border border-default">
    <table class="w-full text-sm">
      <thead class="bg-elevated/50 text-left text-muted">
        <tr>
          <th class="px-3 py-2 font-medium">Slot</th>
          <th class="px-3 py-2 font-medium">Bindings</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-for="s in api.slots" :key="s.name" class="align-top">
          <td class="px-3 py-2 whitespace-nowrap"><code class="text-primary">{{ s.name }}</code></td>
          <td class="px-3 py-2">
            <code class="text-highlighted">{{ s.type }}</code>
            <p v-if="s.description" class="mt-1 text-muted whitespace-pre-line">{{ s.description }}</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="text-sm text-muted italic">No slots.</p>
</template>
