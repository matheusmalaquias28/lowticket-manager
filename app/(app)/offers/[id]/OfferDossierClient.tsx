'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit2, Globe, ShoppingCart, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OFFER_STATUSES, TASK_CATEGORIES, ASSIGNEE_COLORS } from '@/lib/constants'
import { getWeekKey } from '@/lib/weeks'
import { createClient } from '@/lib/supabase/client'
import { useUpdateOffer } from '@/hooks/useOffers'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AssigneeBadge } from '@/components/shared/AssigneeBadge'
import { OfferModal } from '@/components/offers/OfferModal'
import { RecurringTemplateEditor } from '@/components/offers/RecurringTemplateEditor'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Offer, Task, RecurringTemplate, Profile } from '@/lib/types'

interface OfferDossierClientProps {
  offer: Offer
  profile: Profile
}

type Tab = 'overview' | 'history' | 'templates'

export function OfferDossierClient({ offer, profile }: OfferDossierClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [templateEditor, setTemplateEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null)

  const statusConfig = OFFER_STATUSES.find(s => s.value === offer.status)

  useEffect(() => {
    loadTasks()
    loadTemplates()
  }, [offer.id])

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('offer_id', offer.id)
      .order('week_key', { ascending: false })
    setTasks((data as Task[]) ?? [])
  }

  async function loadTemplates() {
    const { data } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('offer_id', offer.id)
      .order('day_of_week')
    setTemplates((data as RecurringTemplate[]) ?? [])
  }

  // Group tasks by week
  const tasksByWeek = tasks.reduce((acc, task) => {
    if (!acc[task.week_key]) acc[task.week_key] = []
    acc[task.week_key].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  const sortedWeeks = Object.keys(tasksByWeek).sort((a, b) => b.localeCompare(a))

  const TABS: { value: Tab; label: string }[] = [
    { value: 'overview', label: 'Visão geral' },
    { value: 'history', label: 'Histórico de tarefas' },
    { value: 'templates', label: 'Templates recorrentes' },
  ]

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-[#22222E]">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-[#9090A8] hover:text-[#F0F0F8] hover:bg-[#1A1A24] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${offer.color}20` }}
          >
            {offer.emoji}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-700 text-[#F0F0F8]">{offer.name}</h1>
            {offer.niche && <p className="text-sm text-[#5A5A70]">{offer.niche}</p>}
          </div>
          {statusConfig && (
            <span
              className="px-3 py-1.5 rounded-full text-xs font-600"
              style={{ color: statusConfig.color, backgroundColor: `${statusConfig.color}20` }}
            >
              {statusConfig.label}
            </span>
          )}
          <button
            onClick={() => setEditModalOpen(true)}
            className="p-2 rounded-lg text-[#9090A8] hover:text-[#F0F0F8] hover:bg-[#1A1A24] border border-[#22222E] transition-colors"
          >
            <Edit2 size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-[#22222E]">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-2 text-sm font-600 transition-colors border-b-2 -mb-px',
                activeTab === tab.value
                  ? 'text-[#8B5CF6] border-[#7C3AED]'
                  : 'text-[#9090A8] border-transparent hover:text-[#F0F0F8]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="max-w-2xl space-y-5">
              {[
                { label: 'URL da LP', value: offer.lp_url, href: offer.lp_url, icon: <Globe size={14} /> },
                { label: 'URL do Checkout', value: offer.checkout_url, href: offer.checkout_url, icon: <ShoppingCart size={14} /> },
                { label: 'Pixel ID', value: offer.pixel_id },
                { label: 'Orçamento semanal', value: offer.weekly_budget ? `R$ ${offer.weekly_budget.toFixed(2)}` : undefined },
              ].map(item => item.value && (
                <div key={item.label} className="p-4 bg-[#111118] rounded-xl border border-[#22222E]">
                  <p className="text-xs font-600 text-[#5A5A70] mb-1">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-[#8B5CF6] hover:underline"
                    >
                      {item.icon}
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-[#F0F0F8]">{item.value}</p>
                  )}
                </div>
              ))}
              {offer.notes && (
                <div className="p-4 bg-[#111118] rounded-xl border border-[#22222E]">
                  <p className="text-xs font-600 text-[#5A5A70] mb-1">Notas</p>
                  <p className="text-sm text-[#F0F0F8] whitespace-pre-wrap">{offer.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {sortedWeeks.length === 0 ? (
                <EmptyState icon="📋" title="Sem histórico de tarefas" description="Tarefas vinculadas a esta oferta aparecerão aqui." />
              ) : sortedWeeks.map(weekKey => {
                const weekTasks = tasksByWeek[weekKey]
                const done = weekTasks.filter(t => t.status === 'done').length
                return (
                  <div key={weekKey}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-700 text-[#F0F0F8]">Semana {weekKey}</h3>
                      <span className="text-xs text-[#5A5A70]">{done}/{weekTasks.length} concluídas</span>
                    </div>
                    <div className="space-y-2">
                      {weekTasks.map(task => {
                        const catConfig = TASK_CATEGORIES.find(c => c.value === task.category)
                        return (
                          <div key={task.id} className="flex items-center gap-3 p-3 bg-[#111118] rounded-xl border border-[#22222E]">
                            <StatusBadge status={task.status} />
                            <AssigneeBadge name={task.assignee_name} size="sm" />
                            <span className="text-sm text-[#F0F0F8] flex-1 truncate">{task.title}</span>
                            {catConfig && <span className="text-xs">{catConfig.icon}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Templates tab */}
          {activeTab === 'templates' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#9090A8]">{templates.length} template(s) configurado(s)</p>
                <button
                  onClick={() => { setEditingTemplate(null); setTemplateEditor(true) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
                >
                  <Plus size={14} />
                  Novo template
                </button>
              </div>

              {templates.length === 0 ? (
                <EmptyState icon="🔁" title="Sem templates" description="Templates criam tarefas automaticamente toda semana." />
              ) : (
                <div className="space-y-3">
                  {templates.map(tmpl => {
                    const day = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' }[tmpl.day_of_week]
                    const cat = TASK_CATEGORIES.find(c => c.value === tmpl.category)
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => { setEditingTemplate(tmpl); setTemplateEditor(true) }}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border cursor-pointer',
                          'bg-[#111118] border-[#22222E] hover:border-[#7C3AED40] hover:bg-[#1A1A24] transition-all',
                          !tmpl.is_active && 'opacity-50'
                        )}
                      >
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <span className="text-xs font-700 text-[#8B5CF6]">{day}</span>
                          {tmpl.due_time && <span className="text-[10px] text-[#5A5A70]">{tmpl.due_time}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-600 text-[#F0F0F8] truncate">{tmpl.title}</p>
                          {cat && <p className="text-xs text-[#5A5A70]">{cat.icon} {cat.label}</p>}
                        </div>
                        <div
                          className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-700 text-white"
                          style={{ backgroundColor: ASSIGNEE_COLORS[tmpl.assignee_name] }}
                        >
                          {tmpl.assignee_name[0]}
                        </div>
                        {!tmpl.is_active && (
                          <span className="text-[10px] text-[#5A5A70] bg-[#1A1A24] px-2 py-0.5 rounded-full">Inativo</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <OfferModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        offer={offer}
        currentUserId={profile.id}
      />

      <RecurringTemplateEditor
        open={templateEditor}
        onClose={() => setTemplateEditor(false)}
        offerId={offer.id}
        template={editingTemplate}
        onSaved={loadTemplates}
      />
    </>
  )
}
