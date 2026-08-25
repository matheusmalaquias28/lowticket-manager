'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OFFER_STATUSES } from '@/lib/constants'
import { useOffers } from '@/hooks/useOffers'
import { getWeekKey } from '@/lib/weeks'
import { OfferCard } from '@/components/offers/OfferCard'
import { OfferModal } from '@/components/offers/OfferModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { Header } from '@/components/layout/Header'
import type { Offer, OfferStatus, Profile } from '@/lib/types'

const FILTER_OPTIONS: { value: OfferStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'development', label: 'Em dev' },
  { value: 'active', label: 'Ativas' },
  { value: 'paused', label: 'Pausadas' },
  { value: 'ended', label: 'Encerradas' },
]

interface OffersPageClientProps {
  profile: Profile
}

export function OffersPageClient({ profile }: OffersPageClientProps) {
  const { data: offers = [], isLoading } = useOffers()
  const [filter, setFilter] = useState<OfferStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)

  const filtered = filter === 'all' ? offers : offers.filter(o => o.status === filter)

  function openNew() {
    setEditingOffer(null)
    setModalOpen(true)
  }

  function openEdit(offer: Offer) {
    setEditingOffer(offer)
    setModalOpen(true)
  }

  return (
    <>
      <Header title="Ofertas">
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors active:scale-[0.98]"
        >
          <Plus size={14} />
          Nova oferta
        </button>
      </Header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-600 border transition-all',
                filter === opt.value
                  ? 'bg-[#7C3AED1A] text-[#8B5CF6] border-[#7C3AED40]'
                  : 'text-[#9090A8] border-[#22222E] hover:border-[#7C3AED40] hover:text-[#F0F0F8]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-[#111118] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="Nenhuma oferta encontrada"
            description={filter === 'all' ? 'Crie sua primeira oferta para começar.' : 'Sem ofertas com este status.'}
            action={
              filter === 'all' ? (
                <button
                  onClick={openNew}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
                >
                  <Plus size={14} />
                  Nova oferta
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </div>

      <OfferModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        offer={editingOffer}
        currentUserId={profile.id}
      />
    </>
  )
}
