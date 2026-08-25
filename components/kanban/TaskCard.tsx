'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, Zap } from 'lucide-react'
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

  // Renderizar como separador/divisor
  if (task.title.startsWith('---')) {
    const label = task.title.replace(/^---/, '').trim()
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => onClick(task)}
        className={cn(
          'group flex items-center gap-2 py-2 px-1 cursor-pointer',
          isDragging && 'opacity-50'
        )}
      >
        <div className="flex-1 h-px bg-[#22222E]" />
        <span className="text-[10px] text-[#5A5A70] font-700 shrink-0 group-hover:text-[#9090A8] transition-colors uppercase tracking-wider">
          {label || '─────'}
        </span>
        <div className="flex-1 h-px bg-[#22222E]" />
      </div>
    )
  }

  const doneItems = task.checklist.filter(i => i.done).length
  const totalItems = task.checklist.length
  const category = TASK_CATEGORIES.find(c => c.value === task.category)
  const previewItems = task.checklist.slice(0, 3)

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
        task.is_urgent && 'border border-[#EF4444] shadow-[0_0_10px_#EF444428]',
        !task.is_urgent && 'border border-transparent',
        isDragging && 'opacity-50 scale-[0.98]',
        isPast && 'opacity-60'
      )}
    >
      {/* Urgente badge */}
      {task.is_urgent && (
        <div className="flex items-center gap-1 mb-2 -mt-0.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-700 bg-[#EF44441A] text-[#EF4444] tracking-wide uppercase">
            <Zap size={9} className="fill-[#EF4444]" />
            Urgente
          </span>
        </div>
      )}

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

      {/* Checklist preview */}
      {previewItems.length > 0 && (
        <div className="mb-2 pt-2 border-t border-[#22222E] space-y-1">
          {previewItems.map(item => (
            <div key={item.id} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'w-3 h-3 rounded border shrink-0',
                  item.done ? 'bg-[#10B981] border-[#10B981]' : 'border-[#5A5A70]'
                )}
              />
              <span
                className={cn(
                  'text-[10px] truncate',
                  item.done ? 'line-through text-[#5A5A70]' : 'text-[#9090A8]'
                )}
              >
                {item.text}
              </span>
            </div>
          ))}
          {task.checklist.length > 3 && (
            <span className="text-[10px] text-[#5A5A70]">
              +{task.checklist.length - 3} item(s)
            </span>
          )}
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
