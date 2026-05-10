import { Channel } from '../db/queries'
import { ModelAdapter, NonStreamResponse, OpenAIChatRequest, OpenAIMessage, StreamChunk } from './base'

function toAnthropicMessages(messages: OpenAIMessage[]) {
  const system = messages.find(m => m.role === 'system')?.content
  const msgs = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  return { system, msgs }
}

export class ClaudeAdapter implements ModelAdapter {
  async chat(req: OpenAIChatRequest, channel: Channel): Promise<NonStreamResponse> {
    const { system, msgs } = toAnthropicMessages(req.messages)
    const response = await fetch(`${channel.base_url}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': channel.api_key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: req.max_tokens || 4096,
        system,
        messages: msgs,
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Claude error ${response.status}: ${err}`)
    }
    const data = await response.json() as {
      content: { text: string }[]
      usage: { input_tokens: number; output_tokens: number }
    }
    return {
      content: data.content[0].text,
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
    }
  }

  async *stream(req: OpenAIChatRequest, channel: Channel): AsyncGenerator<StreamChunk> {
    const { system, msgs } = toAnthropicMessages(req.messages)
    const response = await fetch(`${channel.base_url}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': channel.api_key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: req.max_tokens || 4096,
        system,
        messages: msgs,
        stream: true,
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok || !response.body) {
      throw new Error(`Claude stream error ${response.status}`)
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
        try {
          const event = JSON.parse(line.slice(6)) as {
            type: string
            delta?: { text?: string }
          }
          if (event.type === 'content_block_delta' && event.delta?.text) {
            yield { content: event.delta.text, done: false }
          } else if (event.type === 'message_stop') {
            yield { content: '', done: true }
          }
        } catch { /* ignore */ }
      }
    }
  }
}
