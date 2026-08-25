'use client'

import { useCallback } from 'react'
import { DAYS_OF_WEEK } from '@/lib/weeks'
import { DayColumn } from './DayColumn'
import type { Task } from '@/lib/types'

interface KanbanBoardProps {
  weekKey: string
  onTaskClick: (task: Task) => void
  onAddTask: (dayOfWeek: number) => void
  onAddDivider?: (dayOfWeek: number) => void
  isPastWeek: boolean
  localTasks: Task[]
  isLoading: boolean
}

export function KanbanBoard({
  weekKey,
  onTaskClick,
  onAddTask,
  onAddDivider,
  isPastWeek,
  localTasks,
  isLoading,
}: KanbanBoardProps) {
  const getTasksForDay = useCallback(
    (dayIndex: number) => localTasks.filter(t => t.day_of_week === dayIndex),
    [localTasks]
  )

  if (isLoading) {
    return (
      <div className="flex gap-3 p-4 overflow-x-auto snap-x-scroll">
        {DAYS_OF_WEEK.map(day => (
          <div
            key={day.index}
            className="min-w-[200px] w-[200px] lg:flex-1 h-48 rounded-xl bg-[#111118] animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-3 p-4 overflow-x-auto snap-x-scroll flex-1">
      {DAYS_OF_WEEK.map(day => (
        <DayColumn
          key={day.index}
          dayIndex={day.index}
          dayLabel={day.label}
          weekKey={weekKey}
          tasks={getTasksForDay(day.index)}
          onAddTask={onAddTask}
          onAddDivider={onAddDivider}
          onTaskClick={onTaskClick}
          isWeekPast={isPastWeek}
        />
      ))}
    </div>
  )
}
