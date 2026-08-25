'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { format, addDays, isToday, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getWeekStart } from '@/lib/weeks'
import { TaskCard } from './TaskCard'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Task } from '@/lib/types'

interface DayColumnProps {
  dayIndex: number
  dayLabel: string
  weekKey: string
  tasks: Task[]
  onAddTask: (dayOfWeek: number) => void
  onTaskClick: (task: Task) => void
  isWeekPast?: boolean
}

export function DayColumn({
  dayIndex,
  dayLabel,
  weekKey,
  tasks,
  onAddTask,
  onTaskClick,
  isWeekPast,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dayIndex}` })

  const weekStart = getWeekStart(weekKey)
  // Day offset: Mon=1 is offset 0, Tue=2 is offset 1, ..., Sun=0 is offset 6
  const dayOffset = dayIndex === 0 ? 6 : dayIndex - 1
  const date = addDays(weekStart, dayOffset)
  const isTodayDay = isToday(date)
  const isPastDay = isPast(date) && !isTodayDay

  const taskIds = tasks.map(t => t.id)

  return (
    <div
      className={cn(
        'flex flex-col min-w-[200px] w-[200px] lg:min-w-0 lg:w-auto lg:flex-1',
        'bg-[#111118] rounded-xl border border-[#22222E]',
        isTodayDay && 'border-t-2 border-t-[#7C3AED]',
        isOver && 'border-[#7C3AED40] bg-[#7C3AED08]'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#22222E]">
        <div>
          <p className={cn('text-xs font-700', isTodayDay ? 'text-[#8B5CF6]' : 'text-[#9090A8]')}>
            {dayLabel}
          </p>
          <p className={cn('text-[10px]', isTodayDay ? 'text-[#8B5CF6]' : 'text-[#5A5A70]')}>
            {format(date, "d 'de' MMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {tasks.length > 0 && (
            <span className="text-[10px] font-600 text-[#5A5A70] bg-[#1A1A24] px-1.5 py-0.5 rounded-md">
              {tasks.length}
            </span>
          )}
          <button
            onClick={() => onAddTask(dayIndex)}
            className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center',
              'text-[#5A5A70] hover:text-[#8B5CF6] hover:bg-[#7C3AED1A]',
              'transition-colors'
            )}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Tasks */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]"
        >
          {tasks.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Sem tarefas"
              className="py-6"
            />
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
                isPast={isPastDay && !isWeekPast}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}
