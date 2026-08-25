'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarPickerProps {
  value?: string // 'yyyy-MM-dd'
  onChange: (date: string) => void
  className?: string
}

const DAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function CalendarPicker({ value, onChange, className }: CalendarPickerProps) {
  const selected = value ? parseISO(value) : null
  const [viewDate, setViewDate] = useState(selected ?? new Date())

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className={cn('bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3 w-[220px]', className)}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9090A8] hover:text-[#F0F0F8] hover:bg-[#1A1A24] transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-700 text-[#F0F0F8] capitalize">
          {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9090A8] hover:text-[#F0F0F8] hover:bg-[#1A1A24] transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[9px] font-700 text-[#5A5A70] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const isSelected = value === dayStr
          const isCurrentMonth = isSameMonth(day, viewDate)
          const isTodayDay = isToday(day)

          return (
            <button
              key={dayStr}
              onClick={() => onChange(isSelected ? '' : dayStr)}
              className={cn(
                'w-7 h-7 rounded-lg text-[11px] flex items-center justify-center transition-all',
                !isCurrentMonth && 'opacity-25',
                isSelected && 'bg-[#7C3AED] text-white font-700',
                !isSelected && isTodayDay && 'text-[#8B5CF6] font-700 ring-1 ring-[#7C3AED40]',
                !isSelected && 'hover:bg-[#1A1A24]',
                isSelected && 'hover:bg-[#8B5CF6]'
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {value && (
        <button
          onClick={() => onChange('')}
          className="mt-2 w-full text-[10px] text-[#5A5A70] hover:text-[#EF4444] transition-colors text-center"
        >
          Limpar data
        </button>
      )}
    </div>
  )
}
