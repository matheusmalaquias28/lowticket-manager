import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ name, color, size = 'md', className }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase()

  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-700 text-white shrink-0',
        sizes[size],
        className
      )}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initial}
    </div>
  )
}
