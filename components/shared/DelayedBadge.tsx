import { cn } from '@/lib/utils'
import { DAYS_OF_WEEK } from '@/lib/weeks'

interface DelayedBadgeProps {
  originalWeekKey?: string
  originalDayOfWeek?: number
  className?: string
}

export function DelayedBadge({ originalWeekKey, originalDayOfWeek, className }: DelayedBadgeProps) {
  const dayLabel = originalDayOfWeek !== undefined
    ? DAYS_OF_WEEK.find(d => d.index === originalDayOfWeek)?.label
    : null

  const tooltip = originalWeekKey && dayLabel
    ? `Originalmente: Semana ${originalWeekKey}, ${dayLabel}`
    : 'Tarefa atrasada'

  return (
    <span
      title={tooltip}
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-600',
        'bg-[#EF444420] text-[#EF4444]',
        className
      )}
    >
      🔴 Atrasada
    </span>
  )
}
