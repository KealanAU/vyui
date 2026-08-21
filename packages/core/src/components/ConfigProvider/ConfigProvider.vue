<script lang="ts">
import type { Ref } from 'vue'
import type { Direction } from '@/shared/types'
import { createContext } from '@/shared'

interface ConfigProviderContextValue {
  dir?: Ref<Direction>
  locale?: Ref<string>
}

export const [injectConfigProviderContext, provideConfigProviderContext]
  = createContext<ConfigProviderContextValue>('ConfigProvider')

export interface ConfigProviderProps {
  /** The global reading direction of your application. This will be inherited by all primitives.
   *  @defaultValue 'ltr' */
  dir?: Direction
  /** The global locale of your application. This will be inherited by all primitives.
   *  @defaultValue 'en' */
  locale?: string
}
</script>

<script setup lang="ts">
import { toRefs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ConfigProviderProps>(), {
  dir: 'ltr',
  locale: 'en',
})

const { dir, locale } = toRefs(props)

provideConfigProviderContext({
  dir,
  locale,
})
</script>

<template>
  <slot />
</template>
