import { getDb } from './client'

export interface Channel {
  id: number
  name: string
  model_id: string
  api_key: string
  base_url: string
  billing_rate: number
  status: 'active' | 'disabled'
  health: 'healthy' | 'degraded' | 'down' | 'unknown'
  last_check_at: number | null
  error_count: number
  created_at: number
}

export interface RelayKey {
  id: number
  key: string
  name: string
  credits: number
  credits_limit: number | null
  status: 'active' | 'disabled'
  created_at: number
  last_used_at: number | null
}

export interface CallLog {
  id: number
  relay_key_id: number | null
  channel_id: number | null
  model: string
  prompt_tokens: number
  completion_tokens: number
  credits_used: number
  latency_ms: number | null
  status: 'success' | 'error'
  error_msg: string | null
  created_at: number
}

// ── Channels ──────────────────────────────────────
export const channelQueries = {
  getAll: () => getDb().prepare('SELECT * FROM channels ORDER BY created_at DESC').all() as Channel[],
  getById: (id: number) => getDb().prepare('SELECT * FROM channels WHERE id = ?').get(id) as Channel | undefined,
  getByModelId: (modelId: string) =>
    getDb().prepare("SELECT * FROM channels WHERE model_id = ? AND status = 'active'").all(modelId) as Channel[],
  getHealthy: () =>
    getDb().prepare("SELECT * FROM channels WHERE status = 'active' AND health = 'healthy'").all() as Channel[],
  create: (data: Omit<Channel, 'id' | 'error_count' | 'health' | 'last_check_at'>) =>
    getDb().prepare(`
      INSERT INTO channels (name, model_id, api_key, base_url, billing_rate, status, created_at)
      VALUES (@name, @model_id, @api_key, @base_url, @billing_rate, @status, @created_at)
    `).run(data),
  update: (id: number, data: Partial<Channel>) => {
    const ALLOWED = new Set(['name','model_id','api_key','base_url','billing_rate','status','health','error_count','last_check_at'])
    const safe = Object.fromEntries(Object.entries(data).filter(([k]) => ALLOWED.has(k)))
    if (Object.keys(safe).length === 0) return
    const fields = Object.keys(safe).map(k => `${k} = @${k}`).join(', ')
    return getDb().prepare(`UPDATE channels SET ${fields} WHERE id = @id`).run({ ...safe, id })
  },
  updateHealth: (id: number, health: 'healthy' | 'degraded' | 'down' | 'unknown', errorCount: number) =>
    getDb().prepare('UPDATE channels SET health = ?, error_count = ?, last_check_at = ? WHERE id = ?')
      .run(health, errorCount, Date.now(), id),
  delete: (id: number) => getDb().prepare('DELETE FROM channels WHERE id = ?').run(id),
}

// ── Relay Keys ────────────────────────────────────
export const keyQueries = {
  getAll: () => getDb().prepare('SELECT * FROM relay_keys ORDER BY created_at DESC').all() as RelayKey[],
  getByKey: (key: string) => getDb().prepare('SELECT * FROM relay_keys WHERE key = ?').get(key) as RelayKey | undefined,
  create: (data: Omit<RelayKey, 'id' | 'last_used_at'>) =>
    getDb().prepare(`
      INSERT INTO relay_keys (key, name, credits, credits_limit, status, created_at)
      VALUES (@key, @name, @credits, @credits_limit, @status, @created_at)
    `).run(data),
  update: (id: number, data: Partial<RelayKey>) => {
    const ALLOWED = new Set(['name','credits','credits_limit','status','last_used_at'])
    const safe = Object.fromEntries(Object.entries(data).filter(([k]) => ALLOWED.has(k)))
    if (Object.keys(safe).length === 0) return
    const fields = Object.keys(safe).map(k => `${k} = @${k}`).join(', ')
    return getDb().prepare(`UPDATE relay_keys SET ${fields} WHERE id = @id`).run({ ...safe, id })
  },
  deductCredits: (id: number, amount: number) =>
    getDb().prepare('UPDATE relay_keys SET credits = credits - ?, last_used_at = ? WHERE id = ?')
      .run(amount, Date.now(), id),
  delete: (id: number) => getDb().prepare('DELETE FROM relay_keys WHERE id = ?').run(id),
}

// ── Call Logs ─────────────────────────────────────
export const logQueries = {
  create: (data: Omit<CallLog, 'id'>) =>
    getDb().prepare(`
      INSERT INTO call_logs (relay_key_id, channel_id, model, prompt_tokens, completion_tokens,
        credits_used, latency_ms, status, error_msg, created_at)
      VALUES (@relay_key_id, @channel_id, @model, @prompt_tokens, @completion_tokens,
        @credits_used, @latency_ms, @status, @error_msg, @created_at)
    `).run(data),

  list: (opts: { page: number; limit: number; keyId?: number; model?: string; status?: string; from?: number; to?: number }) => {
    let where = 'WHERE 1=1'
    const params: Record<string, unknown> = {}
    if (opts.keyId) { where += ' AND relay_key_id = @keyId'; params.keyId = opts.keyId }
    if (opts.model) { where += ' AND model = @model'; params.model = opts.model }
    if (opts.status) { where += ' AND status = @status'; params.status = opts.status }
    if (opts.from) { where += ' AND created_at >= @from'; params.from = opts.from }
    if (opts.to) { where += ' AND created_at <= @to'; params.to = opts.to }

    const offset = (opts.page - 1) * opts.limit
    const rows = getDb().prepare(
      `SELECT l.*, k.name as key_name FROM call_logs l
       LEFT JOIN relay_keys k ON l.relay_key_id = k.id
       ${where} ORDER BY l.created_at DESC LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit: opts.limit, offset }) as (CallLog & { key_name: string })[]

    const total = (getDb().prepare(`SELECT COUNT(*) as count FROM call_logs ${where}`).get(params) as { count: number }).count
    return { rows, total }
  },

  stats: () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayTs = today.getTime()
    const sevenDaysAgo = todayTs - 7 * 24 * 60 * 60 * 1000

    const todayStats = getDb().prepare(`
      SELECT COUNT(*) as calls,
             COALESCE(SUM(prompt_tokens + completion_tokens), 0) as tokens,
             COALESCE(SUM(credits_used), 0) as credits
      FROM call_logs WHERE created_at >= ?
    `).get(todayTs) as { calls: number; tokens: number; credits: number }

    const daily = getDb().prepare(`
      SELECT date(created_at/1000, 'unixepoch', 'localtime') as date, COUNT(*) as calls
      FROM call_logs WHERE created_at >= ? GROUP BY date ORDER BY date
    `).all(sevenDaysAgo) as { date: string; calls: number }[]

    const byModel = getDb().prepare(`
      SELECT model, COUNT(*) as calls FROM call_logs WHERE created_at >= ? GROUP BY model
    `).all(sevenDaysAgo) as { model: string; calls: number }[]

    return { todayStats, daily, byModel }
  },
}

// ── Admins ────────────────────────────────────────
export const adminQueries = {
  get: () => getDb().prepare('SELECT * FROM admins LIMIT 1').get() as { id: number; password_hash: string } | undefined,
  create: (passwordHash: string) =>
    getDb().prepare('INSERT INTO admins (password_hash, created_at) VALUES (?, ?)').run(passwordHash, Date.now()),
}
