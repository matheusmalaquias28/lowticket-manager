'use client'

import { useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUpdateColumn, useDeleteColumn } from '@/hooks/useCustomKanban'
import { CustomCardItem } from './CustomCard'
import type { CustomCard, CustomColumn } from '@/lib/types'

interface CustomColumnProps {
  column: CustomColumn
  cards: CustomCard[]
  onCardClick: (card: CustomCard) => void
  onAddCard: () => void
  dragHandleProps?: Record<string, unknown>
}

export function CustomColumnComp({ column, cards, onCardClick, onAddCard, dragHandleProps }: CustomColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { type: 'column', columnId: column.id },
  })

  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()

  const [editingName, setEditingName]   = useState(false)
  const [nameValue, setNameValue]       = useState(column.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  async function saveName() {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== column.name) {
      await updateColumn.mutateAsync({ id: column.id, name: trimmed })
    } else {
      setNameValue(column.name)
    }
    setEditingName(false)
  }

  async function handleDeleteColumn() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deleteColumn.mutateAsync(column.id)
  }

  const cardIds = cards.map(c => c.id)

  return (
    <div className="flex flex-col flex-1 min-w-[180px]">
      {/* Column header */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-t-xl border border-b-0',
          'bg-[#1A1A24] border-[#22222E]',
        )}
        style={{ borderTopColor: column.color }}
      >
        <span
          {...dragHandleProps}
          className="text-[#5A5A70] cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical size={13} />
        </span>

        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => {
              if (e.key === 'Enter') saveName()
              if (e.key === 'Escape') { setNameValue(column.name); setEditingName(false) }
            }}
            className="flex-1 bg-transparent text-xs font-700 text-[#F0F0F8] focus:outline-none"
          />
        ) : (
          <span
            className="flex-1 text-xs font-700 text-[#F0F0F8] cursor-pointer truncate"
            onDoubleClick={() => setEditingName(true)}
            title="Clique duplo para renomear"
          >
            {column.name}
          </span>
        )}

        {cards.length > 0 && (
          <span className="text-[10px] font-600 text-[#5A5A70] shrink-0">{cards.length}</span>
        )}

        <button
          onClick={handleDeleteColumn}
          onBlur={() => setConfirmDelete(false)}
          className={cn(
            'shrink-0 text-[#5A5A70] transition-colors',
            confirmDelete ? 'text-[#EF4444]' : 'hover:text-[#EF4444]',
          )}
          title={confirmDelete ? 'Clique novamente para confirmar' : 'Excluir coluna'}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Cards area */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex-1 flex flex-col gap-2 p-2 rounded-b-xl border border-t-0 min-h-[80px]',
            'bg-[#111118] border-[#22222E] transition-colors',
            isOver && 'bg-[#7C3AED08] border-[#7C3AED40]',
          )}
        >
          {cards.map(card => (
            <CustomCardItem key={card.id} card={card} onClick={onCardClick} />
          ))}

          {/* Add card button → opens modal */}
          <button
            onClick={onAddCard}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-[#5A5A70] hover:text-[#8B5CF6] hover:bg-[#7C3AED1A] transition-colors w-full"
          >
            <Plus size={12} />
            Adicionar card
          </button>
        </div>
      </SortableContext>
    </div>
  )
}
