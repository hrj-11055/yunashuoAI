import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'yunashuoAI — AI API 中转站',
  description: 'OpenAI 兼容 API 中转管理面板',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
