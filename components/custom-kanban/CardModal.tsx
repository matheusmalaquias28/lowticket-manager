'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Plus, Tag, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useUpdateCard,
  useDeleteCard,
  useKanbanLabels,
  useSaveKanbanLabels,
} from '@/hooks/useCustomKanban'
import { LinksList } from '@/components/tasks/LinksList'
import type { CustomCard, KanbanLabel, TaskLink } from '@/lib/types'

interface CardModalProps {
  card: CustomCard | null
  open: boolean
  onClose: () => void
}

const LABEL_COLORS = [
  '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6',
  '#F97316', '#84CC16',
]

export function CardModal({ card, open, onClose }: CardModalProps) {
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const { data: labels = [] } = useKanbanLabels()
  const saveLabels = useSaveKanbanLabels()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [links, setLinks] = useState<TaskLink[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Dropdown de etiquetas
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#7C3AED')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description ?? '')
      setSelectedLabelIds(card.label_ids ?? [])
      setLinks(card.links ?? [])
    }
    setConfirmDelete(false)
    setLabelDropdownOpen(false)
    setNewLabelName('')
    setNewLabelColor('#7C3AED')
  }, [card, open])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLabelDropdownOpen(false)
      }
    }
    if (labelDropdownOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [labelDropdownOpen])

  async function handleSave() {
    if (!card || !title.trim()) return
    setSaving(true)
    try {
      await updateCard.mutateAsync({
        id: card.id,
        title: title.trim(),
        description: description.trim() || undefined,
        label_ids: selectedLabelIds,
        links,
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
      setNewLabelName('')
      setNewLabelColor('#7C3AED')
      toast.success(`Etiqueta "${name}" criada!`)
    } catch {
      toast.error('Erro ao criar etiqueta.')
    }
  }

  async function removeLabel(id: string) {
    try {
      await saveLabels.mutateAsync(labels.filter(l => l.id !== id))
      setSelectedLabelIds(prev => prev.filter(lid => lid !== id))
    } catch {
      toast.error('Erro ao remover etiqueta.')
    }
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
            className="relative w-full max-w-lg bg-[#111118] rounded-2xl shadow-[0_0_0_1px_#22222E,0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
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

            <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
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

              {/* Etiquetas — dropdown */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Etiquetas</label>

                {/* Chips selecionadas */}
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

                {/* Botão que abre o dropdown */}
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
                        {/* Etiquetas existentes */}
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
                                  active ? 'bg-[#7C3AED1A]' : 'hover:bg-[#22222E]'
                                )}
                              >
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: lbl.color }}
                                />
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

                        {/* Adicionar nova etiqueta */}
                        <div className="pt-2 border-t border-[#22222E] space-y-2">
                          <p className="text-[10px] text-[#5A5A70] font-600 uppercase tracking-wide">Nova etiqueta</p>
                          <div className="flex items-center gap-2">
                            <label className="relative w-6 h-6 rounded-full cursor-pointer shrink-0">
                              <span
                                className="block w-6 h-6 rounded-full border border-[#22222E]"
                                style={{ backgroundColor: newLabelColor }}
                              />
                              <input
                                type="color"
                                value={newLabelColor}
                                onChange={e => setNewLabelColor(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              />
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
                                  newLabelColor === c && 'ring-2 ring-offset-1 ring-offset-[#1A1A24] ring-white scale-110'
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

              {/* Links relacionados */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={13} className="text-[#5A5A70]" />
                  <label className="text-xs font-600 text-[#9090A8]">Links relacionados</label>
                </div>
                <LinksList links={links} onChange={setLinks} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[#22222E]">
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
