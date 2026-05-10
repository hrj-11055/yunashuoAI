'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ChannelTable } from '@/components/channels/ChannelTable'
import { ChannelModal } from '@/components/channels/ChannelModal'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

export default function ChannelsPage() {
  const [channels, setChannels] = useState([])
  const [showModal, setShowModal] = useState(false)

  const load = () => apiFetch<[]>('/api/admin/channels').then(setChannels).catch(console.error)

  useEffect(() => { load() }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">渠道管理</h2>
          <Button onClick={() => setShowModal(true)}>+ 添加渠道</Button>
        </div>
        <ChannelTable channels={channels} onRefresh={load} />
        <ChannelModal open={showModal} onClose={() => setShowModal(false)} onSaved={load} />
      </main>
    </div>
  )
}
