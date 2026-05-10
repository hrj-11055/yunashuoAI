import cron from 'node-cron'
import { channelQueries } from '../db/queries'

async function checkChannel(channel: {
  id: number; api_key: string; base_url: string; error_count: number
}) {
  try {
    const r = await fetch(`${channel.base_url}/models`, {
      headers: { Authorization: `Bearer ${channel.api_key}` },
      signal: AbortSignal.timeout(10000),
    })
    const reachable = r.ok || r.status === 401 || r.status === 404
    const newCount = reachable ? 0 : channel.error_count + 1
    channelQueries.updateHealth(channel.id, reachable ? 'healthy' : (newCount >= 3 ? 'down' : 'degraded'), newCount)
  } catch {
    const newCount = channel.error_count + 1
    channelQueries.updateHealth(channel.id, newCount >= 3 ? 'down' : 'degraded', newCount)
  }
}

async function runCheck() {
  const channels = channelQueries.getAll().filter(c => c.status === 'active')
  console.log(`Health check: checking ${channels.length} channels`)
  await Promise.allSettled(channels.map(checkChannel))
}

export function startHealthCheck() {
  setTimeout(runCheck, 5000)
  cron.schedule('*/5 * * * *', runCheck)
}
