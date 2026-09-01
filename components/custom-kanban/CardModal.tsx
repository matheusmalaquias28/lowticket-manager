'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Save, Trash2, Plus, Tag, Check, Link2,
  ImagePlus, Image as ImageIcon, Video, Upload,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  useUpdateCard,
  useDeleteCard,
  useKanbanLabels,
  useSaveKanbanLabels,
} from '@/hooks/useCustomKanban'
import { LinksList } from '@/components/tasks/LinksList'
import type {
  CustomCard, KanbanLabel, TaskLink,
  KanbanCreative, KanbanCreativeFormat, CreativeStatus, AssigneeName,
} from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const LABEL_COLORS = [
  '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16',
]

const CREATIVE_STATUSES: { value: CreativeStatus; color: string }[] = [
  { value: 'Não testado', color: '#5A5A70' },
  { value: 'Em teste',    color: '#0EA5E9' },
  { value: 'Descartado',  color: '#EF4444' },
  { value: 'Validado',    color: '#10B981' },
]

const RATIOS = ['1:1', '3:4', '9:16'] as const
type Ratio = (typeof RATIOS)[number]

// ─── New creative draft (for adding inside CardModal) ─────────────────────────

interface CreativeDraft {
  id: string
  name: string
  media_type: 'image' | 'video'
  image_files: Partial<Record<Ratio, File>>
  link: string
  status: CreativeStatus
}

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

// ─── InlineCreativeDraft (compact form for CardModal) ─────────────────────────

interface InlineCreativeDraftProps {
  draft: CreativeDraft
  index: number
  onUpdate: (u: Partial<CreativeDraft>) => void
  onSetFile: (ratio: Ratio, file: File | null) => void
  onDelete: () => void
}

