'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Plus, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCreateAcervoCard, useUpdateAcervoCard, useDeleteAcervoCard } from '@/hooks/useAcervo'
import type { AcervoCard, AcervoLink } from '@/lib/types'

const CARD_COLORS = [
  '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6',
  '#F97316', '#64748B',
]

interface AcervoModalProps {
  card: AcervoCard | null
  open: boolean
  onClose: () => void
  nextPosition: number
}

export function AcervoModal({ card, open, onClose, nextPosition }: AcervoModalProps) {
  const createCard = useCreateAcervoCard()
  const updateCard = useUpdateAcervoCard()
  const deleteCard = useDeleteAcervoCard()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [links, setLinks] = useState<AcervoLink[]>([])
  const [color, setColor] = useState('#7C3AED')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isNew = !card

  useEffect(() => {
    if (open) {
      if (card) {
        setTitle(card.title)
        setContent(card.content)
        setLinks(card.links ?? [])
        setColor(card.color)
      } else {
        setTitle('')
        setContent('')
        setLinks([])
        setColor('#7C3AED')
      }
      setConfirmDelete(false)
    }
  }, [card, open])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      if (isNew) {
        await createCard.mutateAsync({
          title: title.trim(),
          content,
          links,
          color,
          position: nextPosition,
        })
        toast.success('Card criado!')
      } else {
        await updateCard.mutateAsync({
          id: card!.id,
          title: title.trim(),
          content,
          links,
          color,
        })
        toast.success('Card atualizado!')
      }
      onClose()
    } catch {
      toast.error('Erro ao salvar.')
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

  function addLink() {
    setLinks(prev => [...prev, { label: '', url: '' }])
  }

  function updateLink(idx: number, field: 'label' | 'url', value: string) {
    setLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function removeLink(idx: number) {
    setLinks(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <AnimatePresence>
      {open && (
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
            className="relative w-full max-w-xl bg-[#111118] rounded-2xl shadow-[0_0_0_1px_#22222E,0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Accent bar */}
            <div className="h-1 w-full" style={{ backgroundColor: color }} />

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#22222E]">
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Título do card..."
                className="flex-1 text-base font-700 text-[#F0F0F8] bg-transparent focus:outline-none placeholder:text-[#5A5A70]"
              />
              <button onClick={onClose} className="ml-3 text-[#5A5A70] hover:text-[#F0F0F8] transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">

              {/* Cor */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CARD_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-all',
                        color === c && 'ring-2 ring-offset-2 ring-offset-[#111118] ring-white scale-110'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Texto / Conteúdo */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Conteúdo</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={6}
                  placeholder="Anote informações, referências, estratégias..."
                  className="w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3 text-sm text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED] resize-none leading-relaxed"
                />
              </div>

              {/* Links */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Links</label>
                <div className="space-y-2">
                  {links.map((link, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0F] border border-[#22222E]"
                    >
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="text"
                          value={link.label}
                          onChange={e => updateLink(idx, 'label', e.target.value)}
                          placeholder="Rótulo"
                          className="bg-transparent text-xs text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={e => updateLink(idx, 'url', e.target.value)}
                          placeholder="https://..."
                          className="bg-transparent text-[10px] text-[#5A5A70] placeholder:text-[#5A5A70] focus:outline-none"
                        />
                      </div>
                      {link.url && (
                        <button
                          onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                          className="text-[#5A5A70] hover:text-[#8B5CF6] transition-colors shrink-0"
                        >
                          <ExternalLink size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => removeLink(idx)}
                        className="opacity-0 group-hover:opacity-100 text-[#5A5A70] hover:text-[#EF4444] transition-all shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addLink}
                    className="flex items-center gap-1.5 text-xs text-[#5A5A70] hover:text-[#8B5CF6] transition-colors py-1"
                  >
                    <Plus size={14} />
                    Adicionar link
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[#22222E]">
              {!isNew ? (
                <button
                  onClick={handleDelete}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 transition-all',
                    confirmDelete ? 'bg-[#EF4444] text-white' : 'text-[#EF4444] hover:bg-[#EF444420]'
                  )}
                >
                  <Trash2 size={13} />
                  {confirmDelete ? 'Confirmar' : 'Excluir'}
                </button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-600 text-[#9090A8] hover:text-[#F0F0F8] border border-[#22222E] hover:border-[#7C3AED40] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Save size={13} />
                  {saving ? 'Salvando...' : isNew ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
