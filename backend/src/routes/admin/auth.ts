import { Router } from 'express'
import bcrypt from 'bcrypt'
import { adminQueries } from '../../db/queries'
import { signAdminToken } from '../../middleware/adminAuth'

export const adminRouter = Router()

export async function ensureAdmin() {
  const existing = adminQueries.get()
  if (!existing) {
    const password = process.env.ADMIN_PASSWORD || 'admin123'
    const hash = await bcrypt.hash(password, 10)
    adminQueries.create(hash)
    console.log('Admin account created')
  }
}

adminRouter.post('/login', async (req, res) => {
  const { password } = req.body as { password: string }
  if (!password) return res.status(400).json({ error: 'password required' })

  const admin = adminQueries.get()
  if (!admin) return res.status(500).json({ error: 'Admin not initialized' })

  const valid = await bcrypt.compare(password, admin.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid password' })

  return res.json({ token: signAdminToken() })
})
