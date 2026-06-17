// Tiny client for a locally-running Ollama server (https://ollama.com).
//
// It hits the /api/chat endpoint with streaming OFF, so the whole reply comes
// back in one JSON response — the demo then reuses its own word-by-word typing
// animation to make it feel live (see useChat.ts). Keeping it non-streaming
// means no ReadableStream parsing, which is the brittle part across the web and
// Lynx runtimes.
//
// To hand this to someone else: the only thing to configure is the base URL.
//   • Web build on the same machine as Ollama → the default just works.
//   • Phone / simulator → localhost is the *device*, not your laptop. Set the
//     URL to your machine's LAN IP (e.g. http://192.168.1.20:11434) and start
//     the server with `OLLAMA_HOST=0.0.0.0 ollama serve` so it accepts remote
//     connections. You can also override via a VITE_OLLAMA_URL env var.

const ENV_URL
  = typeof import.meta !== 'undefined'
    ? (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_OLLAMA_URL
    : undefined

export const OLLAMA_BASE_URL = ENV_URL ?? 'http://localhost:11434'

// Bubbles render as raw Lynx <text> — no markdown, no emoji glyphs — so steer
// the model to plain prose. Override per call via OllamaChatOptions.system.
export const OLLAMA_SYSTEM
  = 'You are a concise, helpful assistant inside a mobile chat app. '
    + 'Reply in plain text only: no markdown, no headings, no bullet syntax '
    + '(*, -, #, backticks) and no emoji. Use short paragraphs separated by '
    + 'blank lines. Keep answers brief unless asked for detail.'

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OllamaChatOptions {
  /** Ollama model name, e.g. `qwen3.5:9b`. */
  model: string
  /** Full conversation so far, oldest first. */
  messages: OllamaMessage[]
  /** Override the server URL for this call. */
  baseUrl?: string
  /** System prompt prepended to the conversation. Defaults to {@link OLLAMA_SYSTEM}; pass null to omit. */
  system?: string | null
  /**
   * Reasoning models (e.g. qwen3.5) otherwise burn the whole token budget in a
   * hidden `thinking` field and never emit an answer. Off by default so replies
   * are fast and land in `content`; set true if you want the model to reason.
   */
  think?: boolean
  /** Abort signal so an in-flight turn can be stopped. */
  signal?: AbortSignal
}

interface OllamaChatResponse {
  message?: { role: string, content?: string, thinking?: string }
  error?: string
  done_reason?: string
}

/** A finished reply: the answer plus any reasoning trace (empty if none). */
export interface OllamaChatResult {
  content: string
  thinking: string
}

/** Thrown when the user aborts a turn — callers should swallow this silently. */
export class OllamaAbortError extends Error {}

/**
 * Send a chat completion to Ollama and resolve with the finished reply.
 *
 * Deliberately NON-streaming (`stream: false`): we ask for the whole reply in
 * one JSON object and read it with `res.json()`. Lynx's native fetch has no
 * readable body stream and its `res.text()` can resolve to undefined, so
 * streaming/NDJSON parsing is unreliable on device — `res.json()` is the one
 * body reader native runtimes implement consistently. Callers animate the
 * returned text themselves for the live-typing feel.
 *
 * Throws a human-readable Error on failure (server down, model not pulled, …)
 * and an {@link OllamaAbortError} if the request was aborted.
 */
export async function ollamaChat(opts: OllamaChatOptions): Promise<OllamaChatResult> {
  const { model, messages, baseUrl = OLLAMA_BASE_URL, system = OLLAMA_SYSTEM, think = false, signal } = opts

  if (typeof fetch !== 'function') {
    throw new TypeError('fetch is unavailable in this runtime — run the web build to chat with Ollama.')
  }

  const payload: OllamaMessage[] = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages

  // With thinking ON, reasoning models need headroom or they fill the default
  // 4k window with reasoning and never reach the answer (done_reason "length").
  // With it OFF, no extra budget needed — the reply lands straight in content.
  const body: Record<string, unknown> = { model, messages: payload, stream: false, think }
  if (think) body.options = { num_ctx: 8192, num_predict: 2048 }

  let res: Response
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  }
  catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new OllamaAbortError()
    throw new Error(`Couldn't reach Ollama at ${baseUrl}. Is \`ollama serve\` running?`)
  }

  if (!res.ok) {
    throw new Error(`Ollama returned ${res.status}. Is "${model}" pulled? Try \`ollama pull ${model}\`.`)
  }

  let data: OllamaChatResponse | undefined
  try {
    data = await res.json() as OllamaChatResponse
  }
  catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new OllamaAbortError()
    throw new Error('Ollama sent a response this runtime could not read. Try the web build, or update LynxExplorer.')
  }

  if (data?.error) throw new Error(data.error)

  const content = (data?.message?.content ?? '').trim()
  const thinking = (data?.message?.thinking ?? '').trim()

  // Reasoning ran past the budget before answering. Tell the user how to fix it
  // rather than showing a blank bubble.
  if (!content && thinking) {
    throw new Error('The model ran out of room while reasoning. Turn Reasoning off for a faster, direct reply.')
  }

  return { content, thinking }
}

/** Convenience composable wrapper — returns the configured base URL + chat fn. */
export function useOllama(baseUrl: string = OLLAMA_BASE_URL) {
  return {
    baseUrl,
    chat: (opts: Omit<OllamaChatOptions, 'baseUrl'>) => ollamaChat({ ...opts, baseUrl }),
  }
}
