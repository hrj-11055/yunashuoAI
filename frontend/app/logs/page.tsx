'use client'
import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { LogTable } from '@/components/logs/LogTable'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api'

const LIMIT = 50

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [model, setModel] = useState('')
  const [status, setStatus] = useState('')

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (model) params.set('model', model)
    if (status) params.set('status', status)
    apiFetch<{ rows: []; total: number }>(`/api/admin/logs?${params}`)
      .then(data => {
        setLogs(data.rows)
        setTotal(data.total)
      })
      .catch(console.error)
  }, [page, model, status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">调用日志</h2>
        <div className="flex gap-3 mb-4">
          <Select value={model || 'all'} onValueChange={v => { setModel(!v || v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="全部模型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部模型</SelectItem>
              {['deepseek-v4', 'gpt-5.5', 'glm-5', 'qwen-plus', 'claude', 'gemini'].map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status || 'all'} onValueChange={v => { setStatus(!v || v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-32"><SelectValue placeholder="全部状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="success">成功</SelectItem>
              <SelectItem value="error">失败</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <LogTable logs={logs} />
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>共 {total} 条</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
            <span className="px-2 py-1">第 {page} 页</span>
            <Button size="sm" variant="outline" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
