<script setup lang="ts">
import { computed, ref } from 'vue'
import { useColorMode, VyApp, VyButton } from '@vyui/kit'
import DeckList from './components/DeckList.vue'
import QuizScreen from './components/QuizScreen.vue'
import ScoreSummary from './components/ScoreSummary.vue'
import decksData from './data/decks.json'
import type { Deck } from './types'

const decks = decksData.decks as Deck[]

type Screen = 'decks' | 'quiz' | 'summary'

// Quiz progress lives HERE — above VyApp's `:key="mode"` remount — so toggling
// dark mode mid-quiz keeps your place (the app-root contract on `useColorMode`
// says to hoist state above the shell). Only the in-question selection is
// component-local.
const screen = ref<Screen>('decks')
const deckId = ref<string | null>(null)
const questionIndex = ref(0)
const results = ref<boolean[]>([])

const deck = computed(() => decks.find(d => d.id === deckId.value))

// Same singleton VyApp reads — toggling here re-skins the whole app through it.
const { isDark, toggle } = useColorMode()

// Fed by VyApp's viewport-change (BG layoutchange on the root view).
const isLandscape = ref(false)
function onViewportChange({ width, height }: { width: number, height: number }): void {
  isLandscape.value = width > height
}

function startQuiz(id: string): void {
  deckId.value = id
  questionIndex.value = 0
  results.value = []
  screen.value = 'quiz'
}

// Write by index (not push): a dark-mode remount resets the question's local
// selection, so an answer can be re-reported for the same index.
function onAnswered(correct: boolean): void {
  const next = [...results.value]
  next[questionIndex.value] = correct
  results.value = next
}

function onNext(): void {
  if (!deck.value) return
  if (questionIndex.value + 1 >= deck.value.questions.length)
    screen.value = 'summary'
  else
    questionIndex.value += 1
}

function backToDecks(): void {
  screen.value = 'decks'
  deckId.value = null
}

function retry(): void {
  questionIndex.value = 0
  results.value = []
  screen.value = 'quiz'
}
</script>

<template>
  <VyApp :radius="0.5" @viewport-change="onViewportChange">
    <scroll-view class="w-full h-full" scroll-orientation="vertical">
      <!-- Landscape caps the column width and centers it; portrait is full-bleed. -->
      <view class="flex flex-col w-full items-center">
        <view :class="['flex flex-col gap-4 w-full px-5 pt-16 pb-10', isLandscape ? 'max-w-xl' : '']">
          <view class="flex flex-row items-start justify-between gap-3">
            <view class="flex flex-col gap-1 flex-1 min-w-0">
              <text class="text-highlighted text-2xl font-bold">Study</text>
              <text class="text-muted text-sm">Flashcard quizzes for Vue, JS, TS and Lynx.</text>
            </view>
            <VyButton
              size="sm"
              color="neutral"
              variant="soft"
              square
              :icon="isDark ? 'lucide:sun' : 'lucide:moon'"
              @tap="toggle()"
            />
          </view>

          <DeckList v-if="screen === 'decks'" :decks="decks" @start="startQuiz" />

          <!-- Keyed per question: remounting resets the local selection state. -->
          <QuizScreen
            v-else-if="screen === 'quiz' && deck"
            :key="`${deck.id}-${questionIndex}`"
            :deck="deck"
            :index="questionIndex"
            @answered="onAnswered"
            @next="onNext"
            @quit="backToDecks"
          />

          <ScoreSummary
            v-else-if="screen === 'summary' && deck"
            :deck="deck"
            :results="results"
            @retry="retry"
            @done="backToDecks"
          />
        </view>
      </view>
    </scroll-view>
  </VyApp>
</template>
