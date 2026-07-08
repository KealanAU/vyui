import type { Color } from '@vyui/kit'

export interface Question {
  prompt: string
  choices: string[]
  /** Index into `choices`. */
  answer: number
}

export interface Deck {
  id: string
  title: string
  description: string
  /** Iconify name (lucide set — the only one registered in index.ts). */
  icon: string
  /** Semantic color used for the deck's accent (buttons, progress, icon). */
  color: Color
  questions: Question[]
}
