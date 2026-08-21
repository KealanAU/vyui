<script setup lang="ts">
import { ref } from 'vue'
import SwitchRoot from '../SwitchRoot.vue'
import SwitchThumb from '../SwitchThumb.vue'

const checked = ref(false)
</script>

<template>
  <text>{{ checked ? "checked" : "unchecked" }}</text>
  <text>Airplane mode</text>
  <SwitchRoot
    id="airplane-mode"
    v-model="checked"
    accessibility-label="Airplane mode"
    data-testId="root"
    name="test"
    value="true"
  >
    <SwitchThumb data-testId="thumb" />
  </SwitchRoot>
</template>
