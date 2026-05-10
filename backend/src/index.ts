import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../../.env.local') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

// Placeholder - routes will be added in later tasks
;(async () => {
  app.listen(PORT, () => {
    console.log(`yunashuoAI backend running on :${PORT}`)
  })
})()

export default app
