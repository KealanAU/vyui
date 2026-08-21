// Thin, non-streaming clients for the hosted brand models (Anthropic + OpenAI).
// They mirror useOllama's shape: one POST, read the whole reply with res.json(),
// return plain text, and let useChat animate the typing. Lynx's native fetch has
// no readable body stream, so streaming is off — see useOllama for the rationale.
//
// CORS: on the WEB build the browser enforces CORS. Anthropic allows direct
// browser calls via `anthropic-dangerous-direct-browser-access`; OpenAI does
// not officially, so the brand models are best exercised on-device (native fetch
// has no CORS) — same web/device split as Ollama.

import type { OllamaMessage } from './useOllama'

// Plain-text steer — bubbles render raw Lynx <text> with no markdown (see
// data/chat.ts), so keep both providers off markdown/emoji. Mirrors OLLAMA_SYSTEM.
const PROVIDER_SYSTEM
  = 'You are a concise, helpful assistant inside a mobile chat app. '
    + 'Reply in plain text only: no markdown, no headings, no bullet syntax '
    + '(*, -, #, backticks) and no emoji. Use short paragraphs separated by '
    + 'blank lines. Keep answers brief unless asked for detail.'

// Defaults — overridable via the Model entry's `apiModel` in data/chat.ts.
export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-4-8'
export const DEFAULT_OPENAI_MODEL = 'gpt-5'

const MAX_TOKENS = 4096

/** Thrown when the user aborts a turn — callers swallow this silently. */
export class ProviderAbortError extends Error {}

export interface ProviderChatOptions {
  /** Full conversation so far, oldest first (user/assistant only). */
  messages: OllamaMessage[]
  /** The user's API key for this provider. */
  apiKey: string
  /** Model id override. Defaults to the provider's constant above. */
  model?: string
  /** Abort signal so an in-flight turn can be stopped. */
  signal?: AbortSignal
}

function ensureFetch(): void {
  if (typeof fetch !== 'function') {
    throw new TypeError('fetch is unavailable in this runtime — run the web build to chat with hosted models.')
  }
}

/**
 * Anthropic Messages API. `system` is a top-level field (not a message); roles
 * are user/assistant only. The browser-access header lets the web build call the
 * API directly past CORS; it's harmless on native. Reads concatenated text
 * blocks, and surfaces a `refusal` stop reason instead of returning an empty bubble.
 */
export async function anthropicChat(opts: ProviderChatOptions): Promise<{ content: string }> {
  const { messages, apiKey, model = DEFAULT_ANTHROPIC_MODEL, signal } = opts
  ensureFetch()

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: MAX_TOKENS, system: PROVIDER_SYSTEM, messages }),
      signal,
    })
  }
  catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new ProviderAbortError()
    throw new Error('Couldn\'t reach Anthropic. Check your connection and API key.', { cause: err })
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error('Anthropic rejected the API key (401). Update it in Settings.')
    throw new Error(`Anthropic returned ${res.status}.`)
  }

  let data: { content?: { type: string, text?: string }[], stop_reason?: string, error?: { message?: string } }
  try {
    data = await res.json()
  }
  catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new ProviderAbortError()
    throw new Error('Anthropic sent a response this runtime could not read.', { cause: err })
  }

  if (data?.error?.message) throw new Error(data.error.message)
  if (data?.stop_reason === 'refusal') throw new Error('Claude declined to answer that one.')

  const content = (data?.content ?? [])
    .filter(b => b.type === 'text')
    .map(b => b.text ?? '')
    .join('')
    .trim()
  return { content }
}

/**
 * OpenAI Chat Completions. System steer rides as the first message; the reply
 * lands in `choices[0].message.content`.
 */
export async function openaiChat(opts: ProviderChatOptions): Promise<{ content: string }> {
  const { messages, apiKey, model = DEFAULT_OPENAI_MODEL, signal } = opts
  ensureFetch()

  const payload = [{ role: 'system', content: PROVIDER_SYSTEM }, ...messages]

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: payload }),
      signal,
    })
  }
  catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new ProviderAbortError()
    throw new Error('Couldn\'t reach OpenAI. Check your connection and API key.', { cause: err })
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error('OpenAI rejected the API key (401). Update it in Settings.')
    throw new Error(`OpenAI returned ${res.status}.`)
  }

  let data: { choices?: { message?: { content?: string } }[], error?: { message?: string } }
  try {
    data = await res.json()
  }
  catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new ProviderAbortError()
    throw new Error('OpenAI sent a response this runtime could not read.', { cause: err })
  }

  if (data?.error?.message) throw new Error(data.error.message)

  const content = (data?.choices?.[0]?.message?.content ?? '').trim()
  return { content }
}
