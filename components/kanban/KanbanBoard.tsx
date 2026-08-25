'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  DragOverlay,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { DAYS_OF_WEEK } from '@/lib/weeks'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'
import { DayColumn } from './DayColumn'
import { TaskCard } from './TaskCard'
import type { Task } from '@/lib/types'

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args)
  if (pointerHits.length > 0) return pointerHits
  return closestCenter(args)
}

interface KanbanBoardProps {
  weekKey: string
  onTaskClick: (task: Task) => void
  onAddTask: (dayOfWeek: number) => void
  onAddDivider?: (dayOfWeek: number) => void
  isPastWeek: boolean
}

export function KanbanBoard({ weekKey, onTaskClick, onAddTask, onAddDivider, isPastWeek }: KanbanBoardProps) {
  const { data: tasks = [], isLoading } = useTasks(weekKey)
  const updateTask = useUpdateTask()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[]>([])

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  useEffect(() => {
    const channel = supabase
      .channel(`tasks-${weekKey}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `week_key=eq.${weekKey}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', weekKey] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [weekKey, supabase, queryClient])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const getTasksForDay = useCallback(
    (dayIndex: number) => localTasks.filter(t => t.day_of_week === dayIndex),
    [localTasks]
  )

  function handleDragStart(event: DragStartEvent) {
    const task = localTasks.find(t => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (overId.startsWith('day-')) {
      const newDay = parseInt(overId.replace('day-', ''))
      const task = localTasks.find(t => t.id === activeId)
      if (task && task.day_of_week !== newDay) {
        setLocalTasks(prev =>
          prev.map(t => t.id === activeId ? { ...t, day_of_week: newDay } : t)
        )
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const task = localTasks.find(t => t.id === activeId)
    if (!task) return

    if (overId.startsWith('day-')) {
      const newDay = parseInt(overId.replace('day-', ''))
      if (task.day_of_week !== newDay) {
        await updateTask.mutateAsync({ id: task.id, day_of_week: newDay, week_key: weekKey })
      }
    } else {
      const overTask = localTasks.find(t => t.id === overId)
      if (overTask && task.day_of_week === overTask.day_of_week) {
        const dayTasks = getTasksForDay(task.day_of_week)
        const oldIdx = dayTasks.findIndex(t => t.id === activeId)
        const newIdx = dayTasks.findIndex(t => t.id === overId)
        if (oldIdx !== newIdx) {
          const reordered = arrayMove(dayTasks, oldIdx, newIdx)
          setLocalTasks(prev => {
            const others = prev.filter(t => t.day_of_week !== task.day_of_week)
            return [...others, ...reordered]
          })
        }
      } else if (overTask && task.day_of_week !== overTask.day_of_week) {
        await updateTask.mutateAsync({ id: task.id, day_of_week: overTask.day_of_week, week_key: weekKey })
      }
    }
  }

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
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-90">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
