<script setup lang="ts">
import {
  VyInput,
  VyKeyboardAwareResponder,
  VyKeyboardAwareRoot,
} from '@vyui/kit'
</script>

<template>
  <VyKeyboardAwareRoot>
    <VyKeyboardAwareResponder>
      <VyInput placeholder="Message" />
    </VyKeyboardAwareResponder>
  </VyKeyboardAwareRoot>
</template>
