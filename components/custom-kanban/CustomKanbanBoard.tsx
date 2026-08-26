'use client'

import { useState, useCallback } from 'react'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Columns, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useCustomColumns,
  useCustomCards,
  useCreateColumn,
  useKanbanLabels,
} from '@/hooks/useCustomKanban'
import { CustomColumnComp } from './CustomColumn'
import { CardModal } from './CardModal'
import type { CustomCard, CustomColumn } from '@/lib/types'

const COLUMN_COLORS = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

function SortableColumn({
  column, cards, onCardClick,
}: { column: CustomColumn; cards: CustomCard[]; onCardClick: (c: CustomCard) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `sortcol-${column.id}`,
    data: { type: 'sortcol' },
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex flex-col flex-1 min-w-[180px]', isDragging && 'opacity-40')}
    >
      <CustomColumnComp
        column={column}
        cards={cards}
        onCardClick={onCardClick}
        dragHandleProps={{ ...attributes, ...listeners } as Record<string, unknown>}
      />
    </div>
  )
}

export function CustomKanbanBoard() {
  const { data: columns = [] } = useCustomColumns()
  const { data: allCards = [] } = useCustomCards()
  const { data: labels = [] } = useKanbanLabels()
  const createColumn = useCreateColumn()

  const [modalCard, setModalCard] = useState<CustomCard | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColColor, setNewColColor] = useState('#7C3AED')
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([])

  function toggleFilter(id: string) {
    setFilterLabelIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const filteredCards = filterLabelIds.length === 0
    ? allCards
    : allCards.filter(c => filterLabelIds.every(id => (c.label_ids ?? []).includes(id)))

  const getCardsForColumn = useCallback(
    (colId: string) => filteredCards.filter(c => c.column_id === colId),
    [filteredCards]
  )

  const columnIds = columns.map(c => `sortcol-${c.id}`)

  function openCard(card: CustomCard) {
    setModalCard(card)
    setModalOpen(true)
  }

  async function handleAddColumn() {
    const name = newColName.trim()
    if (!name) { setAddingColumn(false); return }
    try {
      await createColumn.mutateAsync({ name, color: newColColor, position: columns.length })
      setNewColName('')
      setNewColColor('#7C3AED')
      setAddingColumn(false)
    } catch {
      toast.error('Erro ao criar coluna.')
    }
  }

  return (
    <div className="flex flex-col">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Columns size={14} className="text-[#5A5A70]" />
          <span className="text-xs font-700 text-[#9090A8] uppercase tracking-wider">Quadro livre</span>
        </div>
        <button
          onClick={() => setAddingColumn(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-600 text-[#5A5A70] hover:text-[#8B5CF6] hover:bg-[#7C3AED1A] transition-colors border border-[#22222E]"
        >
          <Plus size={12} />
          Nova coluna
        </button>
      </div>

      {/* Filtro por etiquetas */}
      {labels.length > 0 && (
        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
          <span className="text-[10px] font-600 text-[#5A5A70] uppercase tracking-wider">Filtrar:</span>
          {labels.map(lbl => {
            const active = filterLabelIds.includes(lbl.id)
            return (
              <button
                key={lbl.id}
                onClick={() => toggleFilter(lbl.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-600 border transition-all',
                  active
                    ? 'border-transparent text-white'
                    : 'border-[#22222E] hover:border-current bg-transparent'
                )}
                style={active ? { backgroundColor: lbl.color } : { color: lbl.color }}
              >
                {lbl.name}
                {active && <X size={9} strokeWidth={3} />}
              </button>
            )
          })}
          {filterLabelIds.length > 0 && (
            <button
              onClick={() => setFilterLabelIds([])}
              className="text-[10px] text-[#5A5A70] hover:text-[#F0F0F8] transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Board */}
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto">
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {columns.map(col => (
            <SortableColumn
              key={col.id}
              column={col}
              cards={getCardsForColumn(col.id)}
              onCardClick={openCard}
            />
          ))}
        </SortableContext>

        {addingColumn ? (
          <div className="flex-1 min-w-[180px] bg-[#111118] border border-[#7C3AED40] rounded-xl p-3 space-y-3 self-start">
            <input
              autoFocus
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddColumn(); if (e.key === 'Escape') setAddingColumn(false) }}
              placeholder="Nome da coluna..."
              className="w-full bg-transparent text-sm font-700 text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {COLUMN_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColColor(c)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-all',
                    newColColor === c && 'ring-2 ring-offset-1 ring-offset-[#111118] ring-white scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddColumn}
                disabled={!newColName.trim()}
                className="flex-1 py-1.5 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors disabled:opacity-50"
              >
                Criar
              </button>
              <button
                onClick={() => { setAddingColumn(false); setNewColName('') }}
                className="p-1.5 rounded-lg text-[#5A5A70] hover:text-[#F0F0F8] hover:bg-[#1A1A24] transition-colors"
              >
                <Plus size={13} className="rotate-45" />
              </button>
            </div>
          </div>
        ) : (
          columns.length === 0 && (
            <div className="flex items-center justify-center w-full py-8">
              <button
                onClick={() => setAddingColumn(true)}
                className="flex flex-col items-center gap-2 text-[#5A5A70] hover:text-[#8B5CF6] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-[#22222E] flex items-center justify-center hover:border-[#7C3AED40]">
                  <Plus size={20} />
                </div>
                <span className="text-xs">Criar primeira coluna</span>
              </button>
            </div>
          )
        )}
      </div>

      <CardModal
        card={modalCard}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setModalCard(null) }}
      />
    </div>
  )
}
