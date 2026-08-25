'use client'

import { useState, useEffect } from 'react'
import { Bell, RefreshCw, Save, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DEFAULT_TASK_STATUSES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useTaskStatuses, useSaveTaskStatuses } from '@/hooks/useTaskStatuses'
import type { Profile, RecurringTemplate, TaskStatusConfig } from '@/lib/types'

const COLORS = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']
const DEFAULT_IDS = DEFAULT_TASK_STATUSES.map(s => s.id)

interface SettingsPageClientProps {
  profile: Profile
}

export function SettingsPageClient({ profile }: SettingsPageClientProps) {
  const supabase = createClient()
  const { requestPermission } = usePushNotifications()
  const { data: fetchedStatuses = DEFAULT_TASK_STATUSES } = useTaskStatuses()
  const saveStatuses = useSaveTaskStatuses()

  const [avatarColor, setAvatarColor] = useState(profile.avatar_color)
  const [displayName, setDisplayName] = useState<string>(profile.name)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [templates, setTemplates] = useState<(RecurringTemplate & { offer_name?: string; offer_emoji?: string })[]>([])

  // Local editable copy of statuses
  const [editStatuses, setEditStatuses] = useState<TaskStatusConfig[]>(fetchedStatuses)

  useEffect(() => {
    setEditStatuses(fetchedStatuses)
  }, [fetchedStatuses])

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const { data } = await supabase
      .from('recurring_templates')
      .select('*, offer:offers(id, name, emoji, status)')
      .eq('is_active', true)
    setTemplates((data as any[])?.map(t => ({
      ...t,
      offer_name: t.offer?.name,
      offer_emoji: t.offer?.emoji,
    })) ?? [])
  }

  async function saveProfile() {
    if (!displayName.trim()) { toast.error('Nome obrigatório.'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_color: avatarColor, name: displayName.trim() as 'Matheus' | 'Kauan' })
        .eq('id', profile.id)
      if (error) throw error
      toast.success('Perfil atualizado!')
    } catch {
      toast.error('Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  async function generateWeek() {
    setGenerating(true)
    try {
      const res = await fetch('/api/cron/weekly-tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` },
      })
      const data = await res.json()
      if (data.message?.includes('already')) {
        toast.info('Semana já foi gerada anteriormente.')
      } else if (data.success) {
        toast.success(`Semana gerada! ${data.tasks_created} tarefas criadas.`)
      } else {
        toast.error(data.error ?? 'Erro ao gerar semana.')
      }
    } catch {
      toast.error('Erro ao gerar semana.')
    } finally {
      setGenerating(false)
    }
  }

  function updateStatusLabel(id: string, label: string) {
    setEditStatuses(prev => prev.map(s => s.id === id ? { ...s, label } : s))
  }

  function updateStatusColor(id: string, color: string) {
    setEditStatuses(prev => prev.map(s => s.id === id ? { ...s, color } : s))
  }

  function addStatus() {
    const id = `custom_${Date.now()}`
    setEditStatuses(prev => [...prev, { id, label: 'Novo status', color: '#6B7280' }])
  }

  function removeStatus(id: string) {
    if (DEFAULT_IDS.includes(id)) return
    setEditStatuses(prev => prev.filter(s => s.id !== id))
  }

  async function handleSaveStatuses() {
    try {
      await saveStatuses.mutateAsync(editStatuses)
      toast.success('Status atualizados!')
    } catch {
      toast.error('Erro ao salvar status.')
    }
  }

  const inputClass = cn(
    'w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl px-3 py-2.5',
    'text-sm text-[#F0F0F8]',
    'focus:outline-none'
  )

  return (
    <>
      <Header title="Ajustes" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl space-y-8">

          {/* Perfil */}
          <section>
            <h2 className="text-sm font-700 text-[#F0F0F8] mb-4">Perfil</h2>
            <div className="p-5 bg-[#111118] rounded-xl border border-[#22222E] space-y-4">
              <div className="flex items-center gap-4">
                <UserAvatar name={displayName || profile.name} color={avatarColor} size="lg" />
                <div>
                  <p className="text-sm font-700 text-[#F0F0F8]">{displayName || profile.name}</p>
                  <p className="text-xs text-[#5A5A70]">{profile.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Nome</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Seu nome..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Cor do avatar</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all',
                        avatarColor === c && 'ring-2 ring-offset-2 ring-offset-[#111118] ring-white'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </section>

          {/* Status das demandas */}
          <section>
            <h2 className="text-sm font-700 text-[#F0F0F8] mb-4">Status das demandas</h2>
            <div className="bg-[#111118] rounded-xl border border-[#22222E] overflow-hidden">
              <div className="divide-y divide-[#22222E]">
                {editStatuses.map(s => {
                  const isDefault = DEFAULT_IDS.includes(s.id)
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Color picker */}
                      <label className="relative w-6 h-6 rounded-full cursor-pointer shrink-0 ring-2 ring-offset-2 ring-offset-[#111118] ring-transparent hover:ring-[#7C3AED] transition-all">
                        <span className="block w-6 h-6 rounded-full" style={{ backgroundColor: s.color }} />
                        <input
                          type="color"
                          value={s.color}
                          onChange={e => updateStatusColor(s.id, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>

                      {/* Label input */}
                      <input
                        type="text"
                        value={s.label}
                        onChange={e => updateStatusLabel(s.id, e.target.value)}
                        className="flex-1 bg-transparent text-sm text-[#F0F0F8] focus:outline-none"
                      />

                      {/* Preview */}
                      <StatusBadge status={s.id} />

                      {/* Delete (only custom) */}
                      {!isDefault ? (
                        <button
                          onClick={() => removeStatus(s.id)}
                          className="text-[#5A5A70] hover:text-[#EF4444] transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <div className="w-[14px]" />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between gap-2 p-4 border-t border-[#22222E]">
                <button
                  onClick={addStatus}
                  className="flex items-center gap-1.5 text-xs text-[#5A5A70] hover:text-[#8B5CF6] transition-colors"
                >
                  <Plus size={14} />
                  Adicionar status
                </button>
                <button
                  onClick={handleSaveStatuses}
                  disabled={saveStatuses.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Save size={12} />
                  {saveStatuses.isPending ? 'Salvando...' : 'Salvar status'}
                </button>
              </div>
            </div>
          </section>

          {/* Notificações */}
          <section>
            <h2 className="text-sm font-700 text-[#F0F0F8] mb-4">Notificações</h2>
            <div className="p-5 bg-[#111118] rounded-xl border border-[#22222E]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED1A] flex items-center justify-center">
                  <Bell size={18} className="text-[#8B5CF6]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-600 text-[#F0F0F8]">Notificações push</p>
                  <p className="text-xs text-[#5A5A70]">Receba alertas de tarefas e prazos no celular</p>
                </div>
                <button
                  onClick={requestPermission}
                  className="px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
                >
                  Ativar
                </button>
              </div>
            </div>
          </section>

          {/* Templates */}
          <section>
            <h2 className="text-sm font-700 text-[#F0F0F8] mb-4">Templates recorrentes ativos</h2>
            <div className="bg-[#111118] rounded-xl border border-[#22222E] divide-y divide-[#22222E]">
              {templates.length === 0 ? (
                <p className="p-5 text-sm text-[#5A5A70]">Nenhum template ativo. Configure nas ofertas.</p>
              ) : templates.map(tmpl => (
                <Link
                  key={tmpl.id}
                  href={`/offers/${tmpl.offer_id}`}
                  className="flex items-center gap-3 p-4 hover:bg-[#1A1A24] transition-colors"
                >
                  <span className="text-lg">{tmpl.offer_emoji ?? '🎯'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-600 text-[#F0F0F8] truncate">{tmpl.title}</p>
                    <p className="text-xs text-[#5A5A70]">{tmpl.offer_name}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#5A5A70]" />
                </Link>
              ))}
            </div>
          </section>

          {/* Ações da semana */}
          <section>
            <h2 className="text-sm font-700 text-[#F0F0F8] mb-4">Ações da semana</h2>
            <div className="p-5 bg-[#111118] rounded-xl border border-[#22222E]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0EA5E920] flex items-center justify-center">
                  <RefreshCw size={18} className="text-[#0EA5E9]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-600 text-[#F0F0F8]">Gerar semana manualmente</p>
                  <p className="text-xs text-[#5A5A70]">Cria tarefas dos templates ativos para a semana atual</p>
                </div>
                <button
                  onClick={generateWeek}
                  disabled={generating}
                  className="px-3 py-2 rounded-lg text-xs font-600 bg-[#1A1A24] hover:bg-[#22222E] text-[#F0F0F8] border border-[#22222E] transition-colors disabled:opacity-50"
                >
                  {generating ? 'Gerando...' : 'Gerar'}
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
