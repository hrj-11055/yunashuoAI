import { Card, CardContent } from '@/components/ui/card'

interface Props {
  stats: { calls: number; tokens: number; credits: number } | null
}

export function StatsCards({ stats }: Props) {
  const items = [
    { label: '今日调用', value: stats?.calls?.toLocaleString() || '—' },
    { label: '今日 Tokens', value: stats?.tokens?.toLocaleString() || '—' },
    { label: '今日积分消耗', value: stats?.credits?.toFixed(2) || '—' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map(({ label, value }) => (
        <Card key={label} className="shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
