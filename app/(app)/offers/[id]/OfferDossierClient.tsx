'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit2, Globe, ShoppingCart, Plus, ExternalLink, Trash2, Pencil, Check, X as XIcon, ImagePlus, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OFFER_STATUSES, TASK_CATEGORIES, ASSIGNEE_COLORS } from '@/lib/constants'
import { getWeekKey } from '@/lib/weeks'
import { createClient } from '@/lib/supabase/client'
import { useUpdateOffer, useDeleteOffer } from '@/hooks/useOffers'
import { useCreatives, useCreateCreative, useUpdateCreative, useDeleteCreative } from '@/hooks/useCreatives'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AssigneeBadge } from '@/components/shared/AssigneeBadge'
import { OfferModal } from '@/components/offers/OfferModal'
import { RecurringTemplateEditor } from '@/components/offers/RecurringTemplateEditor'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'
import { logActivity } from '@/lib/activity'
import type { Offer, Task, RecurringTemplate, Profile, CreativeTag } from '@/lib/types'

const CREATIVE_TAGS: { value: CreativeTag; label: string; color: string; bg: string; icon?: string }[] = [
  { value: 'untested',    label: 'Não testada',  color: '#6B7280', bg: '#6B728022' },
  { value: 'active',      label: 'Ativa',         color: '#10B981', bg: '#10B98122' },
  { value: 'validated',   label: 'Validada',      color: '#0EA5E9', bg: '#0EA5E922' },
  { value: 'roi_supreme', label: 'ROI SUPREMO',   color: '#F59E0B', bg: '#F59E0B22', icon: '👑' },
]

interface OfferDossierClientProps {
  offer: Offer
  profile: Profile
}

type Tab = 'overview' | 'history' | 'templates' | 'creatives'

