'use client'
import { Badge } from '@/components/ui/badge'

interface Log {
  id: number; key_name: string; model: string
  prompt_tokens: number; completion_tokens: number
  credits_used: number; latency_ms: number | null
  status: string; created_at: number
}

export function LogTable({ logs }: { logs: Log[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-gray-500 text-xs uppercase">
            <th className="px-4 py-3 text-left">时间</th>
            <th className="px-4 py-3 text-left">Key</th>
            <th className="px-4 py-3 text-left">模型</th>
            <th className="px-4 py-3 text-right">Prompt</th>
            <th className="px-4 py-3 text-right">Completion</th>
            <th className="px-4 py-3 text-right">积分</th>
            <th className="px-4 py-3 text-right">耗时</th>
            <th className="px-4 py-3 text-left">状态</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                {new Date(log.created_at).toLocaleString('zh')}
              </td>
              <td className="px-4 py-3 text-gray-600">{log.key_name || '—'}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.model}</td>
              <td className="px-4 py-3 text-right font-mono text-xs">{log.prompt_tokens.toLocaleString()}</td>
              <td className="px-4 py-3 text-right font-mono text-xs">{log.completion_tokens.toLocaleString()}</td>
              <td className="px-4 py-3 text-right font-mono text-xs">{log.credits_used.toFixed(4)}</td>
              <td className="px-4 py-3 text-right text-gray-400 text-xs">
                {log.latency_ms ? `${log.latency_ms}ms` : '—'}
              </td>
              <td className="px-4 py-3">
                <Badge className={log.status === 'success' ? 'bg-green-50 text-green-700 text-xs' : 'bg-red-50 text-red-700 text-xs'}>
                  {log.status === 'success' ? '成功' : '失败'}
                </Badge>
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无日志</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
