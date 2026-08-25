'use client'

import { useState } from 'react'
import { Plus, Archive, ExternalLink, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { AcervoModal } from '@/components/acervo/AcervoModal'
import { useAcervoCards } from '@/hooks/useAcervo'
import { cn } from '@/lib/utils'
import type { AcervoCard } from '@/lib/types'

export function AcervoPageClient() {
  const { data: cards = [], isLoading } = useAcervoCards()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<AcervoCard | null>(null)

  function openNew() {
    setSelectedCard(null)
    setModalOpen(true)
  }

  function openEdit(card: AcervoCard) {
    setSelectedCard(card)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedCard(null)
  }

  return (
    <>
      <Header title="Acervo">
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors active:scale-[0.98]"
        >
          <Plus size={14} />
          Novo card
        </button>
      </Header>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-[#111118] border border-[#22222E] animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#111118] border border-[#22222E] flex items-center justify-center">
              <Archive size={28} className="text-[#5A5A70]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-600 text-[#9090A8]">Acervo vazio</p>
              <p className="text-xs text-[#5A5A70] mt-1">Adicione cards com informações, referências e links</p>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
            >
              <Plus size={15} />
              Criar primeiro card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cards.map((card, i) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openEdit(card)}
                className="group text-left bg-[#111118] rounded-2xl border border-[#22222E] hover:border-[#7C3AED40] overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.08)] active:scale-[0.99]"
              >
                {/* Accent top bar */}
                <div className="h-1 w-full" style={{ backgroundColor: card.color }} />

                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-700 text-sm text-[#F0F0F8] mb-2 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                    {card.title}
                  </h3>

                  {/* Content preview */}
                  {card.content && (
                    <p className="text-[11px] text-[#9090A8] leading-relaxed line-clamp-4 mb-3">
                      {card.content}
                    </p>
                  )}

                  {/* Footer info */}
                  <div className={cn('flex items-center gap-3 mt-auto', (card.content) ? '' : 'mt-2')}>
                    {card.links?.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-[#5A5A70]">
                        <ExternalLink size={10} />
                        {card.links.length} {card.links.length === 1 ? 'link' : 'links'}
                      </span>
                    )}
                    {!card.content && card.links?.length === 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-[#5A5A70]">
                        <FileText size={10} />
                        Vazio
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}

            {/* Add new card button */}
            <button
              onClick={openNew}
              className="flex flex-col items-center justify-center gap-2 h-40 rounded-2xl border-2 border-dashed border-[#22222E] hover:border-[#7C3AED40] text-[#5A5A70] hover:text-[#8B5CF6] transition-all"
            >
              <Plus size={20} />
              <span className="text-xs font-600">Novo card</span>
            </button>
          </div>
        )}
      </div>

      <AcervoModal
        card={selectedCard}
        open={modalOpen}
        onClose={closeModal}
        nextPosition={cards.length}
      />
    </>
  )
}
