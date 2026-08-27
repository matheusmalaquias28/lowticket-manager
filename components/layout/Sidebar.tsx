'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutGrid, Tag, Settings, LogOut, Archive, ShieldAlert, BarChart2, Radar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { UserAvatar } from './UserAvatar'
import type { Profile } from '@/lib/types'

const NAV_ITEMS = [
  { href: '/kanban',       label: 'Kanban',       icon: LayoutGrid },
  { href: '/offers',       label: 'Ofertas',       icon: Tag },
  { href: '/radar',        label: 'Radar',         icon: Radar },
  { href: '/metricas',     label: 'Métricas',      icon: BarChart2 },
  { href: '/acervo',       label: 'Acervo',        icon: Archive },
  { href: '/contingencia', label: 'Contingência',  icon: ShieldAlert },
  { href: '/settings',     label: 'Ajustes',       icon: Settings },
]

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-[60px] lg:w-[220px] h-screen bg-[#111118] border-r border-[#22222E] shrink-0 py-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center shrink-0">
          <span className="text-lg">⚡</span>
        </div>
        <span className="hidden lg:block font-700 text-[#F0F0F8] text-sm leading-tight">
          Lowticket<br />Manager
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-500 transition-all duration-150',
                active
                  ? 'bg-[#7C3AED1A] text-[#8B5CF6]'
                  : 'text-[#9090A8] hover:bg-[#1A1A24] hover:text-[#F0F0F8]'
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-2 pt-4 border-t border-[#22222E]">
        <div className="flex items-center gap-3 px-2 py-2">
          <UserAvatar name={profile.name} color={profile.avatar_color} size="sm" />
          <span className="hidden lg:block text-sm font-500 text-[#F0F0F8] truncate flex-1">
            {profile.name}
          </span>
          <button
            onClick={handleLogout}
            className="hidden lg:flex p-1 rounded-lg text-[#5A5A70] hover:text-[#EF4444] transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
