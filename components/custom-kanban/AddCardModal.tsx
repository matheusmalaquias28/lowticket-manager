'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Trash2, Tag, Check, ImagePlus,
  Video, Image as ImageIcon, Link2, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  useCreateCard,
  useUpdateCard,
  useKanbanLabels,
  useSaveKanbanLabels,
} from '@/hooks/useCustomKanban'
import { LinksList } from '@/components/tasks/LinksList'
import type {
  TaskLink, AssigneeName,
  KanbanCreative, KanbanCreativeFormat, KanbanLabel,
  CreativeStatus,
} from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const CREATIVE_STATUSES: { value: CreativeStatus; color: string }[] = [
  { value: 'Não testado', color: '#5A5A70' },
  { value: 'Em teste',    color: '#0EA5E9' },
  { value: 'Descartado',  color: '#EF4444' },
  { value: 'Validado',    color: '#10B981' },
]

const RATIOS = ['1:1', '3:4', '9:16'] as const
type Ratio = (typeof RATIOS)[number]

const LABEL_COLORS = [
  '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreativeDraft {
  id: string
  name: string
  media_type: 'image' | 'video'
  image_files: Partial<Record<Ratio, File>>
  link: string
  status: CreativeStatus
}

interface AddCardModalProps {
  open: boolean
  columnId: string
  cardsCount: number
  onClose: () => void
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function newDraft(): CreativeDraft {
  return {
    id: `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    media_type: 'image',
    image_files: {},
    link: '',
    status: 'Não testado',
  }
}

// ─── CreativeDraftCard ────────────────────────────────────────────────────────

interface CreativeDraftCardProps {
  draft: CreativeDraft
  index: number
  onUpdate: (u: Partial<CreativeDraft>) => void
  onSetFile: (ratio: Ratio, file: File | null) => void
  onDelete: () => void
}

function CreativeDraftCard({ draft, index, onUpdate, onSetFile, onDelete }: CreativeDraftCardProps) {
  const fileRef11  = useRef<HTMLInputElement>(null)
  const fileRef45  = useRef<HTMLInputElement>(null)
  const fileRef916 = useRef<HTMLInputElement>(null)
  const fileRefs: Record<Ratio, React.RefObject<HTMLInputElement>> = {
    '1:1': fileRef11,
    '3:4': fileRef45,
    '9:16': fileRef916,
  }

  // Object-URL cache keyed by File identity — avoids memory leaks
  const previewCache = useRef<Map<File, string>>(new Map())
  useEffect(() => {
    const cache = previewCache.current
    return () => { cache.forEach(url => URL.revokeObjectURL(url)) }
  }, [])

  function getPreview(ratio: Ratio): string | undefined {
    const file = draft.image_files[ratio]
    if (!file) return undefined
    let url = previewCache.current.get(file)
    if (!url) { url = URL.createObjectURL(file); previewCache.current.set(file, url) }
    return url
  }

  return (
    <div className="bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3.5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-700 text-[#5A5A70] uppercase tracking-wider">
          Criativo {index}
        </span>
        <button
          onClick={onDelete}
          className="text-[#5A5A70] hover:text-[#EF4444] transition-colors p-0.5"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Name */}
      <input
        value={draft.name}
        onChange={e => onUpdate({ name: e.target.value })}
        placeholder="Nome do criativo..."
        className="w-full bg-[#111118] border border-[#22222E] rounded-lg px-3 py-2 text-xs text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED]"
      />

      {/* Media type toggle */}
      <div className="flex rounded-lg overflow-hidden border border-[#22222E] w-fit">
        {(['image', 'video'] as const).map(type => (
          <button
            key={type}
            onClick={() => onUpdate({ media_type: type })}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-600 transition-all',
              draft.media_type === type
                ? 'bg-[#7C3AED] text-white'
                : 'text-[#5A5A70] hover:text-[#F0F0F8] hover:bg-[#1A1A24]',
            )}
          >
            {type === 'image' ? <ImageIcon size={11} /> : <Video size={11} />}
            {type === 'image' ? 'Imagem' : 'Vídeo'}
          </button>
        ))}
      </div>

      {/* Image: 3 format upload zones */}
      {draft.media_type === 'image' && (
        <div>
          <p className="text-[10px] font-600 text-[#5A5A70] uppercase tracking-wider mb-2">
            Formatos
          </p>
          <div className="grid grid-cols-3 gap-2">
            {RATIOS.map(ratio => {
              const preview = getPreview(ratio)
              return (
                <div key={ratio} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileRefs[ratio].current?.click()}
                    className={cn(
                      'relative w-full h-20 rounded-lg border-2 border-dashed overflow-hidden transition-all',
                      preview
                        ? 'border-[#7C3AED40]'
                        : 'border-[#22222E] hover:border-[#7C3AED40] hover:bg-[#7C3AED08]',
                    )}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt={ratio}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-1 text-[#5A5A70]">
                        <Upload size={14} />
                        <span className="text-[9px] font-600">{ratio}</span>
                      </div>
                    )}
                  </button>

                  <input
                    ref={fileRefs[ratio]}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null
                      onSetFile(ratio, file)
                      e.target.value = ''
                    }}
                  />

                  <span className="text-[9px] text-[#5A5A70] font-600">{ratio}</span>

                  {preview && (
                    <button
                      onClick={() => onSetFile(ratio, null)}
                      className="text-[9px] text-[#5A5A70] hover:text-[#EF4444] transition-colors leading-none"
                    >
                      remover
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Video: link field */}
      {draft.media_type === 'video' && (
        <div>
          <p className="text-[10px] font-600 text-[#5A5A70] uppercase tracking-wider mb-2">
            Link do vídeo
          </p>
          <input
            type="url"
            value={draft.link}
            onChange={e => onUpdate({ link: e.target.value })}
            placeholder="https://..."
            className="w-full bg-[#111118] border border-[#22222E] rounded-lg px-3 py-2 text-xs text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
      )}

      {/* Status */}
      <div>
        <p className="text-[10px] font-600 text-[#5A5A70] uppercase tracking-wider mb-2">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {CREATIVE_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => onUpdate({ status: s.value })}
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-600 border transition-all',
                draft.status === s.value ? 'border-transparent' : 'border-[#22222E]',
              )}
              style={{
                backgroundColor: draft.status === s.value ? s.color : 'transparent',
                color: draft.status === s.value ? 'white' : s.color,
              }}
            >
              {s.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── AddCardModal ─────────────────────────────────────────────────────────────

export function AddCardModal({ open, columnId, cardsCount, onClose }: AddCardModalProps) {
  const supabase = createClient()
  const createCard = useCreateCard()
  const updateCard = useUpdateCard()
  const { data: labels = [] } = useKanbanLabels()
  const saveLabels = useSaveKanbanLabels()

  const [title, setTitle]                       = useState('')
  const [cardType, setCardType]                 = useState<'open' | 'creative'>('open')
  const [assignee, setAssignee]                 = useState<AssigneeName | undefined>(undefined)
  const [description, setDescription]           = useState('')
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [links, setLinks]                       = useState<TaskLink[]>([])
  const [creativeDrafts, setCreativeDrafts]     = useState<CreativeDraft[]>([])
  const [saving, setSaving]                     = useState(false)
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false)
  const [newLabelName, setNewLabelName]         = useState('')
  const [newLabelColor, setNewLabelColor]       = useState('#7C3AED')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const titleRef    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle(''); setCardType('open'); setAssignee(undefined)
      setDescription(''); setSelectedLabelIds([]); setLinks([])
      setCreativeDrafts([]); setSaving(false)
      setLabelDropdownOpen(false); setNewLabelName(''); setNewLabelColor('#7C3AED')
      setTimeout(() => titleRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setLabelDropdownOpen(false)
    }
    if (labelDropdownOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [labelDropdownOpen])

  function toggleLabel(id: string) {
    setSelectedLabelIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  async function addLabel() {
    const name = newLabelName.trim()
    if (!name) return
    const lbl: KanbanLabel = { id: `lbl_${Date.now()}`, name, color: newLabelColor }
    try {
      await saveLabels.mutateAsync([...labels, lbl])
      setNewLabelName(''); setNewLabelColor('#7C3AED')
      toast.success(`Etiqueta "${name}" criada!`)
    } catch { toast.error('Erro ao criar etiqueta.') }
  }

  async function removeLabel(id: string) {
    try {
      await saveLabels.mutateAsync(labels.filter(l => l.id !== id))
      setSelectedLabelIds(p => p.filter(x => x !== id))
    } catch { toast.error('Erro ao remover etiqueta.') }
  }

  function updateDraft(id: string, updates: Partial<CreativeDraft>) {
    setCreativeDrafts(p => p.map(d => d.id === id ? { ...d, ...updates } : d))
  }

  function setDraftFile(id: string, ratio: Ratio, file: File | null) {
    setCreativeDrafts(p => p.map(d => {
      if (d.id !== id) return d
      const image_files = { ...d.image_files }
      if (file) image_files[ratio] = file
      else delete image_files[ratio]
      return { ...d, image_files }
    }))
  }

  async function uploadImage(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage.from('creatives').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('creatives').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!title.trim()) { toast.error('Título obrigatório.'); return }
    setSaving(true)
    try {
      const card = await createCard.mutateAsync({
        column_id: columnId,
        title: title.trim(),
        position: cardsCount,
        card_type: cardType,
        assignee: assignee ?? null,
        description: description.trim() || undefined,
        label_ids: selectedLabelIds,
        links,
        creatives: [],
      })

      if (cardType === 'creative' && creativeDrafts.length > 0) {
        const finalCreatives: KanbanCreative[] = await Promise.all(
          creativeDrafts.map(async (draft) => {
            if (draft.media_type === 'video') {
              return {
                id: draft.id,
                name: draft.name,
                media_type: 'video' as const,
                link: draft.link || undefined,
                status: draft.status,
              }
            }
            const formats: KanbanCreativeFormat[] = []
            for (const ratio of RATIOS) {
              const file = draft.image_files[ratio]
              if (file) {
                const path = `kanban-cards/${card.id}/${draft.id}/${ratio.replace(':', 'x')}`
                const image_url = await uploadImage(file, path)
                formats.push({ ratio, image_url })
              } else {
                formats.push({ ratio })
              }
            }
            return {
              id: draft.id,
              name: draft.name,
              media_type: 'image' as const,
              formats,
              status: draft.status,
            }
          }),
        )
        await updateCard.mutateAsync({ id: card.id, creatives: finalCreatives })
      }

      toast.success('Card criado!')
      onClose()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao criar card.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-[#111118] rounded-2xl shadow-[0_0_0_1px_#22222E,0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#22222E] shrink-0">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-700 text-[#5A5A70] uppercase tracking-wider mb-1.5">
                  Novo Card
                </p>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="Nome da tarefa..."
                  className="w-full text-base font-700 text-[#F0F0F8] bg-transparent focus:outline-none placeholder:text-[#5A5A70]"
                />
              </div>
              <button
                onClick={onClose}
                className="ml-3 mt-0.5 text-[#5A5A70] hover:text-[#F0F0F8] transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Type + Assignee */}
              <div className="flex items-start gap-4">
                {/* Card type */}
                <div className="flex-1">
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Tipo</label>
                  <div className="flex rounded-lg overflow-hidden border border-[#22222E] w-fit">
                    {([
                      { value: 'open', label: 'Aberta' },
                      { value: 'creative', label: 'Criativo' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setCardType(opt.value)}
                        className={cn(
                          'px-4 py-2 text-xs font-600 transition-all',
                          cardType === opt.value
                            ? 'bg-[#7C3AED] text-white'
                            : 'text-[#5A5A70] hover:text-[#F0F0F8] hover:bg-[#1A1A24]',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Membro</label>
                  <div className="flex gap-2">
                    {(['Matheus', 'Kauan'] as AssigneeName[]).map(name => (
                      <button
                        key={name}
                        onClick={() => setAssignee(p => p === name ? undefined : name)}
                        className={cn(
                          'w-8 h-8 rounded-full text-xs font-700 transition-all border-2',
                          assignee === name
                            ? 'border-[#7C3AED] bg-[#7C3AED] text-white scale-110'
                            : 'border-[#22222E] bg-[#1A1A24] text-[#5A5A70] hover:border-[#7C3AED40] hover:text-[#F0F0F8]',
                        )}
                        title={name}
                      >
                        {name[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Descrição</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Adicione uma descrição..."
                  className="w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3 text-sm text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED] resize-none"
                />
              </div>

              {/* Labels */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Etiquetas</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedLabelIds.map(id => {
                    const lbl = labels.find(l => l.id === id)
                    if (!lbl) return null
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-600 text-white"
                        style={{ backgroundColor: lbl.color }}
                      >
                        {lbl.name}
                      </span>
                    )
                  })}
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setLabelDropdownOpen(p => !p)}
                    className="flex items-center gap-1.5 text-xs text-[#5A5A70] hover:text-[#8B5CF6] border border-[#22222E] hover:border-[#7C3AED40] rounded-lg px-2.5 py-1.5 transition-colors"
                  >
                    <Tag size={12} />
                    Gerenciar etiquetas
                  </button>

                  <AnimatePresence>
                    {labelDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-1.5 z-10 w-64 bg-[#1A1A24] border border-[#22222E] rounded-xl shadow-xl p-3 space-y-1"
                      >
                        {labels.length === 0 && (
                          <p className="text-[11px] text-[#5A5A70] py-1">Nenhuma etiqueta criada ainda.</p>
                        )}
                        {labels.map(lbl => {
                          const active = selectedLabelIds.includes(lbl.id)
                          return (
                            <div key={lbl.id} className="flex items-center gap-2 group">
                              <button
                                onClick={() => toggleLabel(lbl.id)}
                                className={cn(
                                  'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-600 transition-colors text-left',
                                  active ? 'bg-[#7C3AED1A]' : 'hover:bg-[#22222E]',
                                )}
                              >
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: lbl.color }} />
                                <span className={active ? 'text-[#F0F0F8]' : 'text-[#9090A8]'}>{lbl.name}</span>
                                {active && <Check size={11} className="ml-auto text-[#8B5CF6]" strokeWidth={3} />}
                              </button>
                              <button
                                onClick={() => removeLabel(lbl.id)}
                                className="opacity-0 group-hover:opacity-100 text-[#5A5A70] hover:text-[#EF4444] transition-all shrink-0 p-0.5"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )
                        })}

                        <div className="pt-2 border-t border-[#22222E] space-y-2">
                          <p className="text-[10px] text-[#5A5A70] font-600 uppercase tracking-wide">Nova etiqueta</p>
                          <div className="flex items-center gap-2">
                            <label className="relative w-6 h-6 rounded-full cursor-pointer shrink-0">
                              <span className="block w-6 h-6 rounded-full border border-[#22222E]" style={{ backgroundColor: newLabelColor }} />
                              <input type="color" value={newLabelColor} onChange={e => setNewLabelColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                            </label>
                            <input
                              value={newLabelName}
                              onChange={e => setNewLabelName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && addLabel()}
                              placeholder="Nome da etiqueta..."
                              className="flex-1 bg-[#0A0A0F] border border-[#22222E] rounded-lg px-2 py-1 text-xs text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED]"
                            />
                            <button
                              onClick={addLabel}
                              disabled={!newLabelName.trim() || saveLabels.isPending}
                              className="text-[#5A5A70] hover:text-[#8B5CF6] disabled:opacity-30 transition-colors p-0.5"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {LABEL_COLORS.map(c => (
                              <button
                                key={c}
                                onClick={() => setNewLabelColor(c)}
                                className={cn(
                                  'w-4 h-4 rounded-full transition-all',
                                  newLabelColor === c && 'ring-2 ring-offset-1 ring-offset-[#1A1A24] ring-white scale-110',
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Links */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={13} className="text-[#5A5A70]" />
                  <label className="text-xs font-600 text-[#9090A8]">Links relacionados</label>
                </div>
                <LinksList links={links} onChange={setLinks} />
              </div>

              {/* Creatives (only for 'creative' type) */}
              {cardType === 'creative' && (
                <div className="border-t border-[#22222E] pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-700 text-[#9090A8] uppercase tracking-wider">
                      Adicionar Criativo
                    </span>
                    <button
                      onClick={() => setCreativeDrafts(p => [...p, newDraft()])}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-600 text-[#5A5A70] hover:text-[#8B5CF6] hover:bg-[#7C3AED1A] border border-[#22222E] transition-colors"
                    >
                      <Plus size={11} />
                      Novo criativo
                    </button>
                  </div>

                  <div className="space-y-4">
                    {creativeDrafts.length === 0 ? (
                      <button
                        onClick={() => setCreativeDrafts([newDraft()])}
                        className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-[#22222E] hover:border-[#7C3AED40] hover:bg-[#7C3AED08] transition-colors text-[#5A5A70] hover:text-[#8B5CF6]"
                      >
                        <ImagePlus size={20} />
                        <span className="text-[11px] font-600">Adicionar primeiro criativo</span>
                      </button>
                    ) : (
                      creativeDrafts.map((draft, idx) => (
                        <CreativeDraftCard
                          key={draft.id}
                          draft={draft}
                          index={idx + 1}
                          onUpdate={u => updateDraft(draft.id, u)}
                          onSetFile={(ratio, file) => setDraftFile(draft.id, ratio, file)}
                          onDelete={() => setCreativeDrafts(p => p.filter(d => d.id !== draft.id))}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-[#22222E] shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-600 text-[#9090A8] hover:text-[#F0F0F8] border border-[#22222E] hover:border-[#7C3AED40] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? 'Criando...' : 'Criar Card'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
