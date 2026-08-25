'use client'

import { useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Trash2, Check, X, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateCard, useUpdateColumn, useDeleteColumn } from '@/hooks/useCustomKanban'
import { CustomCardItem } from './CustomCard'
import type { CustomCard, CustomColumn } from '@/lib/types'

interface CustomColumnProps {
  column: CustomColumn
  cards: CustomCard[]
  onCardClick: (card: CustomCard) => void
  dragHandleProps?: Record<string, unknown>
}

export function CustomColumnComp({ column, cards, onCardClick, dragHandleProps }: CustomColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { type: 'column', columnId: column.id },
  })

  const createCard = useCreateCard()
  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(column.name)
  const [addingCard, setAddingCard] = useState(false)
  const [cardTitle, setCardTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const cardInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  useEffect(() => {
    if (addingCard) cardInputRef.current?.focus()
  }, [addingCard])

  async function saveName() {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== column.name) {
      await updateColumn.mutateAsync({ id: column.id, name: trimmed })
    } else {
      setNameValue(column.name)
    }
    setEditingName(false)
  }

  async function handleAddCard() {
    const t = cardTitle.trim()
    if (!t) { setAddingCard(false); return }
    await createCard.mutateAsync({ column_id: column.id, title: t, position: cards.length })
    setCardTitle('')
    setAddingCard(false)
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
          'bg-[#1A1A24] border-[#22222E]'
        )}
        style={{ borderTopColor: column.color }}
      >
        {/* Drag handle */}
        <span
          {...dragHandleProps}
          className="text-[#5A5A70] cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical size={13} />
        </span>

        {/* Name */}
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameValue(column.name); setEditingName(false) } }}
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

        {/* Card count */}
        {cards.length > 0 && (
          <span className="text-[10px] font-600 text-[#5A5A70] shrink-0">{cards.length}</span>
        )}

        {/* Delete */}
        <button
          onClick={handleDeleteColumn}
          onBlur={() => setConfirmDelete(false)}
          className={cn(
            'shrink-0 text-[#5A5A70] transition-colors',
            confirmDelete ? 'text-[#EF4444]' : 'hover:text-[#EF4444]'
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
            isOver && 'bg-[#7C3AED08] border-[#7C3AED40]'
          )}
        >
          {cards.map(card => (
            <CustomCardItem key={card.id} card={card} onClick={onCardClick} />
          ))}

          {/* Add card input */}
          {addingCard && (
            <div className="bg-[#0A0A0F] border border-[#7C3AED40] rounded-xl p-2.5">
              <input
                ref={cardInputRef}
                value={cardTitle}
                onChange={e => setCardTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCard()
                  if (e.key === 'Escape') { setAddingCard(false); setCardTitle('') }
                }}
                placeholder="Título do card..."
                className="w-full bg-transparent text-xs text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none"
              />
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  onClick={handleAddCard}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
                >
                  <Check size={11} />
                  Adicionar
                </button>
                <button
                  onClick={() => { setAddingCard(false); setCardTitle('') }}
                  className="p-1 text-[#5A5A70] hover:text-[#F0F0F8] transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Add card button */}
          {!addingCard && (
            <button
              onClick={() => setAddingCard(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-[#5A5A70] hover:text-[#8B5CF6] hover:bg-[#7C3AED1A] transition-colors w-full"
            >
              <Plus size={12} />
              Adicionar card
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
