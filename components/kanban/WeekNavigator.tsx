'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatWeekLabel } from '@/lib/weeks'

interface WeekNavigatorProps {
  weekKey: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  isCurrentWeek: boolean
  isPastWeek: boolean
}

export function WeekNavigator({
  weekKey,
  onPrev,
  onNext,
  onToday,
  isCurrentWeek,
  isPastWeek,
}: WeekNavigatorProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'text-[#9090A8] hover:text-[#F0F0F8] hover:bg-[#1A1A24]',
          'border border-[#22222E] transition-colors'
        )}
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-600 text-[#F0F0F8]">
          {formatWeekLabel(weekKey)}
        </span>
        {isPastWeek && (
          <span className="text-[10px] font-600 px-2 py-0.5 rounded-full bg-[#EF444420] text-[#EF4444]">
            Semana encerrada
          </span>
        )}
      </div>

      <button
        onClick={onNext}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'text-[#9090A8] hover:text-[#F0F0F8] hover:bg-[#1A1A24]',
          'border border-[#22222E] transition-colors'
        )}
      >
        <ChevronRight size={16} />
      </button>

      {!isCurrentWeek && (
        <button
          onClick={onToday}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600',
            'text-[#8B5CF6] bg-[#7C3AED1A] hover:bg-[#7C3AED30]',
            'border border-[#7C3AED40] transition-colors'
          )}
        >
          <Calendar size={12} />
          Semana atual
        </button>
      )}
    </div>
  )
}
