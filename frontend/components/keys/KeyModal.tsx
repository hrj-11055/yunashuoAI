'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'

interface Props { open: boolean; onClose: () => void; onSaved: (key: string) => void }

export function KeyModal({ open, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ name: '', initial_credits: '1000', credits_limit: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { key } = await apiFetch<{ key: string }>('/api/admin/keys', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          initial_credits: parseFloat(form.initial_credits),
          credits_limit: form.credits_limit ? parseFloat(form.credits_limit) : null,
        }),
      })
      onSaved(key)
      setForm({ name: '', initial_credits: '1000', credits_limit: '' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>生成新 Key</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>名称</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：测试用户01" required />
          </div>
          <div className="space-y-1.5">
            <Label>初始积分</Label>
            <Input type="number" value={form.initial_credits} onChange={e => setForm(f => ({ ...f, initial_credits: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>积分上限（留空=无限制）</Label>
            <Input type="number" value={form.credits_limit} onChange={e => setForm(f => ({ ...f, credits_limit: e.target.value }))} placeholder="留空为无限制" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={loading}>{loading ? '生成中…' : '生成 Key'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
