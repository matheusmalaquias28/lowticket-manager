'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChecklistItem } from '@/lib/types'

interface ChecklistEditorProps {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}

export function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const doneCount = items.filter(i => i.done).length
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0

  const toggle = useCallback(
    (id: string) => {
      onChange(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
    },
    [items, onChange]
  )

  const updateText = useCallback(
    (id: string, text: string) => {
      onChange(items.map(i => i.id === id ? { ...i, text } : i))
    },
    [items, onChange]
  )

  const remove = useCallback(
    (id: string) => {
      onChange(items.filter(i => i.id !== id))
    },
    [items, onChange]
  )

  const addItem = useCallback(() => {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: '',
      done: false,
    }
    onChange([...items, newItem])
  }, [items, onChange])

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1 bg-[#22222E] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#10B981] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-[#5A5A70] font-500">
            {doneCount}/{items.length}
          </span>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-2 p-2 rounded-lg hover:bg-[#1A1A24] transition-colors"
          >
            <GripVertical size={14} className="text-[#5A5A70] opacity-0 group-hover:opacity-100 shrink-0 cursor-grab" />
            <button
              onClick={() => toggle(item.id)}
              className={cn(
                'w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors',
                item.done
                  ? 'bg-[#10B981] border-[#10B981]'
                  : 'border-[#22222E] hover:border-[#7C3AED]'
              )}
            >
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <input
              type="text"
              value={item.text}
              onChange={e => updateText(item.id, e.target.value)}
              placeholder="Item do checklist..."
              className={cn(
                'flex-1 bg-transparent text-xs text-[#F0F0F8] placeholder:text-[#5A5A70]',
                'focus:outline-none',
                item.done && 'line-through text-[#5A5A70]'
              )}
            />
            <button
              onClick={() => remove(item.id)}
              className="opacity-0 group-hover:opacity-100 text-[#5A5A70] hover:text-[#EF4444] transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        className="flex items-center gap-1.5 text-xs text-[#5A5A70] hover:text-[#8B5CF6] transition-colors py-1"
      >
        <Plus size={14} />
        Adicionar item
      </button>
    </div>
  )
}
