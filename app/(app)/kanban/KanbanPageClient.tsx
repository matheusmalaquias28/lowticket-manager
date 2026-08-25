'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { WeekNavigator } from '@/components/kanban/WeekNavigator'
import { TaskModal } from '@/components/tasks/TaskModal'
import { Header } from '@/components/layout/Header'
import { useCurrentWeek } from '@/hooks/useCurrentWeek'
import { useCreateTask } from '@/hooks/useTasks'
import type { Profile, Task } from '@/lib/types'

interface KanbanPageClientProps {
  profile: Profile
}

export function KanbanPageClient({ profile }: KanbanPageClientProps) {
  const { weekKey, goToPrev, goToNext, goToToday, isCurrentWeek, isPastWeek } = useCurrentWeek()
  const createTask = useCreateTask()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [defaultDay, setDefaultDay] = useState(1)

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
      // ignore — divider creation failure is non-critical
    }
  }

  return (
    <>
      <Header title="Kanban semanal">
        <WeekNavigator
          weekKey={weekKey}
          onPrev={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
          isCurrentWeek={isCurrentWeek}
          isPastWeek={isPastWeek}
        />
        <button
          onClick={() => openNew(1)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors active:scale-[0.98]"
        >
          <Plus size={14} />
          Nova tarefa
        </button>
      </Header>

      <div className="flex-1 overflow-hidden flex flex-col">
        <KanbanBoard
          weekKey={weekKey}
          onTaskClick={openEdit}
          onAddTask={openNew}
          onAddDivider={handleAddDivider}
          isPastWeek={isPastWeek}
        />
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
