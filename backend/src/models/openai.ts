import { Channel } from '../db/queries'
import { ModelAdapter, NonStreamResponse, OpenAIChatRequest, StreamChunk, openaiCompatChat, openaiCompatStream } from './base'

export class OpenAIAdapter implements ModelAdapter {
  async chat(req: OpenAIChatRequest, channel: Channel): Promise<NonStreamResponse> {
    return openaiCompatChat(req, channel, 'gpt-5.5')
  }
  async *stream(req: OpenAIChatRequest, channel: Channel): AsyncGenerator<StreamChunk> {
    yield* openaiCompatStream(req, channel, 'gpt-5.5')
  }
}
