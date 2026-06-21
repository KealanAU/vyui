<script setup lang="ts">
import {
  VyInput,
  VyKeyboardAwareResponder,
  VyKeyboardAwareRoot,
  VyKeyboardAwareTrigger,
} from '@vyui/kit'
</script>

<template>
  <VyKeyboardAwareRoot>
    <VyKeyboardAwareResponder>
      <VyKeyboardAwareTrigger :offset="16">
        <VyInput placeholder="Message" />
      </VyKeyboardAwareTrigger>
    </VyKeyboardAwareResponder>
  </VyKeyboardAwareRoot>
</template>
