import { Router } from 'express'
import { adminAuth } from '../../middleware/adminAuth'
import { channelQueries } from '../../db/queries'

export const channelsRouter = Router()
channelsRouter.use(adminAuth)

channelsRouter.get('/', (_req, res) => {
  res.json(channelQueries.getAll())
})

channelsRouter.post('/', (req, res) => {
  const { name, model_id, api_key, base_url, billing_rate } = req.body
  if (!name || !model_id || !api_key || !base_url) {
    return res.status(400).json({ error: 'name, model_id, api_key, base_url required' })
  }
  channelQueries.create({
    name, model_id, api_key, base_url,
    billing_rate: billing_rate || 1.0,
    status: 'active',
    created_at: Date.now(),
  })
  res.json({ ok: true })
})

channelsRouter.put('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const { name, api_key, base_url, billing_rate, status } = req.body
  channelQueries.update(id, { name, api_key, base_url, billing_rate, status })
  res.json({ ok: true })
})

channelsRouter.delete('/:id', (req, res) => {
  channelQueries.delete(parseInt(req.params.id))
  res.json({ ok: true })
})

channelsRouter.post('/:id/check', async (req, res) => {
  const channel = channelQueries.getById(parseInt(req.params.id))
  if (!channel) return res.status(404).json({ error: 'Not found' })
  try {
    const r = await fetch(`${channel.base_url}/models`, {
      headers: { Authorization: `Bearer ${channel.api_key}` },
      signal: AbortSignal.timeout(10000),
    })
    const healthy = r.ok || r.status === 404
    channelQueries.updateHealth(channel.id, healthy ? 'healthy' : 'down', healthy ? 0 : channel.error_count + 1)
    res.json({ health: healthy ? 'healthy' : 'down' })
  } catch {
    channelQueries.updateHealth(channel.id, 'down', channel.error_count + 1)
    res.json({ health: 'down' })
  }
})
