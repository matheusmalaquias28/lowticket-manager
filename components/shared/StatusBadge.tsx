import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/lib/types'

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: '#6B7280', bg: '#6B728020' },
  in_progress: { label: 'Em andamento', color: '#F59E0B', bg: '#F59E0B20' },
  done: { label: 'Feita', color: '#10B981', bg: '#10B98120' },
}

interface StatusBadgeProps {
  status: TaskStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-600', className)}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.label}
    </span>
  )
}
