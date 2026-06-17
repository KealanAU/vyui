<script setup lang="ts">
import { computed, ref } from 'vue'
import { VyIcon, VyInput, VyIsland, VyIslandButton } from '@vyui/kit'
import { MODELS, TOOLS } from '../data/chat'
import { useChat } from '../composables/useChat'
import ComposerActions from '../components/ComposerActions.vue'
import ModelPill from '../components/ModelPill.vue'
import ModelMenu from '../components/ModelMenu.vue'
import ToolsTray from '../components/ToolsTray.vue'

const { isResponding, modelId, activeModel, thinking, setModel, setThinking, send, stop } = useChat()

const input = ref('')

// Island row mode: 'default' = compose, 'voice' = the listening takeover.
const mode = ref<string>('default')
// Panel expansion + which content fills it. The "+" button and the model
// pill share the single island panel, so `panel` tracks who opened it.
const open = ref(false)
const panel = ref<'tools' | 'models'>('tools')

// Toggle the shared panel to a given content. Re-tapping the active opener
// closes it; tapping the other opener swaps the content without closing.
function togglePanel(which: 'tools' | 'models') {
  if (open.value && panel.value === which) {
    open.value = false
    return
  }
  panel.value = which
  open.value = true
}

function pickModel(id: string) {
  setModel(id)
  open.value = false
}

const hasText = computed(() => input.value.trim().length > 0)

function onSend() {
  if (!hasText.value || isResponding.value) return
  send(input.value)
  input.value = ''
}

// --- Keyboard lift -------------------------------------------------------
// The composer sits in normal flow at the bottom of a flex column (see
// App.vue). When the keyboard opens we grow a spacer BELOW the bar by the
// keyboard height; the flex column then pushes the bar up by that much.
//
// Height comes from VyInput's normalized `@keyboard` event — the reliable
// keyboard signal under vue-lynx (the global `keyboardstatuschanged` event is
// not delivered to the runtime). See docs/upstream/vue-lynx-keyboard.md.
const kbHeight = ref(0)

function onKeyboard(info: { visible: boolean, height: number }) {
  kbHeight.value = info?.visible ? info.height : 0
}

// Fake voice flow: morph the row to a listening pill, then "transcribe" a
// canned prompt and send it after a beat. The X cancels early.
const VOICE_PROMPT = 'What would a tongue-in-cheek AI assistant say about itself?'
let voiceTimer: ReturnType<typeof setTimeout> | null = null

function startVoice() {
  open.value = false
  mode.value = 'voice'
  voiceTimer = setTimeout(() => {
    if (mode.value !== 'voice') return
    mode.value = 'default'
    send(VOICE_PROMPT)
  }, 2600)
}

function cancelVoice() {
  if (voiceTimer) clearTimeout(voiceTimer)
  voiceTimer = null
  mode.value = 'default'
}
</script>

<template>
  <!-- Composer in normal flow at the bottom of App's flex column. The spacer
       below grows to the keyboard height, pushing this bar up. -->
  <view class="shrink-0">
    <view class="px-3 pb-6 pt-2">
      <!-- Float treatment rides the ROOT (not the row) so it wraps the whole
           island as one continuous edge — including the panel when it pops out
           in attached mode. `border-0` on the row drops the kit's own hairline
           so there's no double edge inside the root border. -->
      <VyIsland
        layer="inline"
        size="lg"
        expand-style="attached"
        v-model:open="open"
        v-model:mode="mode"
        :ui="{
          root: 'w-full rounded-3xl vyai-float',
          row: 'w-full flex-col items-stretch gap-2 rounded-3xl border-0',
        }"
      >
        <!-- Compose row: [+ tools] [input] [send / stop / mic] -->
        <view class="flex flex-row items-center gap-1.5 w-full">
          <VyIslandButton icon="i-tabler-plus" @tap="togglePanel('tools')" />

          <view class="flex-1">
            <VyInput
              v-model="input"
              variant="none"
              placeholder="Message vyai"
              confirm-type="send"
              class="w-full bg-transparent"
              :ui="{ root: 'px-2 gap-1' }"
              @confirm="onSend"
              @keyboard="onKeyboard"
            />
          </view>

          <ComposerActions
            :is-responding="isResponding"
            :has-text="hasText"
            @send="onSend"
            @stop="stop"
            @voice="startVoice"
          />
        </view>

        <!-- Model pill, parked under the compose row. Tap opens the shared
             island panel filled with the model picker. -->
        <ModelPill
          :model="activeModel"
          :open="open && panel === 'models'"
          :can-think="!!activeModel.ollamaModel"
          :thinking="thinking"
          @tap="togglePanel('models')"
          @toggle-think="setThinking"
        />

        <!-- Voice takeover row. -->
        <template #voice>
          <view class="flex flex-row items-center gap-3 flex-1 px-2">
            <view class="size-9 rounded-full bg-red-500 flex items-center justify-center vyai-breathe">
              <VyIcon name="i-tabler-microphone" :size="20" color="#ffffff" />
            </view>
            <text class="flex-1 text-slate-500 text-[15px] vyai-breathe">Listening…</text>
          </view>
          <view
            class="size-9 rounded-full bg-slate-100 flex items-center justify-center"
            @tap="cancelVoice"
          >
            <VyIcon name="i-tabler-x" :size="20" color="#334155" />
          </view>
        </template>

        <!-- Shared panel — grows above the composer. Content swaps with
             `panel`: the "+" tools tray, or the model picker. -->
        <template #expanded>
          <ModelMenu
            v-if="panel === 'models'"
            :models="MODELS"
            :selected-id="modelId"
            @select="pickModel"
          />
          <ToolsTray
            v-else
            :tools="TOOLS"
            @select="open = false"
            @voice="startVoice"
          />
        </template>
      </VyIsland>
    </view>

    <!-- Keyboard spacer — grows to the keyboard height, pushing the bar up. -->
    <view :style="{ height: `${kbHeight}px` }" />
  </view>
</template>
