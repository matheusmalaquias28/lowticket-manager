import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon = '📭', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center px-4', className)}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-sm font-600 text-[#F0F0F8] mb-1">{title}</h3>
      {description && <p className="text-xs text-[#5A5A70] mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
