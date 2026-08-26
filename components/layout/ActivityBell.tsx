'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useActivityLogs } from '@/hooks/useActivityLogs'

const ACTION_ICONS: Record<string, string> = {
  task_created:    '✅',
  task_updated:    '✏️',
  task_deleted:    '🗑️',
  link_added:      '🔗',
  offer_created:   '🎯',
  offer_updated:   '✏️',
  creative_added:  '🎨',
  creative_deleted:'🗑️',
}

const LAST_SEEN_KEY = 'activity_last_seen'

export function ActivityBell() {
  const { data: logs = [] } = useActivityLogs()
  const [open, setOpen] = useState(false)
  const [lastSeen, setLastSeen] = useState<string>(() => {
    if (typeof window === 'undefined') return new Date().toISOString()
    return localStorage.getItem(LAST_SEEN_KEY) ?? new Date(0).toISOString()
  })
  const panelRef = useRef<HTMLDivElement>(null)

  const unread = logs.filter(l => l.created_at > lastSeen).length

  function openPanel() {
    setOpen(true)
    const now = new Date().toISOString()
    setLastSeen(now)
    localStorage.setItem(LAST_SEEN_KEY, now)
  }

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={open ? () => setOpen(false) : openPanel}
        className={cn(
          'relative p-2 rounded-lg border transition-colors',
          open
            ? 'border-[#7C3AED40] bg-[#7C3AED1A] text-[#8B5CF6]'
            : 'border-[#22222E] text-[#5A5A70] hover:text-[#F0F0F8] hover:bg-[#1A1A24]'
        )}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7C3AED] text-white text-[9px] font-700 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-80 bg-[#111118] border border-[#22222E] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Header do painel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#22222E]">
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-[#5A5A70]" />
                <span className="text-xs font-700 text-[#F0F0F8]">Atividade recente</span>
              </div>
              {logs.length > 0 && (
                <span className="text-[10px] text-[#5A5A70]">{logs.length} registros</span>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <CheckCheck size={24} className="text-[#2A2A38]" />
                  <p className="text-xs text-[#5A5A70]">Nenhuma atividade ainda</p>
                </div>
              ) : (
                logs.map((log, i) => {
                  const isUnread = log.created_at > lastSeen && i === 0
                  return (
                    <div
                      key={log.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 border-b border-[#0A0A0F] last:border-0',
                        isUnread && 'bg-[#7C3AED08]'
                      )}
                    >
                      <span className="text-base shrink-0 mt-0.5">
                        {ACTION_ICONS[log.action] ?? '📌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#F0F0F8] leading-snug">{log.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {log.actor_name && (
                            <span className="text-[10px] font-600 text-[#8B5CF6]">{log.actor_name}</span>
                          )}
                          {log.actor_name && <span className="text-[#2A2A38]">·</span>}
                          <span className="text-[10px] text-[#5A5A70]">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
