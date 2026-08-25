'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useWeekGoals,
  useCreateWeekGoal,
  useUpdateWeekGoal,
  useDeleteWeekGoal,
} from '@/hooks/useWeekGoals'

interface WeekGoalsProps {
  weekKey: string
  isPastWeek?: boolean
}

export function WeekGoals({ weekKey, isPastWeek }: WeekGoalsProps) {
  const { data: goals = [] } = useWeekGoals(weekKey)
  const createGoal = useCreateWeekGoal()
  const updateGoal = useUpdateWeekGoal()
  const deleteGoal = useDeleteWeekGoal()

  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const done = goals.filter(g => g.done).length
  const total = goals.length

  async function handleAdd() {
    const text = newText.trim()
    if (!text) { setAdding(false); return }
    await createGoal.mutateAsync({ weekKey, text, position: total })
    setNewText('')
    setAdding(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') { setAdding(false); setNewText('') }
  }

  async function toggleDone(id: string, current: boolean) {
    await updateGoal.mutateAsync({ id, weekKey, done: !current })
  }

  async function handleDelete(id: string) {
    await deleteGoal.mutateAsync({ id, weekKey })
  }

  return (
    <div className="rounded-xl border border-[#22222E] bg-[#111118] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#22222E] bg-[#7C3AED0D]">
        <div className="flex items-center gap-2">
          <Target size={13} className="text-[#8B5CF6]" />
          <span className="text-xs font-700 text-[#8B5CF6]">Metas da semana</span>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-[10px] font-600 text-[#5A5A70]">
              {done}/{total}
            </span>
          )}
          {!isPastWeek && (
            <button
              onClick={() => setAdding(true)}
              className="w-5 h-5 rounded-md flex items-center justify-center text-[#5A5A70] hover:text-[#8B5CF6] hover:bg-[#7C3AED1A] transition-colors"
            >
              <Plus size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-0.5 bg-[#22222E]">
          <div
            className="h-full bg-[#7C3AED] transition-all duration-500"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}

      {/* Goals list */}
      <div className="p-2 space-y-1">
        {goals.length === 0 && !adding && (
          <p className="text-[10px] text-[#5A5A70] text-center py-3">
            Nenhuma meta ainda
          </p>
        )}

        {goals.map(goal => (
          <div
            key={goal.id}
            className="group flex items-start gap-2 px-1.5 py-1 rounded-lg hover:bg-[#1A1A24] transition-colors"
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleDone(goal.id, goal.done)}
              className={cn(
                'mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-all',
                goal.done
                  ? 'bg-[#7C3AED] border-[#7C3AED]'
                  : 'border-[#5A5A70] hover:border-[#8B5CF6]'
              )}
            >
              {goal.done && (
                <svg viewBox="0 0 10 8" className="w-2 h-2 fill-white">
                  <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Text */}
            <span
              className={cn(
                'flex-1 text-[11px] leading-snug',
                goal.done ? 'line-through text-[#5A5A70]' : 'text-[#D0D0E0]'
              )}
            >
              {goal.text}
            </span>

            {/* Delete */}
            {!isPastWeek && (
              <button
                onClick={() => handleDelete(goal.id)}
                className="opacity-0 group-hover:opacity-100 text-[#5A5A70] hover:text-[#EF4444] transition-all shrink-0 mt-0.5"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}

        {/* Add input */}
        {adding && (
          <div className="flex items-center gap-2 px-1.5 py-1">
            <div className="mt-0.5 w-3.5 h-3.5 rounded border border-[#5A5A70] shrink-0" />
            <input
              ref={inputRef}
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleAdd}
              placeholder="Nova meta..."
              className="flex-1 bg-transparent text-[11px] text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none"
            />
          </div>
        )}

        {/* Add button (when not adding) */}
        {!adding && !isPastWeek && (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-1.5 px-1.5 py-1.5 text-[10px] text-[#5A5A70] hover:text-[#8B5CF6] transition-colors rounded-lg hover:bg-[#1A1A24]"
          >
            <Plus size={11} />
            Adicionar meta
          </button>
        )}
      </div>
    </div>
  )
}
