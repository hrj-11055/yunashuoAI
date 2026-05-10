import { Router } from 'express'
import { relayAuth, RelayRequest } from '../middleware/relayAuth'
import { routeWithRetry, resolveChannel } from '../models/router'
import { calcCredits, OpenAIChatRequest } from '../models/base'
import { keyQueries, logQueries } from '../db/queries'

export const relayRouter = Router()

relayRouter.post('/chat/completions', relayAuth, async (req: RelayRequest, res) => {
  const body = req.body as OpenAIChatRequest
  const relayKey = req.relayKey!
  const startTime = Date.now()

  if (!body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({
      error: { message: 'messages is required', type: 'invalid_request_error' }
    })
  }

  const isStream = body.stream === true

  try {
    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')

      const { channel, adapter } = await resolveChannel(body.model)
      const completionId = `chatcmpl-${Date.now()}`
      let totalContent = ''

      try {
        for await (const chunk of adapter.stream(body, channel)) {
          if (chunk.done) break
          totalContent += chunk.content

          const sseData = {
            id: completionId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: body.model,
            choices: [{ index: 0, delta: { content: chunk.content }, finish_reason: null }],
          }
          res.write(`data: ${JSON.stringify(sseData)}\n\n`)
        }

        res.write(`data: ${JSON.stringify({
          id: completionId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: body.model,
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        })}\n\n`)
        res.write('data: [DONE]\n\n')
        res.end()

        const promptTokens = Math.ceil(body.messages.reduce((sum, m) => sum + m.content.length / 4, 0))
        const completionTokens = Math.ceil(totalContent.length / 4)
        const creditsUsed = calcCredits(promptTokens, completionTokens, channel.billing_rate)

        keyQueries.deductCredits(relayKey.id, creditsUsed)
        logQueries.create({
          relay_key_id: relayKey.id,
          channel_id: channel.id,
          model: body.model,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          credits_used: creditsUsed,
          latency_ms: Date.now() - startTime,
          status: 'success',
          error_msg: null,
          created_at: Date.now(),
        })
      } catch (streamErr) {
        res.write(`data: ${JSON.stringify({ error: { message: (streamErr as Error).message } })}\n\n`)
        res.end()
        logQueries.create({
          relay_key_id: relayKey.id,
          channel_id: channel.id,
          model: body.model,
          prompt_tokens: 0,
          completion_tokens: 0,
          credits_used: 0,
          latency_ms: Date.now() - startTime,
          status: 'error',
          error_msg: (streamErr as Error).message,
          created_at: Date.now(),
        })
      }
    } else {
      const result = await routeWithRetry(body, async (channel, adapter) => {
        const resp = await adapter.chat(body, channel)
        return { resp, channel }
      })

      const { resp, channel } = result
      const creditsUsed = calcCredits(resp.prompt_tokens, resp.completion_tokens, channel.billing_rate)

      keyQueries.deductCredits(relayKey.id, creditsUsed)
      logQueries.create({
        relay_key_id: relayKey.id,
        channel_id: channel.id,
        model: body.model,
        prompt_tokens: resp.prompt_tokens,
        completion_tokens: resp.completion_tokens,
        credits_used: creditsUsed,
        latency_ms: Date.now() - startTime,
        status: 'success',
        error_msg: null,
        created_at: Date.now(),
      })

      return res.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: body.model,
        choices: [{
          index: 0,
          message: { role: 'assistant', content: resp.content },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: resp.prompt_tokens,
          completion_tokens: resp.completion_tokens,
          total_tokens: resp.prompt_tokens + resp.completion_tokens,
        },
      })
    }
  } catch (err) {
    const msg = (err as Error).message
    logQueries.create({
      relay_key_id: relayKey.id,
      channel_id: null,
      model: body.model,
      prompt_tokens: 0,
      completion_tokens: 0,
      credits_used: 0,
      latency_ms: Date.now() - startTime,
      status: 'error',
      error_msg: msg,
      created_at: Date.now(),
    })
    if (!res.headersSent) {
      return res.status(503).json({
        error: { message: msg, type: 'server_error', code: 'service_unavailable' }
      })
    }
  }
})
