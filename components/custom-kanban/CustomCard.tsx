'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { useKanbanLabels } from '@/hooks/useCustomKanban'
import type { CustomCard } from '@/lib/types'

interface CustomCardProps {
  card: CustomCard
  onClick: (card: CustomCard) => void
}

export function CustomCardItem({ card, onClick }: CustomCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId: card.column_id },
  })
  const { data: labels = [] } = useKanbanLabels()

  const cardLabels = labels.filter(l => card.label_ids?.includes(l.id))

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(card)}
      className={cn(
        'group p-3 rounded-xl cursor-pointer select-none',
        'bg-[#0A0A0F] border border-[#22222E]',
        'hover:border-[#7C3AED40] hover:bg-[#111118]',
        'transition-all duration-150',
        isDragging && 'opacity-40 scale-[0.97]'
      )}
    >
      {/* Labels */}
      {cardLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {cardLabels.map(lbl => (
            <span
              key={lbl.id}
              className="inline-block h-1.5 rounded-full min-w-[28px]"
              style={{ backgroundColor: lbl.color }}
              title={lbl.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-xs font-600 text-[#F0F0F8] leading-snug">{card.title}</p>

      {/* Description preview */}
      {card.description && (
        <p className="text-[10px] text-[#5A5A70] mt-1 line-clamp-2">{card.description}</p>
      )}

      {/* Label names (on hover) */}
      {cardLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {cardLabels.map(lbl => (
            <span
              key={lbl.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-600"
              style={{ backgroundColor: `${lbl.color}20`, color: lbl.color }}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
