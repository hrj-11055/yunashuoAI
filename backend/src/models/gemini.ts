import { Channel } from '../db/queries'
import { ModelAdapter, NonStreamResponse, OpenAIChatRequest, OpenAIMessage, StreamChunk } from './base'

function toGeminiContents(messages: OpenAIMessage[]) {
  const system = messages.find(m => m.role === 'system')?.content
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  return { system, contents }
}

export class GeminiAdapter implements ModelAdapter {
  async chat(req: OpenAIChatRequest, channel: Channel): Promise<NonStreamResponse> {
    const { system, contents } = toGeminiContents(req.messages)
    const model = 'gemini-2.0-flash'
    const url = `${channel.base_url}/models/${model}:generateContent?key=${channel.api_key}`
    const body: Record<string, unknown> = { contents }
    if (system) body.systemInstruction = { parts: [{ text: system }] }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Gemini error ${response.status}: ${err}`)
    }
    const data = await response.json() as {
      candidates: { content: { parts: { text: string }[] } }[]
      usageMetadata: { promptTokenCount: number; candidatesTokenCount: number }
    }
    return {
      content: data.candidates[0].content.parts[0].text,
      prompt_tokens: data.usageMetadata.promptTokenCount,
      completion_tokens: data.usageMetadata.candidatesTokenCount,
    }
  }

  async *stream(req: OpenAIChatRequest, channel: Channel): AsyncGenerator<StreamChunk> {
    const { system, contents } = toGeminiContents(req.messages)
    const model = 'gemini-2.0-flash'
    const url = `${channel.base_url}/models/${model}:streamGenerateContent?alt=sse&key=${channel.api_key}`
    const body: Record<string, unknown> = { contents }
    if (system) body.systemInstruction = { parts: [{ text: system }] }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok || !response.body) {
      throw new Error(`Gemini stream error ${response.status}`)
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) { yield { content: '', done: true }; return }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const parsed = JSON.parse(line.slice(6)) as {
            candidates: { content: { parts: { text: string }[] } }[]
          }
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield { content: text, done: false }
        } catch { /* ignore */ }
      }
    }
  }
}