function InlineCreativeDraft({ draft, index, onUpdate, onSetFile, onDelete }: InlineCreativeDraftProps) {
  const fileRef11  = useRef<HTMLInputElement>(null)
  const fileRef45  = useRef<HTMLInputElement>(null)
  const fileRef916 = useRef<HTMLInputElement>(null)
  const fileRefs: Record<Ratio, React.RefObject<HTMLInputElement>> = {
    '1:1': fileRef11, '3:4': fileRef45, '9:16': fileRef916,
  }

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
    <div className="bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-700 text-[#5A5A70] uppercase tracking-wider">
          Novo criativo {index}
        </span>
        <button onClick={onDelete} className="text-[#5A5A70] hover:text-[#EF4444] transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

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

      {draft.media_type === 'image' && (
        <div className="grid grid-cols-3 gap-2">
          {RATIOS.map(ratio => {
            const preview = getPreview(ratio)
            return (
              <div key={ratio} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileRefs[ratio].current?.click()}
                  className={cn(
                    'relative w-full h-16 rounded-lg border-2 border-dashed overflow-hidden transition-all',
                    preview ? 'border-[#7C3AED40]' : 'border-[#22222E] hover:border-[#7C3AED40] hover:bg-[#7C3AED08]',
                  )}
                >
                  {preview ? (
                    <img src={preview} alt={ratio} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-0.5 text-[#5A5A70]">
                      <Upload size={12} />
                      <span className="text-[8px] font-600">{ratio}</span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileRefs[ratio]}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                  className="hidden"
                  onChange={e => { onSetFile(ratio, e.target.files?.[0] ?? null); e.target.value = '' }}
                />
                <span className="text-[9px] text-[#5A5A70] font-600">{ratio}</span>
                {preview && (
                  <button onClick={() => onSetFile(ratio, null)} className="text-[9px] text-[#5A5A70] hover:text-[#EF4444] transition-colors leading-none">
                    remover
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {draft.media_type === 'video' && (
        <input
          type="url"
          value={draft.link}
          onChange={e => onUpdate({ link: e.target.value })}
          placeholder="https://..."
          className="w-full bg-[#111118] border border-[#22222E] rounded-lg px-3 py-2 text-xs text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED]"
        />
      )}

      <div className="flex flex-wrap gap-1.5">
        {CREATIVE_STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => onUpdate({ status: s.value })}
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-600 border transition-all',
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
  )
}

// ─── ExistingCreativeRow ───────────────────────────────────────────────────────

interface ExistingCreativeRowProps {
  creative: KanbanCreative
  onStatusChange: (status: CreativeStatus) => void
  onDelete: () => void
}

function ExistingCreativeRow({ creative, onStatusChange, onDelete }: ExistingCreativeRowProps) {
  const statusInfo = CREATIVE_STATUSES.find(s => s.value === creative.status)
  const imagesWithUrl = (creative.formats ?? []).filter(f => f.image_url)

  return (
    <div className="bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {creative.media_type === 'video' ? (
            <Video size={12} className="text-[#5A5A70] shrink-0" />
          ) : (
            <ImageIcon size={12} className="text-[#5A5A70] shrink-0" />
          )}
          <span className="text-xs font-600 text-[#F0F0F8] truncate">{creative.name || 'Sem nome'}</span>
        </div>
        <button onClick={onDelete} className="text-[#5A5A70] hover:text-[#EF4444] transition-colors shrink-0">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Image thumbnails */}
      {creative.media_type === 'image' && imagesWithUrl.length > 0 && (
        <div className="flex gap-1.5">
          {imagesWithUrl.map(f => (
            <a
              key={f.ratio}
              href={f.image_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="relative h-10 w-10 rounded-md overflow-hidden border border-[#22222E] hover:border-[#7C3AED40] shrink-0 group"
              title={f.ratio}
            >
              <img src={f.image_url} alt={f.ratio} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ExternalLink size={10} className="text-white" />
              </div>
            </a>
          ))}
          {(creative.formats ?? []).filter(f => !f.image_url).map(f => (
            <div
              key={f.ratio}
              className="h-10 w-10 rounded-md border-2 border-dashed border-[#22222E] flex items-center justify-center shrink-0"
              title={`${f.ratio} — sem imagem`}
            >
              <span className="text-[8px] text-[#5A5A70]">{f.ratio}</span>
            </div>
          ))}
        </div>
      )}

      {/* Video link */}
      {creative.media_type === 'video' && creative.link && (
        <a
          href={creative.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 text-[11px] text-[#0EA5E9] hover:underline"
        >
          <ExternalLink size={10} />
          Abrir vídeo
        </a>
      )}

      {/* Status selector */}
      <div className="flex flex-wrap gap-1.5">
        {CREATIVE_STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-600 border transition-all',
              creative.status === s.value ? 'border-transparent' : 'border-[#22222E]',
            )}
            style={{
              backgroundColor: creative.status === s.value ? s.color : 'transparent',
              color: creative.status === s.value ? 'white' : s.color,
            }}
          >
            {s.value}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── CardModal ────────────────────────────────────────────────────────────────

interface CardModalProps {
  card: CustomCard | null
  open: boolean
  onClose: () => void
}

export function CardModal({ card, open, onClose }: CardModalProps) {
  const supabase = createClient()
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const { data: labels = [] } = useKanbanLabels()
  const saveLabels = useSaveKanbanLabels()

  const [title, setTitle]                       = useState('')
  const [description, setDescription]           = useState('')
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [links, setLinks]                       = useState<TaskLink[]>([])
  const [assignee, setAssignee]                 = useState<AssigneeName | null | undefined>(null)
  const [cardType, setCardType]                 = useState<'open' | 'creative'>('open')
  const [localCreatives, setLocalCreatives]     = useState<KanbanCreative[]>([])
  const [newDrafts, setNewDrafts]               = useState<CreativeDraft[]>([])
  const [saving, setSaving]                     = useState(false)
  const [confirmDelete, setConfirmDelete]       = useState(false)
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false)
  const [newLabelName, setNewLabelName]         = useState('')
  const [newLabelColor, setNewLabelColor]       = useState('#7C3AED')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description ?? '')
      setSelectedLabelIds(card.label_ids ?? [])
      setLinks(card.links ?? [])
      setAssignee(card.assignee ?? null)
      setCardType(card.card_type ?? 'open')
      setLocalCreatives(card.creatives ?? [])
      setNewDrafts([])
    }
    setConfirmDelete(false)
    setLabelDropdownOpen(false)
    setNewLabelName('')
    setNewLabelColor('#7C3AED')
  }, [card, open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setLabelDropdownOpen(false)
    }
    if (labelDropdownOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [labelDropdownOpen])

  async function uploadImage(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage.from('creatives').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('creatives').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!card || !title.trim()) return
    setSaving(true)
    try {
      let finalCreatives = localCreatives

      if (cardType === 'creative' && newDrafts.length > 0) {
        const uploaded: KanbanCreative[] = await Promise.all(
          newDrafts.map(async (draft) => {
            if (draft.media_type === 'video') {
              return { id: draft.id, name: draft.name, media_type: 'video' as const, link: draft.link || undefined, status: draft.status }
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
            return { id: draft.id, name: draft.name, media_type: 'image' as const, formats, status: draft.status }
          }),
        )
        finalCreatives = [...localCreatives, ...uploaded]
      }

      await updateCard.mutateAsync({
        id: card.id,
        title: title.trim(),
        description: description.trim() || undefined,
        label_ids: selectedLabelIds,
        assignee: assignee ?? null,
        card_type: cardType,
        creatives: finalCreatives,
        ...(card.links !== undefined ? { links } : {}),
      })
      toast.success('Card atualizado!')
      onClose()
    } catch {
      toast.error('Erro ao salvar card.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!card) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await deleteCard.mutateAsync(card.id)
      toast.success('Card excluído.')
      onClose()
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  async function toggleLabel(id: string) {
    if (!card) return
    const newIds = selectedLabelIds.includes(id)
      ? selectedLabelIds.filter(l => l !== id)
      : [...selectedLabelIds, id]
    setSelectedLabelIds(newIds)
    try {
      await updateCard.mutateAsync({ id: card.id, label_ids: newIds })
    } catch {
      setSelectedLabelIds(selectedLabelIds)
      toast.error('Erro ao salvar etiqueta.')
    }
  }

  async function addLabel() {
    const name = newLabelName.trim()
    if (!name) return
    const label: KanbanLabel = { id: `lbl_${Date.now()}`, name, color: newLabelColor }
    try {
      await saveLabels.mutateAsync([...labels, label])
      setNewLabelName(''); setNewLabelColor('#7C3AED')
      toast.success(`Etiqueta "${name}" criada!`)
    } catch { toast.error('Erro ao criar etiqueta.') }
  }

  async function removeLabel(id: string) {
    try {
      await saveLabels.mutateAsync(labels.filter(l => l.id !== id))
      setSelectedLabelIds(prev => prev.filter(lid => lid !== id))
    } catch { toast.error('Erro ao remover etiqueta.') }
  }

  async function changeCreativeStatus(creativeId: string, status: CreativeStatus) {
    if (!card) return
    const updated = localCreatives.map(c => c.id === creativeId ? { ...c, status } : c)
    setLocalCreatives(updated)
    try {
      await updateCard.mutateAsync({ id: card.id, creatives: updated })
    } catch {
      setLocalCreatives(localCreatives)
      toast.error('Erro ao atualizar status.')
    }
  }

  async function deleteCreative(creativeId: string) {
    if (!card) return
    const updated = localCreatives.filter(c => c.id !== creativeId)
    setLocalCreatives(updated)
    try {
      await updateCard.mutateAsync({ id: card.id, creatives: updated })
    } catch {
      setLocalCreatives(localCreatives)
      toast.error('Erro ao remover criativo.')
    }
  }

  function updateNewDraft(id: string, updates: Partial<CreativeDraft>) {
    setNewDrafts(p => p.map(d => d.id === id ? { ...d, ...updates } : d))
  }

  function setNewDraftFile(id: string, ratio: Ratio, file: File | null) {
    setNewDrafts(p => p.map(d => {
      if (d.id !== id) return d
      const image_files = { ...d.image_files }
      if (file) image_files[ratio] = file
      else delete image_files[ratio]
      return { ...d, image_files }
    }))
  }

  return (
    <AnimatePresence>
      {open && card && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-[#111118] rounded-2xl shadow-[0_0_0_1px_#22222E,0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-[#22222E] shrink-0">
              <div className="flex items-start justify-between mb-2">
                {/* Type badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wide',
                      cardType === 'creative'
                        ? 'bg-[#7C3AED1A] text-[#8B5CF6]'
                        : 'bg-[#22222E] text-[#5A5A70]',
                    )}
                  >
                    {cardType === 'creative' ? 'Criativo' : 'Aberta'}
                  </span>

                  {/* Assignee avatars */}
                  <div className="flex gap-1.5">
                    {(['Matheus', 'Kauan'] as AssigneeName[]).map(name => (
                      <button
                        key={name}
                        onClick={() => setAssignee(p => p === name ? null : name)}
                        className={cn(
                          'w-6 h-6 rounded-full text-[10px] font-700 transition-all border',
                          assignee === name
                            ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                            : 'border-[#22222E] bg-[#1A1A24] text-[#5A5A70] hover:border-[#7C3AED40] hover:text-[#F0F0F8]',
                        )}
                        title={name}
                      >
                        {name[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={onClose} className="text-[#5A5A70] hover:text-[#F0F0F8] transition-colors">
                  <X size={18} />
                </button>
              </div>

              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Título do card..."
                className="w-full text-base font-700 text-[#F0F0F8] bg-transparent focus:outline-none placeholder:text-[#5A5A70]"
              />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Descrição */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Descrição</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Adicione uma descrição..."
                  className="w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3 text-sm text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED] resize-none"
                />
              </div>

              {/* Etiquetas */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Etiquetas</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedLabelIds.map(id => {
                    const lbl = labels.find(l => l.id === id)
                    if (!lbl) return null
                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-600 text-white" style={{ backgroundColor: lbl.color }}>
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
                        {labels.length === 0 && <p className="text-[11px] text-[#5A5A70] py-1">Nenhuma etiqueta criada ainda.</p>}
                        {labels.map(lbl => {
                          const active = selectedLabelIds.includes(lbl.id)
                          return (
                            <div key={lbl.id} className="flex items-center gap-2 group">
                              <button
                                onClick={() => toggleLabel(lbl.id)}
                                className={cn('flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-600 transition-colors text-left', active ? 'bg-[#7C3AED1A]' : 'hover:bg-[#22222E]')}
                              >
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: lbl.color }} />
                                <span className={active ? 'text-[#F0F0F8]' : 'text-[#9090A8]'}>{lbl.name}</span>
                                {active && <Check size={11} className="ml-auto text-[#8B5CF6]" strokeWidth={3} />}
                              </button>
                              <button onClick={() => removeLabel(lbl.id)} className="opacity-0 group-hover:opacity-100 text-[#5A5A70] hover:text-[#EF4444] transition-all shrink-0 p-0.5">
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
                            <button onClick={addLabel} disabled={!newLabelName.trim() || saveLabels.isPending} className="text-[#5A5A70] hover:text-[#8B5CF6] disabled:opacity-30 transition-colors p-0.5">
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {LABEL_COLORS.map(c => (
                              <button key={c} onClick={() => setNewLabelColor(c)} className={cn('w-4 h-4 rounded-full transition-all', newLabelColor === c && 'ring-2 ring-offset-1 ring-offset-[#1A1A24] ring-white scale-110')} style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Links relacionados */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={13} className="text-[#5A5A70]" />
                  <label className="text-xs font-600 text-[#9090A8]">Links relacionados</label>
                </div>
                <LinksList links={links} onChange={setLinks} />
              </div>

              {/* Criativos (apenas para tipo 'creative') */}
              {cardType === 'creative' && (
                <div className="border-t border-[#22222E] pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImagePlus size={13} className="text-[#5A5A70]" />
                      <span className="text-xs font-700 text-[#9090A8] uppercase tracking-wider">Criativos</span>
                      {localCreatives.length > 0 && (
                        <span className="text-[10px] font-600 text-[#5A5A70]">{localCreatives.length}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setNewDrafts(p => [...p, newDraft()])}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-600 text-[#5A5A70] hover:text-[#8B5CF6] hover:bg-[#7C3AED1A] border border-[#22222E] transition-colors"
                    >
                      <Plus size={11} />
                      Adicionar
                    </button>
                  </div>

                  {/* Existing creatives */}
                  {localCreatives.length > 0 && (
                    <div className="space-y-2">
                      {localCreatives.map(c => (
                        <ExistingCreativeRow
                          key={c.id}
                          creative={c}
                          onStatusChange={status => changeCreativeStatus(c.id, status)}
                          onDelete={() => deleteCreative(c.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* New drafts */}
                  {newDrafts.length > 0 && (
                    <div className="space-y-3">
                      {newDrafts.map((draft, idx) => (
                        <InlineCreativeDraft
                          key={draft.id}
                          draft={draft}
                          index={localCreatives.length + idx + 1}
                          onUpdate={u => updateNewDraft(draft.id, u)}
                          onSetFile={(ratio, file) => setNewDraftFile(draft.id, ratio, file)}
                          onDelete={() => setNewDrafts(p => p.filter(d => d.id !== draft.id))}
                        />
                      ))}
                    </div>
                  )}

                  {localCreatives.length === 0 && newDrafts.length === 0 && (
                    <button
                      onClick={() => setNewDrafts([newDraft()])}
                      className="w-full flex flex-col items-center gap-1.5 py-5 rounded-xl border-2 border-dashed border-[#22222E] hover:border-[#7C3AED40] hover:bg-[#7C3AED08] transition-colors text-[#5A5A70] hover:text-[#8B5CF6]"
                    >
                      <ImagePlus size={18} />
                      <span className="text-[11px] font-600">Adicionar primeiro criativo</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[#22222E] shrink-0">
              <button
                onClick={handleDelete}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 transition-all',
                  confirmDelete ? 'bg-[#EF4444] text-white' : 'text-[#EF4444] hover:bg-[#EF444420]',
                )}
              >
                <Trash2 size={13} />
                {confirmDelete ? 'Confirmar' : 'Excluir'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-600 text-[#9090A8] hover:text-[#F0F0F8] border border-[#22222E] hover:border-[#7C3AED40] transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Save size={13} />
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
