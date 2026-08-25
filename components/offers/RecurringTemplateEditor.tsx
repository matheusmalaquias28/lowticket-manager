'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TASK_CATEGORIES, ASSIGNEE_COLORS } from '@/lib/constants'
import { DAYS_OF_WEEK } from '@/lib/weeks'
import { createClient } from '@/lib/supabase/client'
import type { RecurringTemplate, AssigneeName, TaskCategory } from '@/lib/types'

interface RecurringTemplateEditorProps {
  open: boolean
  onClose: () => void
  offerId: string
  template?: RecurringTemplate | null
  onSaved: () => void
}

export function RecurringTemplateEditor({
  open,
  onClose,
  offerId,
  template,
  onSaved,
}: RecurringTemplateEditorProps) {
  const supabase = createClient()
  const isEditing = !!template

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [assignee, setAssignee] = useState<AssigneeName>('Matheus')
  const [category, setCategory] = useState<TaskCategory>('other')
  const [dueTime, setDueTime] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [checklistItems, setChecklistItems] = useState<{ text: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (template) {
      setTitle(template.title)
      setDescription(template.description ?? '')
      setDayOfWeek(template.day_of_week)
      setAssignee(template.assignee_name)
      setCategory(template.category)
      setDueTime(template.due_time ?? '')
      setIsActive(template.is_active)
      setChecklistItems(template.default_checklist)
    } else {
      setTitle('')
      setDescription('')
      setDayOfWeek(1)
      setAssignee('Matheus')
      setCategory('other')
      setDueTime('')
      setIsActive(true)
      setChecklistItems([])
    }
  }, [template, open])

  async function handleSave() {
    if (!title.trim()) { toast.error('Título obrigatório.'); return }
    setSaving(true)
    try {
      const payload = {
        offer_id: offerId,
        title: title.trim(),
        description: description || undefined,
        day_of_week: dayOfWeek,
        assignee_name: assignee,
        category,
        due_time: dueTime || undefined,
        is_active: isActive,
        default_checklist: checklistItems.filter(i => i.text.trim()),
      }
      if (isEditing && template) {
        const { error } = await supabase.from('recurring_templates').update(payload).eq('id', template.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('recurring_templates').insert(payload)
        if (error) throw error
      }
      toast.success(isEditing ? 'Template atualizado!' : 'Template criado!')
      onSaved()
      onClose()
    } catch {
      toast.error('Erro ao salvar template.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!template) return
    try {
      const { error } = await supabase.from('recurring_templates').delete().eq('id', template.id)
      if (error) throw error
      toast.success('Template excluído.')
      onSaved()
      onClose()
    } catch {
      toast.error('Erro ao excluir template.')
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
            className="relative w-full max-w-md bg-[#111118] rounded-2xl shadow-[0_0_0_1px_#22222E,0_20px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#22222E]">
              <h2 className="text-base font-700 text-[#F0F0F8]">
                {isEditing ? 'Editar template' : 'Novo template recorrente'}
              </h2>
              <button onClick={onClose} className="text-[#5A5A70] hover:text-[#F0F0F8] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Título *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Criar criativos da semana" className={inputClass} autoFocus />
              </div>

              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Descrição</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Detalhes..." className={cn(inputClass, 'resize-none')} />
              </div>

              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Responsável</label>
                <div className="flex gap-2">
                  {(['Matheus', 'Kauan'] as AssigneeName[]).map(name => (
                    <button
                      key={name}
                      onClick={() => setAssignee(name)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 border transition-all flex-1 justify-center',
                        assignee === name
                          ? 'border-[#7C3AED] bg-[#7C3AED1A] text-[#F0F0F8]'
                          : 'border-[#22222E] text-[#9090A8] hover:border-[#7C3AED40]'
                      )}
                    >
                      <div className="w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-700 text-white" style={{ backgroundColor: ASSIGNEE_COLORS[name] }}>
                        {name[0]}
                      </div>
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Dia da semana</label>
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map(d => (
                    <button
                      key={d.index}
                      onClick={() => setDayOfWeek(d.index)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-[10px] font-600 border transition-all',
                        dayOfWeek === d.index
                          ? 'border-[#7C3AED] bg-[#7C3AED1A] text-[#8B5CF6]'
                          : 'border-[#22222E] text-[#5A5A70] hover:border-[#7C3AED40]'
                      )}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Categoria</label>
                <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)} className={inputClass}>
                  {TASK_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Horário limite</label>
                <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className={inputClass} />
              </div>

              {/* Checklist padrão */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Checklist padrão</label>
                <div className="space-y-1">
                  {checklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.text}
                        onChange={e => setChecklistItems(prev => prev.map((i, ii) => ii === idx ? { text: e.target.value } : i))}
                        placeholder={`Item ${idx + 1}`}
                        className="flex-1 bg-[#0A0A0F] border border-[#22222E] rounded-lg px-3 py-2 text-xs text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED]"
                      />
                      <button onClick={() => setChecklistItems(prev => prev.filter((_, ii) => ii !== idx))} className="text-[#5A5A70] hover:text-[#EF4444] transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setChecklistItems(prev => [...prev, { text: '' }])}
                    className="flex items-center gap-1.5 text-xs text-[#5A5A70] hover:text-[#8B5CF6] transition-colors py-1"
                  >
                    <Plus size={14} />
                    Adicionar item
                  </button>
                </div>
              </div>

              {/* Ativo toggle */}
              <div className="flex items-center justify-between p-3 bg-[#0A0A0F] rounded-xl border border-[#22222E]">
                <span className="text-sm font-500 text-[#F0F0F8]">Template ativo</span>
                <button
                  onClick={() => setIsActive(prev => !prev)}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors',
                    isActive ? 'bg-[#7C3AED]' : 'bg-[#22222E]'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform',
                    isActive ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-[#22222E]">
              {isEditing ? (
                <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 text-[#EF4444] hover:bg-[#EF444420] transition-all">
                  <Trash2 size={14} />
                  Excluir
                </button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-600 text-[#9090A8] border border-[#22222E] hover:border-[#7C3AED40] transition-colors">
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
