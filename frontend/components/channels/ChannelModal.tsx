'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api'

const MODEL_OPTIONS = [
  { value: 'deepseek-v4', label: 'DeepSeek V4', defaultUrl: 'https://api.deepseek.com/v1' },
  { value: 'gpt-5.5', label: 'GPT-5.5', defaultUrl: 'https://api.openai.com/v1' },
  { value: 'glm-5', label: '智谱 GLM-5', defaultUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  { value: 'qwen-plus', label: '通义千问 Plus', defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { value: 'claude', label: 'Claude', defaultUrl: 'https://api.anthropic.com/v1' },
  { value: 'gemini', label: 'Gemini', defaultUrl: 'https://generativelanguage.googleapis.com/v1beta' },
]

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function ChannelModal({ open, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ name: '', model_id: '', api_key: '', base_url: '', billing_rate: '1.0' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleModelChange(modelId: string | null) {
    if (!modelId) return
    const opt = MODEL_OPTIONS.find(m => m.value === modelId)
    setForm(f => ({ ...f, model_id: modelId, base_url: opt?.defaultUrl || f.base_url, name: f.name || opt?.label || '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await apiFetch('/api/admin/channels', {
        method: 'POST',
        body: JSON.stringify({ ...form, billing_rate: parseFloat(form.billing_rate) }),
      })
      onSaved()
      onClose()
      setForm({ name: '', model_id: '', api_key: '', base_url: '', billing_rate: '1.0' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加渠道</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>模型</Label>
            <Select onValueChange={handleModelChange} required>
              <SelectTrigger><SelectValue placeholder="选择模型" /></SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>渠道名称</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>API Key</Label>
            <Input value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Base URL</Label>
            <Input value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>计费倍率（每1000 tokens扣积分）</Label>
            <Input type="number" step="0.01" value={form.billing_rate} onChange={e => setForm(f => ({ ...f, billing_rate: e.target.value }))} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={loading}>{loading ? '保存中…' : '保存'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
