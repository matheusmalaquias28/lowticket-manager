'use client'

import { ActivityBell } from './ActivityBell'

interface HeaderProps {
  title: string
  children?: React.ReactNode
}

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-[#22222E] bg-[#111118] shrink-0">
      <h1 className="text-base font-700 text-[#F0F0F8]">{title}</h1>
      <div className="flex items-center gap-3">
        {children}
        <ActivityBell />
      </div>
    </header>
  )
}
