import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { adminAuth } from '../../middleware/adminAuth'
import { keyQueries } from '../../db/queries'

export const keysRouter = Router()
keysRouter.use(adminAuth)

keysRouter.get('/', (_req, res) => {
  res.json(keyQueries.getAll())
})

keysRouter.post('/', (req, res) => {
  const { name, credits_limit, initial_credits } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const key = `sk-relay-${uuidv4().replace(/-/g, '').substring(0, 24)}`
  keyQueries.create({
    key,
    name,
    credits: initial_credits || 100,
    credits_limit: credits_limit || null,
    status: 'active',
    created_at: Date.now(),
  })
  res.json({ key })
})

keysRouter.put('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const { name, credits, credits_limit, status } = req.body
  keyQueries.update(id, { name, credits, credits_limit, status })
  res.json({ ok: true })
})

keysRouter.delete('/:id', (req, res) => {
  keyQueries.delete(parseInt(req.params.id))
  res.json({ ok: true })
})
