'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

interface Channel {
  id: number; name: string; model_id: string; billing_rate: number
  health: string; status: string; last_check_at: number | null
}

const healthBadge: Record<string, string> = {
  healthy: 'bg-green-100 text-green-700',
  degraded: 'bg-yellow-100 text-yellow-700',
  down: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-500',
}

interface Props { channels: Channel[]; onRefresh: () => void }

export function ChannelTable({ channels, onRefresh }: Props) {
  async function toggleStatus(ch: Channel) {
    await apiFetch(`/api/admin/channels/${ch.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: ch.status === 'active' ? 'disabled' : 'active' }),
    })
    onRefresh()
  }

  async function manualCheck(id: number) {
    await apiFetch(`/api/admin/channels/${id}/check`, { method: 'POST' })
    onRefresh()
  }

  async function deleteChannel(id: number) {
    if (!confirm('确认删除该渠道？')) return
    await apiFetch(`/api/admin/channels/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-gray-500 text-xs uppercase">
            <th className="px-4 py-3 text-left">名称</th>
            <th className="px-4 py-3 text-left">模型</th>
            <th className="px-4 py-3 text-left">倍率</th>
            <th className="px-4 py-3 text-left">健康</th>
            <th className="px-4 py-3 text-left">状态</th>
            <th className="px-4 py-3 text-left">最后检测</th>
            <th className="px-4 py-3 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {channels.map(ch => (
            <tr key={ch.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{ch.name}</td>
              <td className="px-4 py-3 text-gray-500 font-mono text-xs">{ch.model_id}</td>
              <td className="px-4 py-3">{ch.billing_rate}</td>
              <td className="px-4 py-3">
                <Badge className={`text-xs ${healthBadge[ch.health] || healthBadge.unknown}`}>
                  {ch.health}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge className={ch.status === 'active' ? 'bg-blue-50 text-blue-700 text-xs' : 'bg-gray-100 text-gray-500 text-xs'}>
                  {ch.status === 'active' ? '启用' : '禁用'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {ch.last_check_at ? new Date(ch.last_check_at).toLocaleTimeString('zh') : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => manualCheck(ch.id)}>检测</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(ch)}>
                    {ch.status === 'active' ? '禁用' : '启用'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => deleteChannel(ch.id)}>删除</Button>
                </div>
              </td>
            </tr>
          ))}
          {channels.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无渠道，点击「添加渠道」创建</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
