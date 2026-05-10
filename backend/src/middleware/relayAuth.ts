import { Request, Response, NextFunction } from 'express'
import { keyQueries } from '../db/queries'

export interface RelayRequest extends Request {
  relayKey?: { id: number; credits: number; credits_limit: number | null }
}

export function relayAuth(req: RelayRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer sk-relay-')) {
    return res.status(401).json({
      error: { message: 'Invalid API key format', type: 'invalid_request_error', code: 'invalid_api_key' }
    })
  }

  const key = auth.replace('Bearer ', '')
  const record = keyQueries.getByKey(key)

  if (!record || record.status !== 'active') {
    return res.status(401).json({
      error: { message: 'API key is invalid or disabled', type: 'invalid_request_error', code: 'invalid_api_key' }
    })
  }

  if (record.credits_limit !== null && record.credits <= 0) {
    return res.status(402).json({
      error: { message: 'Insufficient credits', type: 'insufficient_quota', code: 'insufficient_quota' }
    })
  }

  req.relayKey = { id: record.id, credits: record.credits, credits_limit: record.credits_limit }
  next()
}
