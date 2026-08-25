'use client'

import { cn } from '@/lib/utils'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { DEFAULT_TASK_STATUSES } from '@/lib/constants'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { data: statuses = DEFAULT_TASK_STATUSES } = useTaskStatuses()
  const config = statuses.find(s => s.id === status) ?? { label: status, color: '#6B7280' }

  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-600 shrink-0', className)}
      style={{ color: config.color, backgroundColor: `${config.color}20` }}
    >
      {config.label}
    </span>
  )
}
