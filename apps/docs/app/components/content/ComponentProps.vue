<script setup lang="ts">
const props = defineProps<{ name: string }>()
const api = useComponentApi(props.name)
</script>

<template>
  <div v-if="api?.props?.length" class="not-prose my-4 overflow-x-auto rounded-lg border border-default">
    <table class="w-full text-sm">
      <thead class="bg-elevated/50 text-left text-muted">
        <tr>
          <th class="px-3 py-2 font-medium">Prop</th>
          <th class="px-3 py-2 font-medium">Default</th>
          <th class="px-3 py-2 font-medium">Type</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-for="p in api.props" :key="p.name" class="align-top">
          <td class="px-3 py-2 whitespace-nowrap">
            <code class="text-primary">{{ p.name }}</code>
            <span v-if="p.required" class="text-error">*</span>
          </td>
          <td class="px-3 py-2 whitespace-nowrap">
            <code v-if="p.default" class="text-muted">{{ p.default }}</code>
            <span v-else class="text-dimmed">—</span>
          </td>
          <td class="px-3 py-2">
            <code class="text-highlighted">{{ p.type }}</code>
            <p v-if="p.description" class="mt-1 text-muted whitespace-pre-line">{{ p.description }}</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="text-sm text-muted italic">No props.</p>
</template>
