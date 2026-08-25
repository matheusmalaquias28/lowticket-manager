'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Plus, Tag, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useUpdateCard,
  useDeleteCard,
  useKanbanLabels,
  useSaveKanbanLabels,
} from '@/hooks/useCustomKanban'
import type { CustomCard, KanbanLabel } from '@/lib/types'

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
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [managingLabels, setManagingLabels] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#7C3AED')

  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description ?? '')
      setSelectedLabelIds(card.label_ids ?? [])
    }
    setConfirmDelete(false)
    setManagingLabels(false)
    setNewLabelName('')
    setNewLabelColor('#7C3AED')
  }, [card, open])

  async function handleSave() {
    if (!card || !title.trim()) return
    setSaving(true)
    try {
      await updateCard.mutateAsync({
        id: card.id,
        title: title.trim(),
        description: description.trim() || undefined,
        label_ids: selectedLabelIds,
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

  // Auto-salva a seleção de etiquetas imediatamente no card
  async function toggleLabel(id: string) {
    if (!card) return
    const newIds = selectedLabelIds.includes(id)
      ? selectedLabelIds.filter(l => l !== id)
      : [...selectedLabelIds, id]
    setSelectedLabelIds(newIds)
    try {
      await updateCard.mutateAsync({ id: card.id, label_ids: newIds })
    } catch {
      // Reverte se falhar
      setSelectedLabelIds(selectedLabelIds)
      toast.error('Erro ao salvar etiqueta.')
    }
  }

  async function addLabel() {
    const name = newLabelName.trim()
    if (!name) return
    const label: KanbanLabel = {
      id: `lbl_${Date.now()}`,
      name,
      color: newLabelColor,
    }
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
    const newLabels = labels.filter(l => l.id !== id)
    try {
      await saveLabels.mutateAsync(newLabels)
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

              {/* Etiquetas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-600 text-[#9090A8]">Etiquetas</label>
                  <button
                    onClick={() => setManagingLabels(p => !p)}
                    className="flex items-center gap-1 text-[10px] text-[#5A5A70] hover:text-[#8B5CF6] transition-colors"
                  >
                    <Tag size={11} />
                    {managingLabels ? 'Fechar' : 'Gerenciar'}
                  </button>
                </div>

                {/* Chips de seleção — auto-salva ao clicar */}
                {labels.length === 0 && !managingLabels ? (
                  <p className="text-[10px] text-[#5A5A70]">
                    Nenhuma etiqueta criada. Clique em "Gerenciar" para criar.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {labels.map(lbl => {
                      const active = selectedLabelIds.includes(lbl.id)
                      return (
                        <button
                          key={lbl.id}
                          onClick={() => toggleLabel(lbl.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-600 border transition-all',
                            active
                              ? 'border-transparent text-white'
                              : 'border-[#22222E] bg-transparent hover:border-current'
                          )}
                          style={active
                            ? { backgroundColor: lbl.color }
                            : { color: lbl.color }
                          }
                        >
                          {active && <Check size={9} strokeWidth={3} />}
                          {lbl.name}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Gerenciador de etiquetas */}
                {managingLabels && (
                  <div className="bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3 space-y-3">
                    {/* Lista existente */}
                    {labels.map(lbl => (
                      <div key={lbl.id} className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: lbl.color }} />
                        <span className="flex-1 text-xs text-[#F0F0F8]">{lbl.name}</span>
                        <button
                          onClick={() => removeLabel(lbl.id)}
                          className="text-[#5A5A70] hover:text-[#EF4444] transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Adicionar nova etiqueta */}
                    <div className="pt-2 border-t border-[#22222E] space-y-2">
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
                          className="flex-1 bg-transparent text-xs text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none"
                        />
                        <button
                          onClick={addLabel}
                          disabled={!newLabelName.trim() || saveLabels.isPending}
                          className="text-[#5A5A70] hover:text-[#8B5CF6] disabled:opacity-30 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Cores predefinidas */}
                      <div className="flex gap-1.5 flex-wrap">
                        {LABEL_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setNewLabelColor(c)}
                            className={cn(
                              'w-5 h-5 rounded-full transition-all',
                              newLabelColor === c && 'ring-2 ring-offset-1 ring-offset-[#0A0A0F] ring-white scale-110'
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
