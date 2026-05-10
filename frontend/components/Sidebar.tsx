'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Plug, Key, ScrollText, LogOut } from 'lucide-react'
import { clearToken } from '@/lib/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/channels', label: '渠道管理', icon: Plug },
  { href: '/keys', label: 'Key 管理', icon: Key },
  { href: '/logs', label: '调用日志', icon: ScrollText },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function logout() {
    clearToken()
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/login')
  }

  return (
    <aside className="w-56 border-r bg-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b">
        <h1 className="text-lg font-bold text-gray-900">yunashuoAI</h1>
        <p className="text-xs text-gray-500 mt-0.5">API 中转管理</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 w-full"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    </aside>
  )
}
