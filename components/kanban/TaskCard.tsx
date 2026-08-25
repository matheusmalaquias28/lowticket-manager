'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TASK_CATEGORIES } from '@/lib/constants'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AssigneeBadge } from '@/components/shared/AssigneeBadge'
import { DelayedBadge } from '@/components/shared/DelayedBadge'
import type { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  isPast?: boolean
}

export function TaskCard({ task, onClick, isPast = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const doneItems = task.checklist.filter(i => i.done).length
  const totalItems = task.checklist.length
  const category = TASK_CATEGORIES.find(c => c.value === task.category)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        'group relative p-3 rounded-xl cursor-pointer select-none',
        'bg-[#111118] shadow-card',
        'hover:shadow-card-hover hover:bg-[#1A1A24]',
        'transition-all duration-200',
        isDragging && 'opacity-50 shadow-card-hover scale-[0.98]',
        isPast && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-600 text-[#F0F0F8] leading-snug line-clamp-2 flex-1">
          {task.title}
        </p>
        <StatusBadge status={task.status} />
      </div>

      {/* Delayed badge */}
      {task.is_delayed && (
        <div className="mb-2">
          <DelayedBadge
            originalWeekKey={task.original_week_key}
            originalDayOfWeek={task.original_day_of_week}
          />
        </div>
      )}

      {/* Offer chip */}
      {task.offer && (
        <div
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-500 mb-2"
          style={{ backgroundColor: `${task.offer.color}20`, color: task.offer.color }}
        >
          <span>{task.offer.emoji}</span>
          <span className="truncate max-w-[80px]">{task.offer.name}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AssigneeBadge name={task.assignee_name} />
          {category && (
            <span className="text-[10px] text-[#5A5A70]">{category.icon}</span>
          )}
          {totalItems > 0 && (
            <span className="text-[10px] text-[#5A5A70]">
              {doneItems}/{totalItems} ✓
            </span>
          )}
        </div>
        {task.due_time && (
          <span className="flex items-center gap-0.5 text-[10px] text-[#5A5A70]">
            <Clock size={10} />
            {task.due_time}
          </span>
        )}
      </div>
    </div>
  )
}
