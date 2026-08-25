import { cn } from '@/lib/utils'
import { ASSIGNEE_COLORS } from '@/lib/constants'
import type { AssigneeName } from '@/lib/types'

interface AssigneeBadgeProps {
  name: AssigneeName
  size?: 'sm' | 'md'
  className?: string
}

export function AssigneeBadge({ name, size = 'sm', className }: AssigneeBadgeProps) {
  const color = ASSIGNEE_COLORS[name] ?? '#6B7280'

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-700 text-white shrink-0',
        size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs',
        className
      )}
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.charAt(0)}
    </div>
  )
}
