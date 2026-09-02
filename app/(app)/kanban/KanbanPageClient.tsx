'use client'

import { useState, useEffect } from 'react'
import { Plus, CalendarDays } from 'lucide-react'
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
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { WeekNavigator } from '@/components/kanban/WeekNavigator'
import { TaskCard } from '@/components/kanban/TaskCard'
import { TaskModal } from '@/components/tasks/TaskModal'
import { CustomKanbanBoard } from '@/components/custom-kanban/CustomKanbanBoard'
import { CustomCardItem } from '@/components/custom-kanban/CustomCard'
import { Header } from '@/components/layout/Header'
import { useCurrentWeek } from '@/hooks/useCurrentWeek'
import { useCreateTask, useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import {
  useCustomColumns, useCustomCards, useUpdateColumn, useUpdateCard,
  useCreateCard, useDeleteCard,
} from '@/hooks/useCustomKanban'
import { cn } from '@/lib/utils'
import { ASSIGNEE_COLORS } from '@/lib/constants'
import type { Profile, Task, CustomCard, CustomColumn, AssigneeName } from '@/lib/types'

type AssigneeFilter = 'all' | AssigneeName

type ActiveItem =
  | { type: 'task'; data: Task }
  | { type: 'card'; data: CustomCard }
  | { type: 'sortcol'; data: CustomColumn }

const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  if (hits.length > 0) return hits
  return closestCenter(args)
}

interface KanbanPageClientProps {
  profile: Profile
}

