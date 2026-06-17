// Mock "AI" backend for the vyai demo. Nothing here calls a real model — it's
// a deterministic-ish canned-reply engine so the chat *feels* alive without a
// network. The composer drives the staging (thinking → streaming → done); this
// file just supplies the content.

export interface Model {
  id: string
  /** Short display name shown in the top island + model picker. */
  name: string
  /** One-line capability blurb under the name in the picker. */
  blurb: string
  icon: string
  /**
   * When set, replies are streamed from a local Ollama server using this model
   * name (e.g. `qwen3.5:9b`) instead of the canned mock engine below. See
   * `composables/useOllama.ts`.
   */
  ollamaModel?: string
}

// Three tongue-in-cheek "vyui" tiers, aping the usual mini / standard / pro
// model ladder, plus a real local model served by Ollama. `vyai` is the
// default middle tier; pick "qwen3.5 (local)" to chat with your own machine.
export const MODELS: Model[] = [
  { id: 'vyai-mini', name: 'vyai mini', blurb: 'Fastest — great for quick taps', icon: 'i-tabler-bolt' },
  { id: 'vyai', name: 'vyai', blurb: 'Smart, balanced, the daily driver', icon: 'i-tabler-sparkles' },
  { id: 'vyai-max', name: 'vyai max', blurb: 'Deepest reasoning, slower replies', icon: 'i-tabler-brain' },
  { id: 'ollama-qwen', name: 'qwen3.5 (local)', blurb: 'Runs on your machine via Ollama', icon: 'i-tabler-cpu', ollamaModel: 'qwen3.5:9b' },
]

export const DEFAULT_MODEL_ID = 'vyai'

// Empty-state prompt chips. Tapping one drops its `prompt` into the composer
// and sends it — the classic ChatGPT "Get started" grid.
export interface Suggestion {
  icon: string
  label: string
  prompt: string
}

/** Quick-tool entry in the composer's "+" tray. */
export interface Tool {
  icon: string
  label: string
}

export const TOOLS: Tool[] = [
  { icon: 'i-tabler-camera', label: 'Camera' },
  { icon: 'i-tabler-photo', label: 'Photos' },
  { icon: 'i-tabler-paperclip', label: 'Files' },
  { icon: 'i-tabler-world-search', label: 'Search the web' },
]

export const SUGGESTIONS: Suggestion[] = [
  { icon: 'i-tabler-code', label: 'Explain this code', prompt: 'Explain what a Lynx main-thread worklet is and why it matters.' },
  { icon: 'i-tabler-bulb', label: 'Brainstorm', prompt: 'Give me three names for a tongue-in-cheek AI demo app.' },
  { icon: 'i-tabler-pencil', label: 'Write a haiku', prompt: 'Write a haiku about building UI components.' },
  { icon: 'i-tabler-map', label: 'Plan something', prompt: 'Plan a focused two-hour session to learn vue-lynx.' },
]

// Claude-Code-style status copy. The thinking turn cycles through a few of
// these before the real reply streams in.
export const THINKING_PHRASES: ReadonlyArray<string> = [
  'Thinking…',
  'Pondering…',
  'Cogitating…',
  'Consulting the orb…',
  'Crunching tokens…',
  'Aligning the vibes…',
  'Untangling the prompt…',
  'Channeling the muse…',
  'Warming the GPUs…',
  'Sharpening the pencil…',
]

export function sampleThinking(count: number): string[] {
  const pool = [...THINKING_PHRASES]
  const out: string[] = []
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

// Keyword-matched canned replies. First matching rule wins; otherwise the
// generic fallback. Replies are plain multi-paragraph strings (Lynx <text>
// has no markdown) — split on \n\n at render time.
interface Rule {
  match: RegExp
  reply: string
}

const RULES: Rule[] = [
  {
    match: /\bhaiku\b/i,
    reply:
      'Slots align like glass —\n'
      + 'a worklet hums on the thread,\n'
      + 'the island unfolds.',
  },
  {
    match: /worklet|main.?thread/i,
    reply:
      'A main-thread worklet is a small function that Lynx runs on the UI thread instead of the background JS thread.\n\n'
      + 'That matters for gestures and animation: reading touch positions and writing styles on the same frame avoids the round-trip lag you get when the work hops back to the JS thread.\n\n'
      + 'The catch is they only see what gets bundled onto that thread — bare package imports can be skipped, so worklets sometimes have to live right next to where they are used.',
  },
  {
    match: /\bname(s)?\b/i,
    reply:
      'Here are three, leaning into the tongue-in-cheek angle:\n\n'
      + '1. vyai — you are already using it.\n'
      + '2. Orbit — for the little floating island that follows you around.\n'
      + '3. Hush — a quiet assistant that only speaks when spoken to.',
  },
  {
    match: /plan|learn|study/i,
    reply:
      'Here is a tight two-hour block:\n\n'
      + '0:00–0:20 — Skim the vue-lynx docs and run one example end to end.\n'
      + '0:20–1:10 — Rebuild a single component from scratch; break it on purpose.\n'
      + '1:10–1:45 — Wire a gesture or a worklet and watch it run on the simulator.\n'
      + '1:45–2:00 — Write down the three things that surprised you.',
  },
  {
    match: /\bhi\b|hello|hey|yo\b/i,
    reply: 'Hey! I am vyai — a pretend assistant built entirely from vyui components. Ask me anything and I will improvise something convincing.',
  },
]

const FALLBACKS: ReadonlyArray<string> = [
  'Good question. In a shipped build this is where a real model would answer — for now I am a handful of vyui components doing an impression of one.\n\nTry a suggestion chip to see me play along.',
  'I love the confidence of that prompt. I do not actually have a model behind me yet, but the typing animation is real and so is the island composer you used to send it.',
  'Here is my honest answer: I am a demo. Everything you see — the streaming text, the morphing island, the keyboard lift — is vyui. The intelligence is, regrettably, still on the roadmap.',
]

export function replyFor(prompt: string): string {
  for (const rule of RULES) {
    if (rule.match.test(prompt)) return rule.reply
  }
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]
}
