import { computed, ref } from 'vue'
import { DEFAULT_MODEL_ID, MODELS, replyFor, sampleThinking } from '../data/chat'
import { ollamaChat, OllamaAbortError, type OllamaMessage } from './useOllama'
import { anthropicChat, openaiChat, ProviderAbortError } from './useProviders'
import { useSettings } from './useSettings'

export type ChatRole = 'user' | 'assistant'

/**
 * `thinking` renders a single shimmering status line (no bubble) while the
 * turn cycles through cheeky placeholder phrases. `streaming` appends the
 * reply word-by-word into the bubble for the live-typing beat. `done` is the
 * resting state.
 */
export type ChatState = 'thinking' | 'streaming' | 'done'

export interface ChatTurn {
  id: number
  role: ChatRole
  text: string
  state: ChatState
  /**
   * Live reasoning trace for thinking-enabled Ollama turns. Accumulates while
   * the model reasons (state `thinking`) and is kept afterwards so the answer
   * can show an expandable "thought process". Undefined for normal turns.
   */
  thinking?: string
}

/** A past conversation listed in the left drawer. */
export interface Conversation {
  id: number
  title: string
  /** Snapshot of the thread, replayed verbatim when reopened. */
  messages: ChatTurn[]
}

const PHRASE_INTERVAL_MS = 420

// Streaming cadence. The reply reveals a word at a time, but each word's dwell
// scales with its length (a target characters-per-second) so the flow reads as
// an even, unhurried stream rather than uneven word bursts — the calm pacing the
// hosted models have. Punctuation adds a short, human pause on top.
const STREAM_CPS = 28 // target characters/second — lower = calmer/slower
const MS_PER_CHAR = 1000 / STREAM_CPS
const MIN_WORD_MS = 55 // floor so tiny words ("a", "to") don't flicker past
const SENTENCE_PAUSE_MS = 280 // after . ! ?
const CLAUSE_PAUSE_MS = 130 // after , ; :
const NEWLINE_PAUSE_MS = 200 // at paragraph breaks

// Module-level singleton so every section (thread, composer, top bar) reads
// and writes the SAME conversation without prop-drilling through App.
let uid = 0
const messages = ref<ChatTurn[]>([])
const modelId = ref<string>(DEFAULT_MODEL_ID)
// User-facing toggle for reasoning models (Ollama only). Off by default: fast,
// direct replies. On: the model reasons first (slower) — see useOllama.
const thinking = ref(false)

// Drawer history. Seeded with a few canned threads so the menu looks lived-in
// on first launch; real conversations get archived in front of these on
// `newChat` / `openConversation`. No persistence — it's a demo, resets on
// reload. Seed messages are all `done` so reopening one renders instantly.
function turn(role: ChatRole, text: string): ChatTurn {
  return { id: uid++, role, text, state: 'done' }
}

const conversations = ref<Conversation[]>([
  {
    id: uid++,
    title: 'Haiku about UI components',
    messages: [
      turn('user', 'Write a haiku about building UI components.'),
      turn('assistant', 'Slots align like glass —\na worklet hums on the thread,\nthe island unfolds.'),
    ],
  },
  {
    id: uid++,
    title: 'Names for an AI demo',
    messages: [
      turn('user', 'Give me three names for a tongue-in-cheek AI demo app.'),
      turn('assistant', 'Here are three: vyai, Orbit, and Hush.'),
    ],
  },
  {
    id: uid++,
    title: 'Two-hour vue-lynx plan',
    messages: [
      turn('user', 'Plan a focused two-hour session to learn vue-lynx.'),
      turn('assistant', 'Start by skimming the docs and running one example end to end…'),
    ],
  },
  {
    id: uid++,
    title: 'What is a main-thread worklet',
    messages: [
      turn('user', 'Explain what a Lynx main-thread worklet is and why it matters.'),
      turn('assistant', 'A main-thread worklet is a small function that Lynx runs on the UI thread…'),
    ],
  },
])
// The thread currently on screen, if it came from history — lets us update its
// snapshot in place instead of forking a duplicate when archived again.
const activeConversationId = ref<number | null>(null)
// True from the moment a prompt is sent until the reply finishes streaming —
// drives the composer's send→stop swap and disables double-sends.
const isResponding = ref(false)

// In-flight Ollama request (so `stop` can cancel it) and the thinking-phrase
// rotator (so we can stop cycling once the reply lands or the user bails).
let abortController: AbortController | null = null
let thinkingTimer: ReturnType<typeof setInterval> | null = null

