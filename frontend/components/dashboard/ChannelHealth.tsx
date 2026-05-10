import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Channel { id: number; name: string; model_id: string; health: string }

const healthColor: Record<string, string> = {
  healthy: 'bg-green-100 text-green-800',
  degraded: 'bg-yellow-100 text-yellow-800',
  down: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-600',
}

const healthLabel: Record<string, string> = {
  healthy: '正常', degraded: '降级', down: '宕机', unknown: '未知',
}

export function ChannelHealth({ channels }: { channels: Channel[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-medium">渠道健康状态</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {channels.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2.5 border">
              <span className={`w-2 h-2 rounded-full ${c.health === 'healthy' ? 'bg-green-500' : c.health === 'down' ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <span className="text-sm font-medium text-gray-700">{c.name}</span>
              <Badge className={`text-xs ${healthColor[c.health] || healthColor.unknown}`}>
                {healthLabel[c.health] || '未知'}
              </Badge>
            </div>
          ))}
          {channels.length === 0 && <p className="text-sm text-gray-400">暂无渠道</p>}
        </div>
      </CardContent>
    </Card>
  )
}
