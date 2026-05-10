'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { KeyTable } from '@/components/keys/KeyTable'
import { KeyModal } from '@/components/keys/KeyModal'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

export default function KeysPage() {
  const [keys, setKeys] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [lastKey, setLastKey] = useState<string | null>(null)

  const load = () => apiFetch<[]>('/api/admin/keys').then(setKeys).catch(console.error)

  useEffect(() => { load() }, [])

  function handleSaved(key: string) {
    setLastKey(key)
    setShowModal(false)
    load()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Key 管理</h2>
          <Button onClick={() => setShowModal(true)}>+ 生成新 Key</Button>
        </div>
        {lastKey && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">Key 已生成，请立即复制保存：</p>
            <code className="text-sm font-mono text-green-900 break-all">{lastKey}</code>
          </div>
        )}
        <KeyTable keys={keys} onRefresh={load} />
        <KeyModal open={showModal} onClose={() => setShowModal(false)} onSaved={handleSaved} />
      </main>
    </div>
  )
}
