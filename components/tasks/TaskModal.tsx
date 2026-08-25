'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Save, ExternalLink, Calendar, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { TASK_CATEGORIES, ASSIGNEE_COLORS, DEFAULT_TASK_STATUSES } from '@/lib/constants'
import { DAYS_OF_WEEK, getWeekKey, navigateWeek } from '@/lib/weeks'
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { useOffers } from '@/hooks/useOffers'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { ChecklistEditor } from './ChecklistEditor'
import { LinksList } from './LinksList'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AssigneeBadge } from '@/components/shared/AssigneeBadge'
import { CalendarPicker } from '@/components/ui/CalendarPicker'
import type { Task, TaskStatus, AssigneeName, TaskCategory, ChecklistItem, TaskLink } from '@/lib/types'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultDayOfWeek?: number
  defaultWeekKey?: string
  currentUserId: string
  currentUserName: AssigneeName
}

const ASSIGNEES: AssigneeName[] = ['Matheus', 'Kauan']

const NEXT_4_WEEKS = Array.from({ length: 4 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + (i + 1) * 7)
  return getWeekKey(d)
})

export function TaskModal({
  open,
  onClose,
  task,
  defaultDayOfWeek = 1,
  defaultWeekKey,
  currentUserId,
  currentUserName,
}: TaskModalProps) {
  const isEditing = !!task

  const { data: offers = [] } = useOffers()
  const { data: statuses = DEFAULT_TASK_STATUSES } = useTaskStatuses()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [assignee, setAssignee] = useState<AssigneeName>(currentUserName)
  const [descMode, setDescMode] = useState<'description' | 'link'>('description')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [links, setLinks] = useState<TaskLink[]>([])
  const [offerId, setOfferId] = useState<string>('')
  const [category, setCategory] = useState<TaskCategory>('other')
  const [dayOfWeek, setDayOfWeek] = useState(defaultDayOfWeek)
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [moveToWeek, setMoveToWeek] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setStatus(task.status)
      setAssignee(task.assignee_name)
      setDescription(task.description ?? '')
      setLinkUrl(task.link_url ?? '')
      setDescMode(task.link_url ? 'link' : 'description')
      setChecklist(task.checklist)
      setLinks(task.links)
      setOfferId(task.offer_id ?? '')
      setCategory(task.category)
      setDayOfWeek(task.day_of_week)
      setDueDate(task.due_date ?? '')
      setDueTime(task.due_time ?? '')
      setMoveToWeek('')
      setConfirmDelete(false)
      setIsUrgent(task.is_urgent ?? false)
    } else {
      setTitle('')
      setStatus('pending')
      setAssignee(currentUserName)
      setDescription('')
      setLinkUrl('')
      setDescMode('description')
      setChecklist([])
      setLinks([])
      setOfferId('')
      setCategory('other')
      setDayOfWeek(defaultDayOfWeek)
      setDueDate('')
      setDueTime('')
      setMoveToWeek('')
      setConfirmDelete(false)
      setIsUrgent(false)
    }
    setCalendarOpen(false)
  }, [task, open, defaultDayOfWeek, currentUserName])

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false)
      }
    }
    if (calendarOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [calendarOpen])

  async function handleSave() {
    if (!title.trim()) {
      toast.error('O título é obrigatório.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        status,
        assignee_name: assignee,
        description: descMode === 'description' ? description : undefined,
        link_url: descMode === 'link' ? linkUrl : undefined,
        checklist,
        links,
        offer_id: offerId || undefined,
        category,
        day_of_week: dayOfWeek,
        is_urgent: isUrgent,
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        week_key: moveToWeek || task?.week_key || defaultWeekKey || getWeekKey(),
        ...(moveToWeek && {
          is_delayed: true,
          original_week_key: task?.original_week_key ?? task?.week_key,
          original_day_of_week: task?.original_day_of_week ?? task?.day_of_week,
        }),
      }

      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task.id, ...payload })
        toast.success('Tarefa atualizada!')
      } else {
        await createTask.mutateAsync({ ...payload, created_by: currentUserId })
        toast.success('Tarefa criada!')
      }

      onClose()
    } catch {
      toast.error('Erro ao salvar tarefa.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await deleteTask.mutateAsync({ id: task.id, weekKey: task.week_key })
      toast.success('Tarefa excluída.')
      onClose()
    } catch {
      toast.error('Erro ao excluir tarefa.')
    }
  }

  const formattedDueDate = dueDate
    ? format(parseISO(dueDate), "d 'de' MMM", { locale: ptBR })
    : null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'relative w-full max-w-3xl max-h-[90vh] overflow-hidden',
              'bg-[#111118] rounded-2xl shadow-[0_0_0_1px_#22222E,0_20px_60px_rgba(0,0,0,0.5)]',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="flex items-start gap-3 p-5 border-b border-[#22222E]">
              <div className="flex-1">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Título da tarefa..."
                  className={cn(
                    'w-full text-lg font-700 text-[#F0F0F8] bg-transparent',
                    'focus:outline-none placeholder:text-[#5A5A70]'
                  )}
                  autoFocus
                />
                {/* Status pills — dynamic */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {statuses.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStatus(s.id)}
                      className={cn(
                        'transition-all duration-150',
                        status === s.id ? 'scale-105' : 'opacity-50 hover:opacity-80'
                      )}
                    >
                      <StatusBadge status={s.id} />
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[#5A5A70] hover:text-[#F0F0F8] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Main column */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 border-r border-[#22222E]">
                {/* Description / Link toggle */}
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {(['description', 'link'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setDescMode(mode)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-600 transition-colors',
                          descMode === mode
                            ? 'bg-[#7C3AED1A] text-[#8B5CF6]'
                            : 'text-[#5A5A70] hover:text-[#F0F0F8]'
                        )}
                      >
                        {mode === 'description' ? 'Descrição' : 'Link'}
                      </button>
                    ))}
                  </div>
                  {descMode === 'description' ? (
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Descreva a tarefa..."
                      rows={3}
                      className={cn(
                        'w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3',
                        'text-sm text-[#F0F0F8] placeholder:text-[#5A5A70]',
                        'focus:outline-none focus:border-[#7C3AED] resize-none'
                      )}
                    />
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className={cn(
                          'w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3',
                          'text-sm text-[#F0F0F8] placeholder:text-[#5A5A70]',
                          'focus:outline-none focus:border-[#7C3AED]'
                        )}
                      />
                      {linkUrl && (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-2 text-xs text-[#8B5CF6] hover:underline"
                        >
                          <ExternalLink size={12} />
                          {linkUrl}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div>
                  <h4 className="text-xs font-700 text-[#9090A8] uppercase tracking-wider mb-3">Checklist</h4>
                  <ChecklistEditor items={checklist} onChange={setChecklist} />
                </div>

                {/* Links relacionados */}
                <div>
                  <h4 className="text-xs font-700 text-[#9090A8] uppercase tracking-wider mb-3">Links relacionados</h4>
                  <LinksList links={links} onChange={setLinks} />
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-56 overflow-y-auto p-5 space-y-5 shrink-0">
                {/* Responsável */}
                <div>
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Responsável</label>
                  <div className="flex gap-2">
                    {ASSIGNEES.map(name => (
                      <button
                        key={name}
                        onClick={() => setAssignee(name)}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-600 border transition-all',
                          assignee === name
                            ? 'border-[#7C3AED] bg-[#7C3AED1A] text-[#F0F0F8]'
                            : 'border-[#22222E] text-[#9090A8] hover:border-[#7C3AED40]'
                        )}
                      >
                        <AssigneeBadge name={name} size="sm" />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Urgência */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsUrgent(prev => !prev)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border font-600 text-xs transition-all duration-200',
                      isUrgent
                        ? 'border-[#EF4444] bg-[#EF44441A] text-[#EF4444] shadow-[0_0_12px_#EF444430]'
                        : 'border-[#22222E] text-[#5A5A70] hover:border-[#EF444440] hover:text-[#EF4444]'
                    )}
                  >
                    <Zap
                      size={14}
                      className={cn('shrink-0 transition-all', isUrgent && 'fill-[#EF4444]')}
                    />
                    {isUrgent ? 'Urgente' : 'Marcar como urgente'}
                  </button>
                </div>

                {/* Oferta */}
                <div>
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Oferta vinculada</label>
                  <select
                    value={offerId}
                    onChange={e => setOfferId(e.target.value)}
                    className={cn(
                      'w-full bg-[#0A0A0F] border border-[#22222E] rounded-lg px-3 py-2',
                      'text-xs text-[#F0F0F8] focus:outline-none focus:border-[#7C3AED]'
                    )}
                  >
                    <option value="">Nenhuma — avulsa</option>
                    {offers.filter(o => o.status === 'active' || o.status === 'development').map(o => (
                      <option key={o.id} value={o.id}>{o.emoji} {o.name}</option>
                    ))}
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as TaskCategory)}
                    className={cn(
                      'w-full bg-[#0A0A0F] border border-[#22222E] rounded-lg px-3 py-2',
                      'text-xs text-[#F0F0F8] focus:outline-none focus:border-[#7C3AED]'
                    )}
                  >
                    {TASK_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dia da semana */}
                <div>
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Dia da semana</label>
                  <div className="flex flex-wrap gap-1">
                    {DAYS_OF_WEEK.map(d => (
                      <button
                        key={d.index}
                        onClick={() => setDayOfWeek(d.index)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[10px] font-600 border transition-all',
                          dayOfWeek === d.index
                            ? 'border-[#7C3AED] bg-[#7C3AED1A] text-[#8B5CF6]'
                            : 'border-[#22222E] text-[#5A5A70] hover:border-[#7C3AED40]'
                        )}
                      >
                        {d.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prazo — com CalendarPicker */}
                <div>
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Prazo</label>
                  <div className="space-y-1.5">
                    {/* Date picker */}
                    <div ref={calendarRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setCalendarOpen(prev => !prev)}
                        className={cn(
                          'w-full bg-[#0A0A0F] border border-[#22222E] rounded-lg px-3 py-2',
                          'text-xs text-left flex items-center justify-between transition-colors',
                          calendarOpen ? 'border-[#7C3AED]' : 'hover:border-[#7C3AED40]',
                          formattedDueDate ? 'text-[#F0F0F8]' : 'text-[#5A5A70]'
                        )}
                      >
                        {formattedDueDate ?? 'Selecionar data...'}
                        <Calendar size={12} className="text-[#5A5A70] shrink-0" />
                      </button>
                      {calendarOpen && (
                        <div className="absolute top-full left-0 mt-1 z-50">
                          <CalendarPicker
                            value={dueDate}
                            onChange={(date) => {
                              setDueDate(date)
                              setCalendarOpen(false)
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {/* Time picker */}
                    <input
                      type="time"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                      className={cn(
                        'w-full bg-[#0A0A0F] border border-[#22222E] rounded-lg px-3 py-2',
                        'text-xs text-[#F0F0F8] focus:outline-none focus:border-[#7C3AED]'
                      )}
                    />
                  </div>
                </div>

                {/* Mover para semana */}
                {isEditing && (
                  <div>
                    <label className="block text-xs font-600 text-[#9090A8] mb-2">Mover para semana</label>
                    <select
                      value={moveToWeek}
                      onChange={e => setMoveToWeek(e.target.value)}
                      className={cn(
                        'w-full bg-[#0A0A0F] border border-[#22222E] rounded-lg px-3 py-2',
                        'text-xs text-[#F0F0F8] focus:outline-none focus:border-[#7C3AED]'
                      )}
                    >
                      <option value="">Manter semana atual</option>
                      {NEXT_4_WEEKS.map(wk => (
                        <option key={wk} value={wk}>{wk}</option>
                      ))}
                    </select>
                    {moveToWeek && (
                      <p className="text-[10px] text-[#F59E0B] mt-1">⚠️ Será marcada como atrasada</p>
                    )}
                  </div>
                )}

                {/* Metadados */}
                {isEditing && task && (
                  <div className="pt-3 border-t border-[#22222E] space-y-1">
                    <p className="text-[10px] text-[#5A5A70]">
                      Criada em {format(new Date(task.created_at), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-[10px] text-[#5A5A70]">
                      Atualizada em {format(new Date(task.updated_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[#22222E]">
              {isEditing ? (
                <button
                  onClick={handleDelete}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 transition-all',
                    confirmDelete
                      ? 'bg-[#EF4444] text-white'
                      : 'text-[#EF4444] hover:bg-[#EF444420]'
                  )}
                >
                  <Trash2 size={14} />
                  {confirmDelete ? 'Confirmar exclusão' : 'Excluir tarefa'}
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-600 text-[#9090A8] hover:text-[#F0F0F8] hover:bg-[#1A1A24] transition-colors border border-[#22222E]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-600',
                    'bg-[#7C3AED] hover:bg-[#8B5CF6] text-white',
                    'transition-all duration-150 active:scale-[0.98]',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <Save size={14} />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
