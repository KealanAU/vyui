<script setup lang="ts">
import { ref } from 'vue'
import {
  Input,
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
  injectKeyboardAwareRootContext,
  injectKeyboardAwareTriggerContext,
} from '..'

const props = defineProps<{
  forceAttach?: boolean
}>()

const rootRef = ref<any>(null)
const value = ref('')

function flipKeyboard(status: 'on' | 'off') {
  rootRef.value?.__test_setKeyboardStatus(status, 300)
}
defineExpose({ flipKeyboard })
</script>

<template>
  <KeyboardAwareRoot
    ref="rootRef"
    :force-attach="props.forceAttach"
    data-testid="ka-root"
  >
    <KeyboardAwareResponder data-testid="ka-responder">
      <view data-testid="ka-content">
        <KeyboardAwareTrigger
          :offset="8"
          data-testid="ka-trigger"
        >
          <Input
            v-model="value"
            data-testid="ka-input"
            placeholder="type here"
          />
        </KeyboardAwareTrigger>
      </view>
    </KeyboardAwareResponder>
    <text data-testid="ka-value">{{ value }}</text>
  </KeyboardAwareRoot>
</template>
