'use client'

import Link from 'next/link'
import { MoreHorizontal, ShoppingCart, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OFFER_STATUSES } from '@/lib/constants'
import type { Offer } from '@/lib/types'

interface OfferCardProps {
  offer: Offer
  onEdit: (offer: Offer) => void
  taskCount?: number
  doneTaskCount?: number
}

export function OfferCard({ offer, onEdit, taskCount = 0, doneTaskCount = 0 }: OfferCardProps) {
  const statusConfig = OFFER_STATUSES.find(s => s.value === offer.status)
  const progress = taskCount > 0 ? (doneTaskCount / taskCount) * 100 : 0

  return (
    <div
      className={cn(
        'group relative p-4 rounded-xl bg-[#111118] shadow-card overflow-hidden',
        'hover:shadow-card-hover hover:bg-[#1A1A24]',
        'transition-all duration-200 cursor-pointer'
      )}
    >
      {/* Edit button */}
      <button
        onClick={e => { e.stopPropagation(); onEdit(offer) }}
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#5A5A70] hover:text-[#F0F0F8] hover:bg-[#22222E] transition-all"
      >
        <MoreHorizontal size={16} />
      </button>

      <Link href={`/offers/${offer.id}`} className="block">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3 pr-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: `${offer.color}20` }}
          >
            {offer.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-700 text-[#F0F0F8] truncate">{offer.name}</h3>
            {offer.niche && (
              <span className="text-xs text-[#5A5A70] block truncate">{offer.niche}</span>
            )}
          </div>
        </div>

        {/* Status badge */}
        {statusConfig && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-600 mb-3"
            style={{ color: statusConfig.color, backgroundColor: `${statusConfig.color}20` }}
          >
            {statusConfig.label}
          </span>
        )}

        {/* Progress */}
        {taskCount > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-[#5A5A70] mb-1">
              <span>Tarefas na semana</span>
              <span>{doneTaskCount}/{taskCount}</span>
            </div>
            <div className="h-1 bg-[#22222E] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: offer.color }}
              />
            </div>
          </div>
        )}

        {taskCount === 0 && (
          <p className="text-[10px] text-[#5A5A70] mb-3">Nenhuma tarefa esta semana</p>
        )}

        {/* Links */}
        <div className="flex items-center gap-3 overflow-hidden">
          {offer.lp_url && (
            <a
              href={offer.lp_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-[#5A5A70] hover:text-[#8B5CF6] transition-colors shrink-0"
            >
              <Globe size={11} />
              LP
            </a>
          )}
          {offer.checkout_url && (
            <a
              href={offer.checkout_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              title={offer.checkout_url}
              className="flex items-center gap-1 text-[10px] text-[#5A5A70] hover:text-[#8B5CF6] transition-colors shrink-0"
            >
              <ShoppingCart size={11} />
              Checkout
            </a>
          )}
        </div>
      </Link>
    </div>
  )
}
