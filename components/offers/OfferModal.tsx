'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { OFFER_STATUSES, DEFAULT_OFFER_EMOJIS, DEFAULT_OFFER_CHECKLIST_ITEMS } from '@/lib/constants'
import { useCreateOffer, useUpdateOffer } from '@/hooks/useOffers'
import { logActivity } from '@/lib/activity'
import { useCreateTask } from '@/hooks/useTasks'
import { getWeekKey } from '@/lib/weeks'
import type { Offer, OfferStatus } from '@/lib/types'

interface OfferModalProps {
  open: boolean
  onClose: () => void
  offer?: Offer | null
  currentUserId: string
  weekKey?: string
}

const COLORS = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

export function OfferModal({ open, onClose, offer, currentUserId, weekKey }: OfferModalProps) {
  const isEditing = !!offer
  const createOffer = useCreateOffer()
  const updateOffer = useUpdateOffer()
  const createTask = useCreateTask()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [color, setColor] = useState('#7C3AED')
  const [niche, setNiche] = useState('')
  const [status, setStatus] = useState<OfferStatus>('draft')
  const [lpUrl, setLpUrl] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [pixelId, setPixelId] = useState('')
  const [weeklyBudget, setWeeklyBudget] = useState('')
  const [notes, setNotes] = useState('')
  const [createDefaultTasks, setCreateDefaultTasks] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (offer) {
      setName(offer.name)
      setEmoji(offer.emoji)
      setColor(offer.color)
      setNiche(offer.niche ?? '')
      setStatus(offer.status)
      setLpUrl(offer.lp_url ?? '')
      setCheckoutUrl(offer.checkout_url ?? '')
      setPixelId(offer.pixel_id ?? '')
      setWeeklyBudget(offer.weekly_budget?.toString() ?? '')
      setNotes(offer.notes ?? '')
    } else {
      setName('')
      setEmoji('🎯')
      setColor('#7C3AED')
      setNiche('')
      setStatus('draft')
      setLpUrl('')
      setCheckoutUrl('')
      setPixelId('')
      setWeeklyBudget('')
      setNotes('')
    }
    setCreateDefaultTasks(true)
  }, [offer, open])

  async function handleSave() {
    if (!name.trim()) { toast.error('Nome obrigatório.'); return }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        emoji,
        color,
        niche: niche || undefined,
        status,
        lp_url: lpUrl || undefined,
        checkout_url: checkoutUrl || undefined,
        pixel_id: pixelId || undefined,
        weekly_budget: weeklyBudget ? parseFloat(weeklyBudget) : undefined,
        notes: notes || undefined,
      }

      if (isEditing && offer) {
        await updateOffer.mutateAsync({ id: offer.id, ...payload })
        toast.success('Oferta atualizada!')
        logActivity({ action: 'offer_updated', title: `Oferta atualizada: "${payload.name}"`, entity_type: 'offer', entity_id: offer.id })
      } else {
        const newOffer = await createOffer.mutateAsync({ ...payload, created_by: currentUserId })
        logActivity({ action: 'offer_created', title: `Nova oferta criada: "${payload.name}"`, entity_type: 'offer', entity_id: newOffer?.id })

        if (createDefaultTasks && newOffer?.id) {
          const wk = weekKey ?? getWeekKey()
          const checklist = DEFAULT_OFFER_CHECKLIST_ITEMS.map((text, i) => ({
            id: `cl_${Date.now()}_${i}`,
            text,
            done: false,
          }))
          await createTask.mutateAsync({
            title: `Lançamento — ${name.trim()}`,
            status: 'pending',
            assignee_name: 'Matheus',
            category: 'offer_conception',
            day_of_week: 1,
            week_key: wk,
            offer_id: newOffer.id,
            checklist,
            links: [],
            created_by: currentUserId,
          })
          toast.success(`Oferta criada com checklist de ${DEFAULT_OFFER_CHECKLIST_ITEMS.length} itens!`)
        } else {
          toast.success('Oferta criada!')
        }
      }

      onClose()
    } catch {
      toast.error('Erro ao salvar oferta.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = cn(
    'w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl px-3 py-2.5',
    'text-sm text-[#F0F0F8] placeholder:text-[#5A5A70]',
    'focus:outline-none focus:border-[#7C3AED] transition-colors'
  )

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            <div className="flex items-center justify-between p-5 border-b border-[#22222E]">
              <h2 className="text-base font-700 text-[#F0F0F8]">
                {isEditing ? 'Editar oferta' : 'Nova oferta'}
              </h2>
              <button onClick={onClose} className="text-[#5A5A70] hover:text-[#F0F0F8] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Emoji + Nome */}
              <div className="flex gap-3">
                <div>
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Emoji</label>
                  <div className="flex flex-wrap gap-1 w-40">
                    {DEFAULT_OFFER_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setEmoji(e)}
                        className={cn(
                          'w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all',
                          emoji === e ? 'bg-[#7C3AED1A] ring-1 ring-[#7C3AED]' : 'hover:bg-[#1A1A24]'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Nome *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da oferta" className={inputClass} autoFocus />
                  <label className="block text-xs font-600 text-[#9090A8] mb-2 mt-3">Nicho</label>
                  <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex: Saúde, Educação..." className={inputClass} />
                </div>
              </div>

              {/* Cor */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Cor</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all',
                        color === c && 'ring-2 ring-offset-2 ring-offset-[#111118] ring-white'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as OfferStatus)} className={inputClass}>
                  {OFFER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* URLs */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">URL da LP</label>
                <input type="url" value={lpUrl} onChange={e => setLpUrl(e.target.value)} placeholder="https://..." className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">URL do Checkout</label>
                <input type="url" value={checkoutUrl} onChange={e => setCheckoutUrl(e.target.value)} placeholder="https://..." className={inputClass} />
              </div>

              {/* Pixel + Budget */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Pixel ID</label>
                  <input value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="1234567890" className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-600 text-[#9090A8] mb-2">Orçamento semanal (R$)</label>
                  <input type="number" value={weeklyBudget} onChange={e => setWeeklyBudget(e.target.value)} placeholder="0,00" className={inputClass} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Notas</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Observações gerais..." className={cn(inputClass, 'resize-none')} />
              </div>

              {/* Tarefas padrão — apenas ao criar */}
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setCreateDefaultTasks(prev => !prev)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                    createDefaultTasks
                      ? 'border-[#7C3AED] bg-[#7C3AED0D]'
                      : 'border-[#22222E] hover:border-[#7C3AED40]'
                  )}
                >
                  <CheckSquare
                    size={16}
                    className={createDefaultTasks ? 'text-[#8B5CF6]' : 'text-[#5A5A70]'}
                  />
                  <div className="text-left">
                    <p className={cn('text-xs font-600', createDefaultTasks ? 'text-[#F0F0F8]' : 'text-[#9090A8]')}>
                      Criar tarefas padrão
                    </p>
                    <p className="text-[10px] text-[#5A5A70]">
                      1 card com 19 checklists de lançamento
                    </p>
                  </div>
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-[#22222E]">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-600 text-[#9090A8] hover:text-[#F0F0F8] border border-[#22222E] hover:border-[#7C3AED40] transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
