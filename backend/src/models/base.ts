import { Channel } from '../db/queries'

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIChatRequest {
  model: string
  messages: OpenAIMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
  [key: string]: unknown
}

export interface NonStreamResponse {
  content: string
  prompt_tokens: number
  completion_tokens: number
}

export interface StreamChunk {
  content: string
  done: boolean
  prompt_tokens?: number
  completion_tokens?: number
}

export interface ModelAdapter {
  chat(req: OpenAIChatRequest, channel: Channel): Promise<NonStreamResponse>
  stream(req: OpenAIChatRequest, channel: Channel): AsyncGenerator<StreamChunk>
}

export function calcCredits(promptTokens: number, completionTokens: number, rate: number): number {
  return ((promptTokens + completionTokens) / 1000) * rate
}

export async function openaiCompatChat(
  req: OpenAIChatRequest,
  channel: Channel,
  overrideModel?: string
): Promise<NonStreamResponse> {
  const response = await fetch(`${channel.base_url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channel.api_key}`,
    },
    body: JSON.stringify({
      model: overrideModel || req.model,
      messages: req.messages,
      temperature: req.temperature,
      max_tokens: req.max_tokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Upstream error ${response.status}: ${err}`)
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[]
    usage: { prompt_tokens: number; completion_tokens: number }
  }

  return {
    content: data.choices[0].message.content,
    prompt_tokens: data.usage.prompt_tokens,
    completion_tokens: data.usage.completion_tokens,
  }
}

export async function* openaiCompatStream(
  req: OpenAIChatRequest,
  channel: Channel,
  overrideModel?: string
): AsyncGenerator<StreamChunk> {
  const response = await fetch(`${channel.base_url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channel.api_key}`,
    },
    body: JSON.stringify({
      model: overrideModel || req.model,
      messages: req.messages,
      temperature: req.temperature,
      max_tokens: req.max_tokens,
      stream: true,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok || !response.body) {
    const err = await response.text()
    throw new Error(`Upstream error ${response.status}: ${err}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') { yield { content: '', done: true }; return }
      try {
        const parsed = JSON.parse(data) as { choices: { delta: { content?: string } }[] }
        const content = parsed.choices[0]?.delta?.content || ''
        if (content) yield { content, done: false }
      } catch { /* ignore malformed */ }
    }
  }
}
