'use client'

import { useState, useEffect } from 'react'
import { Bell, RefreshCw, Save, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ASSIGNEE_COLORS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import type { Profile, RecurringTemplate } from '@/lib/types'

const COLORS = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

interface SettingsPageClientProps {
  profile: Profile
}

export function SettingsPageClient({ profile }: SettingsPageClientProps) {
  const supabase = createClient()
  const { requestPermission } = usePushNotifications()
  const [avatarColor, setAvatarColor] = useState(profile.avatar_color)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [templates, setTemplates] = useState<(RecurringTemplate & { offer_name?: string; offer_emoji?: string })[]>([])

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
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_color: avatarColor })
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
                <UserAvatar name={profile.name} color={avatarColor} size="lg" />
                <div>
                  <p className="text-sm font-700 text-[#F0F0F8]">{profile.name}</p>
                  <p className="text-xs text-[#5A5A70]">{profile.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Nome</label>
                <input value={profile.name} readOnly className={cn(inputClass, 'opacity-50 cursor-not-allowed')} />
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
