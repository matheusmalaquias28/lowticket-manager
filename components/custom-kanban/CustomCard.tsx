'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKanbanLabels } from '@/hooks/useCustomKanban'
import type { CustomCard } from '@/lib/types'

interface CustomCardProps {
  card: CustomCard
  onClick: (card: CustomCard) => void
}

const ASSIGNEE_COLORS: Record<string, string> = {
  Matheus: '#7C3AED',
  Kauan:   '#0EA5E9',
}

export function CustomCardItem({ card, onClick }: CustomCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId: card.column_id },
  })
  const { data: labels = [] } = useKanbanLabels()

  const cardLabels = labels.filter(l => card.label_ids?.includes(l.id))
  const isCreative = card.card_type === 'creative'
  const creativeCount = (card.creatives ?? []).length

  // First image thumbnail from creatives
  const firstImage = (card.creatives ?? [])
    .flatMap(c => c.formats ?? [])
    .find(f => f.image_url)

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
        isDragging && 'opacity-40 scale-[0.97]',
      )}
    >
      {/* Labels color bars */}
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

      {/* Creative thumbnail if available */}
      {isCreative && firstImage && (
        <div className="mb-2 rounded-lg overflow-hidden h-24 w-full border border-[#22222E]">
          <img
            src={firstImage.image_url}
            alt="criativo"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title row */}
      <div className="flex items-start gap-1.5">
        <p className="flex-1 text-xs font-600 text-[#F0F0F8] leading-snug">{card.title}</p>
      </div>

      {/* Description preview */}
      {card.description && (
        <p className="text-[10px] text-[#5A5A70] mt-1 line-clamp-2">{card.description}</p>
      )}

      {/* Label name chips */}
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

      {/* Footer: type badge + creative count + assignee */}
      {(isCreative || card.assignee) && (
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {isCreative && (
              <span className="inline-flex items-center gap-1 text-[9px] font-700 text-[#8B5CF6] bg-[#7C3AED1A] px-1.5 py-0.5 rounded-md">
                <ImageIcon size={9} />
                {creativeCount > 0 ? `${creativeCount} criativo${creativeCount > 1 ? 's' : ''}` : 'Criativo'}
              </span>
            )}
          </div>

          {card.assignee && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-700 text-white shrink-0"
              style={{ backgroundColor: ASSIGNEE_COLORS[card.assignee] ?? '#5A5A70' }}
              title={card.assignee}
            >
              {card.assignee[0]}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