export function KanbanPageClient({ profile }: KanbanPageClientProps) {
  const { weekKey, goToPrev, goToNext, goToToday, isCurrentWeek, isPastWeek } = useCurrentWeek()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Custom kanban data & mutations
  const { data: columns = [] } = useCustomColumns()
  const { data: allCards = [] } = useCustomCards()
  const updateColumn = useUpdateColumn()
  const updateCard = useUpdateCard()
  const createCard = useCreateCard()
  const deleteCard = useDeleteCard()

  // Weekly tasks
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(weekKey)
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  useEffect(() => { setLocalTasks(tasks) }, [tasks])

  // Supabase realtime for tasks
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [defaultDay, setDefaultDay] = useState(1)

  // Filtro por responsável
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all')

  // Drag active item
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function openNew(dayOfWeek: number) {
    setSelectedTask(null)
    setDefaultDay(dayOfWeek)
    setModalOpen(true)
  }

  function openEdit(task: Task) {
    setSelectedTask(task)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedTask(null)
  }

  async function handleAddDivider(dayOfWeek: number) {
    try {
      await createTask.mutateAsync({
        title: '---',
        status: 'pending',
        assignee_name: profile.name,
        category: 'other',
        day_of_week: dayOfWeek,
        week_key: weekKey,
        checklist: [],
        links: [],
        created_by: profile.id,
      })
    } catch {
      // non-critical
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { id, data } = event.active
    const type = data.current?.type
    if (type === 'card') {
      const card = allCards.find(c => c.id === String(id))
      if (card) setActiveItem({ type: 'card', data: card })
    } else if (type === 'sortcol') {
      const col = columns.find(c => `sortcol-${c.id}` === String(id))
      if (col) setActiveItem({ type: 'sortcol', data: col })
    } else {
      const task = localTasks.find(t => t.id === String(id))
      if (task) setActiveItem({ type: 'task', data: task })
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const type = active.data.current?.type
    const overId = String(over.id)
    // Optimistic day update only for tasks (tasks have no type set)
    if (!type && overId.startsWith('day-')) {
      const newDay = parseInt(overId.replace('day-', ''))
      const activeId = String(active.id)
      setLocalTasks(prev =>
        prev.map(t => t.id === activeId && t.day_of_week !== newDay ? { ...t, day_of_week: newDay } : t)
      )
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveItem(null)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const type = active.data.current?.type

    // ── Column reorder ──────────────────────────────────────────────
    if (type === 'sortcol') {
      const activeIdx = columns.findIndex(c => `sortcol-${c.id}` === activeId)
      const overIdx = columns.findIndex(c => `sortcol-${c.id}` === overId)
      if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
        const reordered = arrayMove(columns, activeIdx, overIdx)
        await Promise.all(reordered.map((col, i) => {
          if (col.position !== i) return updateColumn.mutateAsync({ id: col.id, position: i })
        }))
      }
      return
    }

    // ── Custom card drag ────────────────────────────────────────────
    if (type === 'card') {
      const card = allCards.find(c => c.id === activeId)
      if (!card) return

      // Dropped on the weekly board (day column or task) → MOVE card into a task.
      // Cards criativos não são movidos para a semana (tarefas não têm criativos).
      const overTask = localTasks.find(t => t.id === overId)
      const targetDay = overId.startsWith('day-')
        ? parseInt(overId.replace('day-', ''))
        : overTask?.day_of_week

      if (targetDay !== undefined && card.card_type === 'creative') return

      if (targetDay !== undefined) {
        try {
          await createTask.mutateAsync({
            title: card.title,
            status: 'pending',
            assignee_name: card.assignee ?? profile.name,
            category: 'other',
            day_of_week: targetDay,
            week_key: weekKey,
            description: card.description,
            checklist: card.checklist ?? [],
            links: card.links ?? [],
            created_by: profile.id,
          })
          await deleteCard.mutateAsync(card.id)
          toast.success('Card movido para a semana.')
        } catch {
          toast.error('Erro ao mover card.')
        }
        return
      }

      // Dropped within the custom board → move card between columns
      let targetColumnId = card.column_id
      if (overId.startsWith('col-')) {
        targetColumnId = overId.replace('col-', '')
      } else if (overId.startsWith('sortcol-')) {
        targetColumnId = overId.replace('sortcol-', '')
      } else {
        const overCard = allCards.find(c => c.id === overId)
        if (overCard) targetColumnId = overCard.column_id
      }
      if (targetColumnId !== card.column_id) {
        await updateCard.mutateAsync({ id: card.id, column_id: targetColumnId })
      }
      return
    }

    // ── Task drag ───────────────────────────────────────────────────
    const task = localTasks.find(t => t.id === activeId)
    if (!task) return

    // Dropped on the custom board (column or card) → MOVE task into a card
    let targetColumnId: string | null = null
    if (overId.startsWith('col-')) {
      targetColumnId = overId.replace('col-', '')
    } else if (overId.startsWith('sortcol-')) {
      targetColumnId = overId.replace('sortcol-', '')
    } else {
      const overCard = allCards.find(c => c.id === overId)
      if (overCard) targetColumnId = overCard.column_id
    }
    if (targetColumnId) {
      const position = allCards.filter(c => c.column_id === targetColumnId).length
      try {
        await createCard.mutateAsync({
          column_id: targetColumnId,
          title: task.title,
          position,
          card_type: 'open',
          assignee: task.assignee_name,
          description: task.description,
          label_ids: [],
          links: task.links ?? [],
          checklist: task.checklist ?? [],
        })
        await deleteTask.mutateAsync({ id: task.id, weekKey })
        toast.success('Tarefa movida para o quadro livre.')
      } catch {
        toast.error('Erro ao mover tarefa.')
      }
      return
    }

    if (overId.startsWith('day-')) {
      const newDay = parseInt(overId.replace('day-', ''))
      if (task.day_of_week !== newDay) {
        await updateTask.mutateAsync({ id: task.id, day_of_week: newDay, week_key: weekKey })
      }
    } else {
      const overTask = localTasks.find(t => t.id === overId)
      if (overTask && task.day_of_week === overTask.day_of_week) {
        const dayTasks = localTasks.filter(t => t.day_of_week === task.day_of_week)
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

  const visibleTasks = assigneeFilter === 'all'
    ? localTasks
    : localTasks.filter(t => t.assignee_name === assigneeFilter)

  return (
    <>
      <Header title="Kanban">
        {/* Filtro de responsável */}
        <div className="flex items-center rounded-lg border border-[#22222E] overflow-hidden">
          {(['all', 'Matheus', 'Kauan'] as AssigneeFilter[]).map(opt => {
            const isAll = opt === 'all'
            const color = isAll ? null : ASSIGNEE_COLORS[opt]
            const active = assigneeFilter === opt
            return (
              <button
                key={opt}
                onClick={() => setAssigneeFilter(opt)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-600 transition-all',
                  active
                    ? 'text-white'
                    : 'text-[#5A5A70] hover:text-[#F0F0F8] hover:bg-[#1A1A24]'
                )}
                style={active && color ? { backgroundColor: color } : active ? { backgroundColor: '#22222E' } : {}}
              >
                {!isAll && (
                  <span
                    className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-700 text-white shrink-0"
                    style={{ backgroundColor: color! }}
                  >
                    {(opt as string)[0]}
                  </span>
                )}
                {isAll ? 'Todos' : opt}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => openNew(1)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors active:scale-[0.98]"
        >
          <Plus size={14} />
          Nova tarefa
        </button>
      </Header>

      <div className="flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* ── Quadro livre ────────────────────────────────────────── */}
          <CustomKanbanBoard />

          {/* ── Divider ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 h-px bg-[#22222E]" />
            <div className="flex items-center gap-2">
              <CalendarDays size={13} className="text-[#5A5A70]" />
              <span className="text-[10px] font-700 text-[#5A5A70] uppercase tracking-wider">Semana</span>
            </div>
            <div className="flex-1 h-px bg-[#22222E]" />
            <WeekNavigator
              weekKey={weekKey}
              onPrev={goToPrev}
              onNext={goToNext}
              onToday={goToToday}
              isCurrentWeek={isCurrentWeek}
              isPastWeek={isPastWeek}
            />
          </div>

          {/* ── Quadro semanal ──────────────────────────────────────── */}
          <div className="flex flex-col" style={{ minHeight: '480px' }}>
            <KanbanBoard
              weekKey={weekKey}
              onTaskClick={openEdit}
              onAddTask={openNew}
              onAddDivider={handleAddDivider}
              isPastWeek={isPastWeek}
              localTasks={visibleTasks}
              isLoading={tasksLoading}
            />
          </div>

          <DragOverlay>
            {activeItem?.type === 'task' && (
              <div className="rotate-2 opacity-90">
                <TaskCard task={activeItem.data} onClick={() => {}} />
              </div>
            )}
            {activeItem?.type === 'card' && (
              <div className="rotate-2 opacity-90 w-[220px]">
                <CustomCardItem card={activeItem.data} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={closeModal}
        task={selectedTask}
        defaultDayOfWeek={defaultDay}
        defaultWeekKey={weekKey}
        currentUserId={profile.id}
        currentUserName={profile.name}
      />
    </>
  )
}
