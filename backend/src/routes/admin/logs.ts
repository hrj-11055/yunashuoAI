import { Router } from 'express'
import { adminAuth } from '../../middleware/adminAuth'
import { logQueries } from '../../db/queries'

export const logsRouter = Router()
logsRouter.use(adminAuth)

logsRouter.get('/', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
  const keyId = req.query.keyId ? parseInt(req.query.keyId as string) : undefined
  const model = req.query.model as string | undefined
  const status = req.query.status as string | undefined
  const from = req.query.from ? parseInt(req.query.from as string) : undefined
  const to = req.query.to ? parseInt(req.query.to as string) : undefined
  res.json(logQueries.list({ page, limit, keyId, model, status, from, to }))
})

logsRouter.get('/stats', (_req, res) => {
  res.json(logQueries.stats())
})
