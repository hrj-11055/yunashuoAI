import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../../.env.local') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

// Placeholder - routes will be added in later tasks
;(async () => {
  // initDb()        ← Task 2 will uncomment this
  // await ensureAdmin()  ← Task 11 will uncomment this
  // startHealthCheck()   ← Task 12 will uncomment this

  app.listen(PORT, () => {
    console.log(`yunashuoAI backend running on :${PORT}`)
  })
})()

export default app
