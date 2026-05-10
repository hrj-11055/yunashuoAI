import { Channel } from '../db/queries'
import { ModelAdapter, NonStreamResponse, OpenAIChatRequest, StreamChunk, openaiCompatChat, openaiCompatStream } from './base'

export class QwenAdapter implements ModelAdapter {
  async chat(req: OpenAIChatRequest, channel: Channel): Promise<NonStreamResponse> {
    return openaiCompatChat(req, channel, 'qwen-plus')
  }
  async *stream(req: OpenAIChatRequest, channel: Channel): AsyncGenerator<StreamChunk> {
    yield* openaiCompatStream(req, channel, 'qwen-plus')
  }
}
