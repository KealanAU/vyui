<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { VyBadge, VyDrawer, VyInput, VyIslandButton, VyTextarea } from '@vyui/kit'
import IssueAttributeChips from './IssueAttributeChips.vue'

// Plain ref instead of `defineModel`. The parent (`TopBar`) never binds
// `v-model:open`, and Vue 3.5's `useModel` runs a `watchSyncEffect` that
// resets the local value to `props.open` whenever they differ — since
// `props.open` permanently resolves to `default: false` (no parent
// binding), any reactive update in the tree causes the model to snap
// back to false right after the open animation completes.
const open = ref(false)

const title = ref('')
const body = ref('')
const status = ref('Backlog')
const priority = ref('No priority')
const assignee = ref('Unassigned')
const label = ref('No label')

const titleInputRef = ref<any>(null)

// Pull focus to the title field as soon as the drawer opens so the iOS
// keyboard rises with the cursor already in place. nextTick gives
// SheetContent a frame to mount before we reach in.
watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  titleInputRef.value?.inputRef?.focus?.()
})

function reset() {
  title.value = ''
  body.value = ''
  status.value = 'Backlog'
  priority.value = 'No priority'
  assignee.value = 'Unassigned'
  label.value = 'No label'
}

function save(close: () => void) {
  if (!title.value)
    return
  close()
  reset()
}
</script>

<template>
  <VyDrawer
    v-model:open="open"
    title="New issue"
    description="vyui · drafts save to inbox"
    :ui="{ body: 'flex-1 overflow-y-auto p-0' }"
  >
    <!-- Trigger: tapping the island button bubbles through SheetTrigger
         to flip `open`. Hyphenated iconify prefixes (`icon-park-outline`)
         require the colon form. -->
    <VyIslandButton icon="icon-park-outline:edit-two" />

    <template #body="{ close }">
      <!-- Body padding is killed via `:ui.body = p-0` so the chip
           scroll-view can run flush to the drawer's edges. Inputs get a
           padded wrapper of their own; chips sit outside it. -->
      <view class="flex flex-col gap-2">
        <view class="flex flex-col gap-2 px-4 pt-2">
          <VyInput
            ref="titleInputRef"
            v-model="title"
            variant="none"
            placeholder="Issue title"
            confirm-type="send"
            class="w-full text-lg font-semibold px-0"
            @confirm="save(close)"
          />
          <VyTextarea
            v-model="body"
            variant="none"
            :rows="2"
            placeholder="Add description…"
            class="w-full px-0"
          />
        </view>
        <!-- Horizontal scroller: chips overflow off the right edge and
             swipe. Save lives inline (not inside IssueAttributeChips) —
             that SFC is `defineModel`-only per
             [[feedback_vue_lynx_mergemodels]]. -->
        <scroll-view
          class="w-full pt-2 pb-4"
          scroll-orientation="horizontal"
          scroll-bar-enable="false"
        >
          <view class="flex flex-row items-center gap-2">
            <IssueAttributeChips
              v-model:status="status"
              v-model:priority="priority"
              v-model:assignee="assignee"
              v-model:label="label"
            />
            <VyBadge
              class="shrink-0"
              size="lg"
              variant="solid"
              color="neutral"
              leading-icon="icon-park-outline:check"
              label="Save"
              @tap="save(close)"
            />
          </view>
        </scroll-view>
      </view>
    </template>

    <!-- Footer intentionally empty: Save lives inline with the chip row so
         it stays above the iOS keyboard. Drag-down / backdrop-tap cancels. -->
    <template #footer>
      <view />
    </template>
  </VyDrawer>
</template>
