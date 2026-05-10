'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { CallsChart } from '@/components/dashboard/CallsChart'
import { ModelPieChart } from '@/components/dashboard/ModelPieChart'
import { ChannelHealth } from '@/components/dashboard/ChannelHealth'
import { apiFetch } from '@/lib/api'

interface Stats {
  todayStats: { calls: number; tokens: number; credits: number }
  daily: { date: string; calls: number }[]
  byModel: { model: string; calls: number }[]
}

interface Channel {
  id: number; name: string; model_id: string; health: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    apiFetch<Stats>('/api/admin/logs/stats').then(setStats).catch(console.error)
    apiFetch<Channel[]>('/api/admin/channels').then(setChannels).catch(console.error)
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">仪表盘</h2>
        <StatsCards stats={stats?.todayStats || null} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <CallsChart data={stats?.daily || []} />
          </div>
          <div>
            <ModelPieChart data={stats?.byModel || []} />
          </div>
        </div>
        <div className="mt-6">
          <ChannelHealth channels={channels} />
        </div>
      </main>
    </div>
  )
}
