'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Columns } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useCustomColumns,
  useCustomCards,
  useCreateColumn,
  useUpdateColumn,
  useUpdateCard,
} from '@/hooks/useCustomKanban'
import { CustomColumnComp } from './CustomColumn'
import { CustomCardItem } from './CustomCard'
import { CardModal } from './CardModal'
import type { CustomCard, CustomColumn } from '@/lib/types'

const COLUMN_COLORS = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  if (hits.length > 0) return hits
  return closestCenter(args)
}

// Wrapper sortable para coluna (drag do header)
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
      className={cn('flex flex-col', isDragging && 'opacity-40')}
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
  const createColumn = useCreateColumn()
  const updateColumn = useUpdateColumn()
  const updateCard = useUpdateCard()

  const [activeCard, setActiveCard] = useState<CustomCard | null>(null)
  const [modalCard, setModalCard] = useState<CustomCard | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColColor, setNewColColor] = useState('#7C3AED')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const getCardsForColumn = useCallback(
    (colId: string) => allCards.filter(c => c.column_id === colId),
    [allCards]
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

  function handleDragStart(event: DragStartEvent) {
    const { data } = event.active
    if (data.current?.type === 'card') {
      const card = allCards.find(c => c.id === event.active.id)
      setActiveCard(card ?? null)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const activeData = active.data.current
    const overId = String(over.id)

    // Reorder columns
    if (activeData?.type === 'sortcol') {
      const activeIdx = columns.findIndex(c => `sortcol-${c.id}` === String(active.id))
      const overIdx = columns.findIndex(c => `sortcol-${c.id}` === overId)
      if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
        const reordered = arrayMove(columns, activeIdx, overIdx)
        await Promise.all(reordered.map((col, i) => {
          if (col.position !== i) return updateColumn.mutateAsync({ id: col.id, position: i })
        }))
      }
      return
    }

    // Move card
    if (activeData?.type === 'card') {
      const card = allCards.find(c => c.id === String(active.id))
      if (!card) return

      let targetColumnId = card.column_id

      // Dropped on column droppable
      if (overId.startsWith('col-')) {
        targetColumnId = overId.replace('col-', '')
      } else {
        // Dropped on another card
        const overCard = allCards.find(c => c.id === overId)
        if (overCard) targetColumnId = overCard.column_id
      }

      if (targetColumnId !== card.column_id) {
        await updateCard.mutateAsync({ id: card.id, column_id: targetColumnId })
      }
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

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 px-4 pb-4 overflow-x-auto snap-x-scroll">
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

          {/* Add column panel */}
          {addingColumn ? (
            <div className="min-w-[220px] w-[220px] bg-[#111118] border border-[#7C3AED40] rounded-xl p-3 space-y-3 shrink-0 self-start">
              <input
                autoFocus
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddColumn(); if (e.key === 'Escape') setAddingColumn(false) }}
                placeholder="Nome da coluna..."
                className="w-full bg-transparent text-sm font-700 text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none"
              />
              {/* Color picker */}
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

        <DragOverlay>
          {activeCard && (
            <div className="rotate-2 opacity-90 w-[220px]">
              <CustomCardItem card={activeCard} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <CardModal
        card={modalCard}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setModalCard(null) }}
      />
    </div>
  )
}
