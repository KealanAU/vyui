import type { Color } from '@vyui/kit'

export interface Question {
  prompt: string
  choices: string[]
  /** Index into `choices`. */
  answer: number
}

/**
 * Deck accent → text utility, as LITERAL strings: Tailwind's scanner only
 * keeps class names it can see whole in source, so `text-${deck.color}`
 * would be purged (the preset safelist only covers the shaded forms).
 */
export const DECK_TEXT_CLASS: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  error: 'text-error',
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
