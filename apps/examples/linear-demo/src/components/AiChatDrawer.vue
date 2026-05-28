<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { VyButton, VyDrawer, VyInput, VyIslandButton } from '@vyui/kit'
import ChatMessage, { type ChatRole, type ChatState } from './ChatMessage.vue'

interface ChatTurn {
  role: ChatRole
  text: string
  state: ChatState
}

// Plain ref instead of `defineModel` because the parent (`BottomDock`)
// never binds `v-model:open`. With defineModel, Vue 3.5's `useModel` runs
// a `watchSyncEffect` that resets the local value to `props.open` whenever
// they differ — and since `props.open` permanently resolves to the
// `default: false` (no parent binding), any reactive update in the tree
// causes the model to snap back to false right after the open animation
// completes. See @vue/runtime-core useModel source for the resetting
// watchSyncEffect.
const open = ref(false)

const input = ref('')
const inputRef = ref<any>(null)
const messages = ref<ChatTurn[]>([
  { role: 'assistant', text: 'Hey — what would you like to do?', state: 'done' },
])

// Mirrors NewIssueDrawer: focusing the input the moment the drawer opens
// pre-fires the iOS keyboard so the user lands ready to type. nextTick lets
// SheetContent mount the input element before we reach in.
watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  inputRef.value?.inputRef?.focus?.()
})

/**
 * Demo reply: vyui isn't shipped, so every prompt eventually resolves to
 * "Coming soon." after the thinking shimmer plays out. The rule list /
 * regex matcher was removed once we decided we don't want to imply the
 * assistant can actually answer anything.
 */
const DEMO_REPLY = 'Coming soon — vyui isn’t shipped yet.'

/**
 * Claude-Code-style status copy. The thinking turn cycles through five of
 * these before the real reply lands, with each phrase rendered as a bare
 * shimmering line (see `ChatMessage` thinking branch).
 */
const THINKING_PHRASES: ReadonlyArray<string> = [
  'Thinking…',
  'Pondering…',
  'Cogitating…',
  'Consulting the orb…',
  'Crunching tokens…',
  'Aligning the vibes…',
  'Untangling the prompt…',
  'Channeling the muse…',
  'Rummaging in the inbox…',
  'Sharpening the pencil…',
]

function sampleThinking(count: number): string[] {
  const pool = [...THINKING_PHRASES]
  const out: string[] = []
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

const PHRASE_INTERVAL_MS = 450

// Drives the assistant turn through thinking → typing → done. Thinking
// rotates through five random phrases (sans bubble), then the real reply
// slides into the bubble under a brief pulse before settling.
//
// All mutations route through `messages.value[idx]` so they go through Vue's
// reactive proxy — mutating the original object reference captured at push
// time would skip the proxy and the phrase rotation would never re-render.
function send() {
  const text = input.value.trim()
  if (!text)
    return
  messages.value.push({ role: 'user', text, state: 'done' })
  input.value = ''

  const reply = DEMO_REPLY
  const phrases = sampleThinking(5)
  const idx = messages.value.length
  messages.value.push({ role: 'assistant', text: phrases[0], state: 'thinking' })

  for (let i = 1; i < phrases.length; i++) {
    setTimeout(() => {
      const t = messages.value[idx]
      if (t && t.state === 'thinking')
        t.text = phrases[i]
    }, i * PHRASE_INTERVAL_MS)
  }

  const thinkingDuration = phrases.length * PHRASE_INTERVAL_MS
  setTimeout(() => {
    const t = messages.value[idx]
    if (!t) return
    t.text = reply
    t.state = 'typing'
  }, thinkingDuration)
  setTimeout(() => {
    const t = messages.value[idx]
    if (t) t.state = 'done'
  }, thinkingDuration + Math.min(1200, 200 + reply.length * 25))
}
</script>

<template>
  <VyDrawer
    v-model:open="open"
    title="Ask AI"
    description="vyui assistant"
    keyboard-aware
    :ui="{ footer: 'p-0' }"
  >
    <VyIslandButton icon="i-tabler-sparkles" />

    <template #body>
      <view class="flex flex-col gap-3 px-4 py-3">
        <ChatMessage
          v-for="(msg, i) in messages"
          :key="i"
          :role="msg.role"
          :text="msg.text"
          :state="msg.state"
        />
      </view>
    </template>

    <template #footer>
      <!-- Mirror NewIssueDrawer's working pattern: VyInput sits alone in a
           `flex-1` cell so `w-full` resolves the same way it does in a
           flex-col body — the cell IS its block context. The send button
           is a sibling (not in the trailing slot), shrink-0 by default,
           keeping VyInput's internal flex chain clean. `confirmType`
           defaults to `send` so the iOS return key is already labelled. -->
      <view class="flex flex-row items-center w-full py-2 border-t border-slate-100 bg-white">
        <view class="flex-1">
          <!-- HACK: forced 28rem width for the demo video; Lynx flex isn't
               sizing the input correctly in this footer context. Revisit
               and remove once the upstream layout fix lands. -->
          <VyInput
            ref="inputRef"
            v-model="input"
            variant="none"
            placeholder="Ask anything…"
            class="w-[28rem] bg-transparent"
            :ui="{ root: 'px-2 gap-1' }"
            @confirm="send"
          />
        </view>
        <!-- `square` forces uniform `p-2` padding so the ghost send icon
             reads as an even box. The upstream auto-square for icon-only
             buttons handles this generally but ships from the prebuilt
             dist — explicit `square` keeps the demo correct on a stale
             @vyui/kit build. -->
        <VyButton
          variant="ghost"
          icon="icon-park-outline:send"
          square
          :disabled="!input"
          @tap="send"
        />
      </view>
    </template>
  </VyDrawer>
</template>