function clearThinking() {
  if (thinkingTimer) {
    clearInterval(thinkingTimer)
    thinkingTimer = null
  }
}

const activeModel = computed(() => MODELS.find(m => m.id === modelId.value) ?? MODELS[1])
const isEmpty = computed(() => messages.value.length === 0)

function setModel(id: string) {
  modelId.value = id
}

function setThinking(on: boolean) {
  thinking.value = on
}

// Derive a drawer title from the first user line, trimmed to a tidy length.
function titleFor(turns: ChatTurn[]): string {
  const first = turns.find(t => t.role === 'user')?.text?.trim()
  if (!first) return 'New chat'
  return first.length > 40 ? `${first.slice(0, 40)}…` : first
}

// Fold the on-screen thread back into the drawer list (front of stack) so it
// survives a New Chat / switch. Reuses the slot if this thread was opened from
// history; otherwise prepends a fresh entry. No-ops on an empty thread.
function archiveCurrent() {
  if (messages.value.length === 0) return
  const snapshot = messages.value.map(t => ({ ...t }))
  const existing = conversations.value.find(c => c.id === activeConversationId.value)
  if (existing) {
    existing.title = titleFor(snapshot)
    existing.messages = snapshot
    // Bubble it to the top — most-recent-first ordering.
    conversations.value = [existing, ...conversations.value.filter(c => c !== existing)]
  }
  else {
    conversations.value = [
      { id: uid++, title: titleFor(snapshot), messages: snapshot },
      ...conversations.value,
    ]
  }
}

function newChat() {
  stop()
  archiveCurrent()
  messages.value = []
  activeConversationId.value = null
  isResponding.value = false
}

// Open a past thread from the drawer: park the current one, then replay the
// selected snapshot. Cloning keeps the live thread from mutating the archive.
function openConversation(id: number) {
  const conv = conversations.value.find(c => c.id === id)
  if (!conv) return
  if (conv.id === activeConversationId.value) return
  stop()
  archiveCurrent()
  messages.value = conv.messages.map(t => ({ ...t }))
  activeConversationId.value = conv.id
  isResponding.value = false
}

// Halt the in-flight turn. The scheduled timeouts bail once `isResponding` is
// false (thinking-phase guard) or the turn leaves the `streaming` state (the
// word-tick guard), so flipping both here is enough to stop cleanly.
function stop() {
  if (!isResponding.value) return
  isResponding.value = false
  abortController?.abort()
  abortController = null
  clearThinking()
  const last = messages.value[messages.value.length - 1]
  if (last && last.role === 'assistant' && last.state !== 'done') {
    if (last.state === 'thinking') last.text = 'Stopped.'
    last.state = 'done'
  }
}

// Cycle the cheeky thinking copy until the reply lands. Mutations go through
// `messages.value[idx]` so they hit Vue's reactive proxy (mutating a captured
// object ref skips it). Indefinite (loops the phrases) because a real model can
// take longer than the canned list; the caller clears it via `clearThinking`.
function startThinking(idx: number, phrases: string[]) {
  let i = 0
  thinkingTimer = setInterval(() => {
    const t = messages.value[idx]
    if (!t || t.state !== 'thinking') return clearThinking()
    i = (i + 1) % phrases.length
    t.text = phrases[i]
  }, PHRASE_INTERVAL_MS)
}

// Reveal the finished reply with a calm, even cadence. Each token is a word
// WITH its trailing whitespace (so spacing survives and there are no empty
// "whitespace ticks" that made the old word-by-word feel jerky). A token's dwell
// is proportional to its length — keeping a steady characters-per-second feel
// instead of uneven word bursts — with a small extra pause after sentence- and
// clause-ending punctuation so it breathes like the hosted models do.
function streamReply(idx: number, reply: string) {
  const t = messages.value[idx]
  if (!t || !isResponding.value) return
  t.text = ''
  t.state = 'streaming'

  // word(+trailing spaces) | run of whitespace — reproduces the text exactly.
  const tokens = (reply ?? '').match(/\S+\s*|\s+/g) ?? []
  let w = 0
  const tick = () => {
    const cur = messages.value[idx]
    if (!cur || cur.state !== 'streaming') return
    const tok = tokens[w]
    cur.text += tok
    w++
    if (w >= tokens.length) {
      cur.state = 'done'
      isResponding.value = false
      return
    }
    let delay = Math.max(MIN_WORD_MS, tok.length * MS_PER_CHAR)
    const lastVisible = tok.trimEnd().slice(-1)
    if ('.!?'.includes(lastVisible)) delay += SENTENCE_PAUSE_MS
    else if (',;:'.includes(lastVisible)) delay += CLAUSE_PAUSE_MS
    if (tok.includes('\n')) delay += NEWLINE_PAUSE_MS
    setTimeout(tick, delay)
  }
  tick()
}

