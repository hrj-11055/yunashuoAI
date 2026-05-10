import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../../.env.local') })

import { initDb } from './db/schema'
import { relayRouter } from './routes/relay'
import { adminRouter, ensureAdmin } from './routes/admin/auth'
import { channelsRouter } from './routes/admin/channels'
import { keysRouter } from './routes/admin/keys'
import { logsRouter } from './routes/admin/logs'
import { startHealthCheck } from './cron/healthCheck'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())

app.use('/v1', relayRouter)
app.use('/api/admin', adminRouter)
app.use('/api/admin/channels', channelsRouter)
app.use('/api/admin/keys', keysRouter)
app.use('/api/admin/logs', logsRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

;(async () => {
  initDb()
  await ensureAdmin()
  startHealthCheck()
  app.listen(PORT, () => {
    console.log(`yunashuoAI backend running on :${PORT}`)
  })
})()

export default app
