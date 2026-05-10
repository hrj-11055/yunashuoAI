import { Channel, channelQueries } from '../db/queries'
import { ModelAdapter, OpenAIChatRequest } from './base'
import { DeepSeekAdapter } from './deepseek'
import { OpenAIAdapter } from './openai'
import { ZhipuAdapter } from './zhipu'
import { QwenAdapter } from './qwen'
import { ClaudeAdapter } from './claude'
import { GeminiAdapter } from './gemini'

const ADAPTERS: Record<string, ModelAdapter> = {
  'deepseek-v4': new DeepSeekAdapter(),
  'gpt-5.5': new OpenAIAdapter(),
  'glm-5': new ZhipuAdapter(),
  'qwen-plus': new QwenAdapter(),
  'claude': new ClaudeAdapter(),
  'gemini': new GeminiAdapter(),
}

function pickChannel(channels: Channel[]): Channel {
  return channels[Math.floor(Math.random() * channels.length)]
}

function getAdapter(modelId: string): ModelAdapter {
  return ADAPTERS[modelId] || ADAPTERS['gpt-5.5']
}

export interface RouteResult {
  channel: Channel
  adapter: ModelAdapter
}

export async function resolveChannel(requestedModel: string): Promise<RouteResult> {
  let candidates: Channel[]

  if (requestedModel === 'auto') {
    candidates = channelQueries.getHealthy()
  } else {
    const all = channelQueries.getByModelId(requestedModel)
    candidates = all.filter(c => c.health === 'healthy')
    if (candidates.length === 0) candidates = all
  }

  if (candidates.length === 0) {
    throw new Error(`No available channels for model: ${requestedModel}`)
  }

  const channel = pickChannel(candidates)
  const adapter = getAdapter(channel.model_id)
  return { channel, adapter }
}

const MAX_RETRIES = 2

export async function routeWithRetry<T>(
  req: OpenAIChatRequest,
  fn: (channel: Channel, adapter: ModelAdapter) => Promise<T>
): Promise<T> {
  const tried = new Set<number>()
  let lastError: Error = new Error('No channels available')

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { channel, adapter } = await resolveChannel(req.model)
      if (tried.has(channel.id)) continue
      tried.add(channel.id)
      return await fn(channel, adapter)
    } catch (err) {
      lastError = err as Error
      console.error(`Relay attempt ${attempt + 1} failed:`, (err as Error).message)
    }
  }

  throw lastError
}