function send(raw: string) {
  const text = raw.trim()
  if (!text || isResponding.value) return

  messages.value.push({ id: uid++, role: 'user', text, state: 'done' })

  // Snapshot the conversation for a real model before we add the placeholder.
  const history: OllamaMessage[] = messages.value
    .filter(t => t.state === 'done')
    .map(t => ({ role: t.role, content: t.text }))

  const phrases = sampleThinking(4)
  const idx = messages.value.length
  messages.value.push({ id: uid++, role: 'assistant', text: phrases[0], state: 'thinking' })
  isResponding.value = true
  startThinking(idx, phrases)

  // Hosted brand model (Claude / OpenAI). Needs a key from Settings — without
  // one we fall back to the mock engine so the demo still answers, nudging the
  // user toward Settings. With a key, call the real provider.
  const provider = activeModel.value.provider
  if (provider) {
    const { anthropicKey, openaiKey } = useSettings()
    const apiKey = (provider === 'anthropic' ? anthropicKey.value : openaiKey.value).trim()
    if (!apiKey) {
      const label = provider === 'anthropic' ? 'Anthropic' : 'OpenAI'
      const nudge = `Add your ${label} API key in Settings to chat with the real ${activeModel.value.name}. For now, here's the demo engine:\n\n${replyFor(text)}`
      setTimeout(() => {
        clearThinking()
        streamReply(idx, nudge)
      }, phrases.length * PHRASE_INTERVAL_MS)
      return
    }
    abortController = new AbortController()
    const call = provider === 'anthropic' ? anthropicChat : openaiChat
    call({ messages: history, apiKey, model: activeModel.value.apiModel, signal: abortController.signal })
      .then(({ content }) => {
        clearThinking()
        if (!isResponding.value) return // stopped mid-flight
        const t = messages.value[idx]
        if (!t) return
        streamReply(idx, content || '(no response)')
      })
      .catch((err: unknown) => {
        clearThinking()
        if (err instanceof ProviderAbortError || !isResponding.value) return
        const t = messages.value[idx]
        if (t) {
          t.text = err instanceof Error ? err.message : 'Something went wrong talking to the model.'
          t.state = 'done'
        }
        isResponding.value = false
      })
      .finally(() => {
        abortController = null
      })
    return
  }

  const ollamaModel = activeModel.value.ollamaModel
  if (ollamaModel) {
    // Real local model. The cheeky phrase rotator spins until the reply lands
    // (Lynx's native fetch can't stream, so the whole reply arrives at once),
    // then we animate it word-by-word for the live feel. Any reasoning trace is
    // kept on the turn and shown via the collapsible "thought process".
    abortController = new AbortController()
    ollamaChat({ model: ollamaModel, messages: history, think: thinking.value, signal: abortController.signal })
      .then(({ content, thinking: trace }) => {
        clearThinking()
        if (!isResponding.value) return // stopped mid-flight
        const t = messages.value[idx]
        if (!t) return
        if (trace) t.thinking = trace
        streamReply(idx, content || '(no response — is the model loaded?)')
      })
      .catch((err: unknown) => {
        clearThinking()
        if (err instanceof OllamaAbortError || !isResponding.value) return
        const t = messages.value[idx]
        if (t) {
          t.text = err instanceof Error ? err.message : 'Something went wrong talking to Ollama.'
          t.thinking = undefined
          t.state = 'done'
        }
        isResponding.value = false
      })
      .finally(() => {
        abortController = null
      })
    return
  }

  // Mock tiers: fake a think delay, then stream a canned reply.
  const reply = replyFor(text)
  setTimeout(() => {
    clearThinking()
    streamReply(idx, reply)
  }, phrases.length * PHRASE_INTERVAL_MS)
}

export function useChat() {
  return {
    messages,
    modelId,
    activeModel,
    thinking,
    isResponding,
    isEmpty,
    conversations,
    activeConversationId,
    setModel,
    setThinking,
    newChat,
    openConversation,
    send,
    stop,
  }
}
