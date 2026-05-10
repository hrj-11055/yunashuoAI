'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface RelayKey {
  id: number; key: string; name: string; credits: number
  credits_limit: number | null; status: string; last_used_at: number | null
}

export function KeyTable({ keys, onRefresh }: { keys: RelayKey[]; onRefresh: () => void }) {
  const [copied, setCopied] = useState<number | null>(null)

  function copyKey(id: number, key: string) {
    navigator.clipboard.writeText(key)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function toggleStatus(k: RelayKey) {
    await apiFetch(`/api/admin/keys/${k.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: k.status === 'active' ? 'disabled' : 'active' }),
    })
    onRefresh()
  }

  async function deleteKey(id: number) {
    if (!confirm('确认删除该 Key？此操作不可恢复。')) return
    await apiFetch(`/api/admin/keys/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-gray-500 text-xs uppercase">
            <th className="px-4 py-3 text-left">名称</th>
            <th className="px-4 py-3 text-left">Key</th>
            <th className="px-4 py-3 text-left">积分</th>
            <th className="px-4 py-3 text-left">上限</th>
            <th className="px-4 py-3 text-left">状态</th>
            <th className="px-4 py-3 text-left">最后使用</th>
            <th className="px-4 py-3 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(k => (
            <tr key={k.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{k.name}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-gray-500 font-mono">{k.key.slice(0, 16)}…</code>
                  <button onClick={() => copyKey(k.id, k.key)} className="text-gray-400 hover:text-gray-600">
                    {copied === k.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 font-mono">{k.credits.toFixed(2)}</td>
              <td className="px-4 py-3 text-gray-500">{k.credits_limit ?? '无限制'}</td>
              <td className="px-4 py-3">
                <Badge className={k.status === 'active' ? 'bg-green-50 text-green-700 text-xs' : 'bg-gray-100 text-gray-500 text-xs'}>
                  {k.status === 'active' ? '启用' : '禁用'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {k.last_used_at ? new Date(k.last_used_at).toLocaleString('zh') : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(k)}>
                    {k.status === 'active' ? '禁用' : '启用'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500" onClick={() => deleteKey(k.id)}>删除</Button>
                </div>
              </td>
            </tr>
          ))}
          {keys.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无 Key</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