export function OfferDossierClient({ offer, profile }: OfferDossierClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [templateEditor, setTemplateEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null)

  // Criativos
  const { data: creatives = [], isLoading: creativesLoading } = useCreatives(offer.id)
  const createCreative = useCreateCreative()
  const updateCreative = useUpdateCreative()
  const deleteCreative = useDeleteCreative()

  // Form — novo criativo
  const [addingCreative, setAddingCreative] = useState(false)
  const [newCreativeName, setNewCreativeName] = useState('')
  const [newCreativeUrl, setNewCreativeUrl] = useState('')
  const [newCreativeFile, setNewCreativeFile] = useState<File | null>(null)
  const [newCreativePreview, setNewCreativePreview] = useState<string | null>(null)
  const [newCreativeTag, setNewCreativeTag] = useState<CreativeTag | undefined>(undefined)
  const newFileInputRef = useRef<HTMLInputElement>(null)

  // Form — editar criativo
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null)
  const [editingCreativeName, setEditingCreativeName] = useState('')
  const [editingCreativeUrl, setEditingCreativeUrl] = useState('')
  const [editingCreativeFile, setEditingCreativeFile] = useState<File | null>(null)
  const [editingCreativePreview, setEditingCreativePreview] = useState<string | null>(null)
  const [editingCreativeTag, setEditingCreativeTag] = useState<CreativeTag | undefined>(undefined)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Upload imagem → Supabase Storage, retorna URL pública
  async function uploadImage(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage.from('creatives').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('creatives').getPublicUrl(path)
    return data.publicUrl
  }

  async function removeStorageImage(url: string) {
    try {
      const marker = '/object/public/creatives/'
      const idx = url.indexOf(marker)
      if (idx !== -1) {
        const path = url.slice(idx + marker.length)
        await supabase.storage.from('creatives').remove([path])
      }
    } catch { /* silently ignore storage errors on delete */ }
  }

  function pickFile(file: File, setFile: (f: File) => void, setPreview: (p: string) => void) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5 MB.'); return }
    setFile(file)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const deleteOffer = useDeleteOffer()
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDeleteOffer() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await deleteOffer.mutateAsync(offer.id)
      toast.success('Oferta excluída.')
      router.replace('/offers')
    } catch {
      toast.error('Erro ao excluir oferta.')
      setConfirmDelete(false)
    }
  }

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

  async function handleAddCreative() {
    if (!newCreativeName.trim()) { toast.error('Nome obrigatório.'); return }
    try {
      let image_url: string | undefined
      if (newCreativeFile) {
        const path = `${offer.id}/${Date.now()}_${newCreativeFile.name}`
        image_url = await uploadImage(newCreativeFile, path)
      }
      await createCreative.mutateAsync({
        offer_id: offer.id,
        name: newCreativeName.trim(),
        drive_url: newCreativeUrl.trim() || undefined,
        image_url,
        tag: newCreativeTag,
      })
      setNewCreativeName('')
      setNewCreativeUrl('')
      setNewCreativeFile(null)
      setNewCreativePreview(null)
      setNewCreativeTag(undefined)
      setAddingCreative(false)
      toast.success('Criativo adicionado!')
      logActivity({ action: 'creative_added', title: `Criativo adicionado: "${newCreativeName.trim()}" em "${offer.name}"`, entity_type: 'creative', entity_id: offer.id })
    } catch {
      toast.error('Erro ao adicionar criativo.')
    }
  }

  async function handleSaveEdit(creative: { id: string; image_url?: string }) {
    if (!editingCreativeName.trim()) { toast.error('Nome obrigatório.'); return }
    try {
      let image_url = creative.image_url
      if (editingCreativeFile) {
        // Remove imagem antiga se existir
        if (creative.image_url) await removeStorageImage(creative.image_url)
        const path = `${offer.id}/${Date.now()}_${editingCreativeFile.name}`
        image_url = await uploadImage(editingCreativeFile, path)
      }
      await updateCreative.mutateAsync({
        id: creative.id,
        offer_id: offer.id,
        name: editingCreativeName.trim(),
        drive_url: editingCreativeUrl.trim() || undefined,
        image_url,
        tag: editingCreativeTag,
      })
      setEditingCreativeId(null)
      setEditingCreativeFile(null)
      setEditingCreativePreview(null)
      setEditingCreativeTag(undefined)
      toast.success('Criativo atualizado!')
    } catch {
      toast.error('Erro ao atualizar criativo.')
    }
  }

  async function handleDeleteCreative(id: string, image_url?: string) {
    try {
      if (image_url) await removeStorageImage(image_url)
      await deleteCreative.mutateAsync({ id, offer_id: offer.id })
      toast.success('Criativo removido.')
    } catch {
      toast.error('Erro ao remover criativo.')
    }
  }

  const TABS: { value: Tab; label: string }[] = [
    { value: 'overview', label: 'Visão geral' },
    { value: 'history', label: 'Histórico de tarefas' },
    { value: 'templates', label: 'Templates recorrentes' },
    { value: 'creatives', label: 'Criativos' },
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
            onClick={handleDeleteOffer}
            disabled={deleteOffer.isPending}
            onBlur={() => setConfirmDelete(false)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 border transition-all',
              confirmDelete
                ? 'bg-red-500 border-red-500 text-white'
                : 'border-[#22222E] text-[#5A5A70] hover:text-red-400 hover:border-red-400/40'
            )}
          >
            <Trash2 size={14} />
            {confirmDelete ? 'Confirmar' : 'Excluir'}
          </button>
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

          {/* Creatives tab */}
          {activeTab === 'creatives' && (
            <div>
              {/* Cabeçalho */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#9090A8]">{creatives.length} criativo(s)</p>
                {!addingCreative && (
                  <button
                    onClick={() => setAddingCreative(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
                  >
                    <Plus size={14} />
                    Novo criativo
                  </button>
                )}
              </div>

              {/* Form — novo criativo */}
              {addingCreative && (
                <div className="mb-5 p-4 bg-[#111118] rounded-xl border border-[#7C3AED40] space-y-3">
                  <input
                    value={newCreativeName}
                    onChange={e => setNewCreativeName(e.target.value)}
                    placeholder="Nome do criativo *"
                    autoFocus
                    className="w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl px-3 py-2.5 text-sm text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED] transition-colors"
                  />
                  <input
                    value={newCreativeUrl}
                    onChange={e => setNewCreativeUrl(e.target.value)}
                    placeholder="Link do Drive (opcional)"
                    className="w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl px-3 py-2.5 text-sm text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED] transition-colors"
                  />
                  <input
                    ref={newFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f, setNewCreativeFile, setNewCreativePreview) }}
                  />
                  {newCreativePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#22222E] bg-[#0A0A0F] flex items-center justify-center">
                      <img src={newCreativePreview} alt="Preview" className="max-w-full max-h-48 object-contain" />
                      <button
                        onClick={() => { setNewCreativeFile(null); setNewCreativePreview(null); if (newFileInputRef.current) newFileInputRef.current.value = '' }}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-red-500/80 transition-colors"
                      >
                        <XIcon size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => newFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#22222E] hover:border-[#7C3AED60] text-[#5A5A70] hover:text-[#8B5CF6] transition-colors text-xs"
                    >
                      <ImagePlus size={15} />
                      Adicionar imagem (até 5 MB)
                    </button>
                  )}
                  {/* Seletor de tag */}
                  <div className="flex flex-wrap gap-1.5">
                    {CREATIVE_TAGS.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setNewCreativeTag(newCreativeTag === t.value ? undefined : t.value)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-600 border transition-all',
                          newCreativeTag === t.value ? 'border-transparent' : 'border-[#22222E] bg-transparent hover:border-current'
                        )}
                        style={newCreativeTag === t.value
                          ? { backgroundColor: t.color, color: '#fff' }
                          : { color: t.color }
                        }
                      >
                        {t.icon && <span>{t.icon}</span>}
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setAddingCreative(false); setNewCreativeName(''); setNewCreativeUrl(''); setNewCreativeFile(null); setNewCreativePreview(null); setNewCreativeTag(undefined) }}
                      className="px-3 py-2 rounded-lg text-xs font-600 text-[#9090A8] hover:text-[#F0F0F8] border border-[#22222E] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddCreative}
                      disabled={createCreative.isPending}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors disabled:opacity-50"
                    >
                      <Check size={13} />
                      {createCreative.isPending ? 'Enviando...' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Grid de criativos */}
              {creativesLoading ? (
                <div className="text-sm text-[#5A5A70] py-8 text-center">Carregando...</div>
              ) : creatives.length === 0 && !addingCreative ? (
                <EmptyState icon="🎨" title="Sem criativos" description="Adicione criativos com link do Drive ou imagens de até 5 MB." />
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {creatives.map(creative => {
                    const isEditing = editingCreativeId === creative.id
                    return isEditing ? (
                      /* ── Editor inline — ocupa linha inteira ── */
                      <div key={creative.id} className="col-span-5 p-4 bg-[#111118] rounded-xl border border-[#7C3AED40] space-y-3">
                        <input
                          value={editingCreativeName}
                          onChange={e => setEditingCreativeName(e.target.value)}
                          autoFocus
                          className="w-full bg-[#0A0A0F] border border-[#22222E] rounded-lg px-3 py-2 text-sm text-[#F0F0F8] focus:outline-none focus:border-[#7C3AED] transition-colors"
                        />
                        <input
                          value={editingCreativeUrl}
                          onChange={e => setEditingCreativeUrl(e.target.value)}
                          placeholder="Link do Drive (opcional)"
                          className="w-full bg-[#0A0A0F] border border-[#22222E] rounded-lg px-3 py-2 text-sm text-[#F0F0F8] focus:outline-none focus:border-[#7C3AED] transition-colors"
                        />
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                          className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f, setEditingCreativeFile, setEditingCreativePreview) }}
                        />
                        {editingCreativePreview ? (
                          <div className="relative rounded-xl overflow-hidden border border-[#22222E] bg-[#0A0A0F] flex items-center justify-center">
                            <img src={editingCreativePreview} alt="Preview" className="max-w-full max-h-48 object-contain" />
                            <button
                              onClick={() => { setEditingCreativeFile(null); setEditingCreativePreview(null); if (editFileInputRef.current) editFileInputRef.current.value = '' }}
                              className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-red-500/80 transition-colors"
                            >
                              <XIcon size={13} />
                            </button>
                          </div>
                        ) : creative.image_url ? (
                          <div className="relative rounded-xl overflow-hidden border border-[#22222E] bg-[#0A0A0F] flex items-center justify-center">
                            <img src={creative.image_url} alt={creative.name} className="max-w-full max-h-48 object-contain" />
                            <button
                              onClick={() => editFileInputRef.current?.click()}
                              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 transition-colors group"
                            >
                              <span className="opacity-0 group-hover:opacity-100 text-xs text-white font-600 flex items-center gap-1.5">
                                <ImagePlus size={14} /> Substituir imagem
                              </span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#22222E] hover:border-[#7C3AED60] text-[#5A5A70] hover:text-[#8B5CF6] transition-colors text-xs"
                          >
                            <ImagePlus size={15} /> Adicionar imagem (até 5 MB)
                          </button>
                        )}
                        {/* Seletor de tag — edição */}
                        <div className="flex flex-wrap gap-1.5">
                          {CREATIVE_TAGS.map(t => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setEditingCreativeTag(editingCreativeTag === t.value ? undefined : t.value)}
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-600 border transition-all',
                                editingCreativeTag === t.value ? 'border-transparent' : 'border-[#22222E] bg-transparent hover:border-current'
                              )}
                              style={editingCreativeTag === t.value
                                ? { backgroundColor: t.color, color: '#fff' }
                                : { color: t.color }
                              }
                            >
                              {t.icon && <span>{t.icon}</span>}
                              {t.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setEditingCreativeId(null); setEditingCreativeFile(null); setEditingCreativePreview(null); setEditingCreativeTag(undefined) }}
                            className="p-1.5 rounded-lg text-[#9090A8] hover:text-[#F0F0F8] border border-[#22222E] transition-colors"
                          >
                            <XIcon size={13} />
                          </button>
                          <button
                            onClick={() => handleSaveEdit(creative)}
                            disabled={updateCreative.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-600 transition-colors disabled:opacity-50"
                          >
                            <Check size={13} />
                            {updateCreative.isPending ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Card de visualização ── */
                      <div key={creative.id} className="group relative flex flex-col bg-[#111118] rounded-xl border border-[#22222E] overflow-hidden">
                        {/* Área da imagem */}
                        <div
                          className="relative bg-[#0A0A0F] flex items-center justify-center cursor-zoom-in"
                          style={{ aspectRatio: '3/4' }}
                          onClick={() => creative.image_url && setLightboxUrl(creative.image_url)}
                        >
                          {creative.image_url ? (
                            <img
                              src={creative.image_url}
                              alt={creative.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImagePlus size={24} className="text-[#2A2A38]" />
                          )}

                          {/* Badge de tag */}
                          {creative.tag && (() => {
                            const t = CREATIVE_TAGS.find(x => x.value === creative.tag)!
                            return (
                              <span
                                className={cn(
                                  'absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-700 leading-none',
                                  creative.tag === 'roi_supreme' && 'ring-1 ring-amber-400/60'
                                )}
                                style={{ backgroundColor: t.color + 'DD', color: '#fff' }}
                              >
                                {t.icon && <span className="text-[10px]">{t.icon}</span>}
                                {t.label}
                              </span>
                            )
                          })()}

                          {/* Overlay de ações no hover */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            {creative.image_url && (
                              <button
                                onClick={e => { e.stopPropagation(); setLightboxUrl(creative.image_url!) }}
                                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                              >
                                <ZoomIn size={14} />
                              </button>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); setEditingCreativeId(creative.id); setEditingCreativeName(creative.name); setEditingCreativeUrl(creative.drive_url ?? ''); setEditingCreativeFile(null); setEditingCreativePreview(null); setEditingCreativeTag(creative.tag) }}
                              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteCreative(creative.id, creative.image_url) }}
                              disabled={deleteCreative.isPending}
                              className="p-1.5 rounded-lg bg-white/15 hover:bg-red-500/70 text-white transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Rodapé */}
                        <div className="px-2 py-1.5 flex items-center gap-1 min-w-0">
                          <p className="flex-1 text-[11px] font-600 text-[#F0F0F8] truncate">{creative.name}</p>
                          {creative.drive_url && (
                            <a
                              href={creative.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="shrink-0 text-[#5A5A70] hover:text-[#8B5CF6] transition-colors"
                              title="Abrir Drive"
                            >
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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

      {/* Lightbox de imagem */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <XIcon size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Criativo"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
