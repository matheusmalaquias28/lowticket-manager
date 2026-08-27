'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Building2, CreditCard, Globe, AtSign } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useCreateBM, useUpdateBM, useDeleteBM,
  useCreateAdAccount, useUpdateAdAccount, useDeleteAdAccount,
  useCreateContingenciaPage, useUpdateContingenciaPage, useDeleteContingenciaPage,
  useCreateInstagram, useUpdateInstagram, useDeleteInstagram,
} from '@/hooks/useContingencia'
import type {
  ContingenciaBM, ContingenciaAdAccount, ContingenciaPage, ContingenciaInstagram,
  ContingenciaStatus, ContingenciaAccountType,
} from '@/lib/types'

export type ContingenciaModalType = 'bm' | 'ad_account' | 'page' | 'instagram'
export type ContingenciaRecord = ContingenciaBM | ContingenciaAdAccount | ContingenciaPage | ContingenciaInstagram

interface ContingenciaModalProps {
  open: boolean
  type: ContingenciaModalType
  record: ContingenciaRecord | null
  onClose: () => void
}

const STATUS_OPTIONS: { value: ContingenciaStatus; label: string; color: string }[] = [
  { value: 'active',     label: 'Ativa',       color: '#10B981' },
  { value: 'warming',    label: 'Aquecendo',   color: '#F59E0B' },
  { value: 'restricted', label: 'Restrita',    color: '#F97316' },
  { value: 'blocked',    label: 'Bloqueada',   color: '#EF4444' },
  { value: 'disabled',   label: 'Desativada',  color: '#64748B' },
]

const TYPE_CONFIG = {
  bm:         { label: 'Business Manager',    icon: Building2, color: '#7C3AED' },
  ad_account: { label: 'Conta de Anúncio',   icon: CreditCard, color: '#0EA5E9' },
  page:       { label: 'Página do Facebook', icon: Globe,     color: '#3B82F6' },
  instagram:  { label: 'Instagram',           icon: AtSign,    color: '#EC4899' },
}

interface BMForm {
  name: string; bm_id: string; admin_email: string
  status: ContingenciaStatus; ad_account_count: string; notes: string
}
interface AAForm {
  nickname: string; account_id: string; bm_id: string; status: ContingenciaStatus
  daily_limit: string; spend_limit: string; pixel_id: string; currency: string; country: string; notes: string
}
interface PageForm {
  name: string; page_id: string; page_url: string; niche: string
  bm_id: string; status: ContingenciaStatus; followers: string; notes: string
}
interface IGForm {
  username: string; profile_url: string; linked_page_id: string
  status: ContingenciaStatus; followers: string; account_type: ContingenciaAccountType; notes: string
}

const defaultBM: BMForm = { name: '', bm_id: '', admin_email: '', status: 'active', ad_account_count: '', notes: '' }
const defaultAA: AAForm = { nickname: '', account_id: '', bm_id: '', status: 'active', daily_limit: '', spend_limit: '', pixel_id: '', currency: 'BRL', country: 'BR', notes: '' }
const defaultPage: PageForm = { name: '', page_id: '', page_url: '', niche: '', bm_id: '', status: 'active', followers: '', notes: '' }
const defaultIG: IGForm = { username: '', profile_url: '', linked_page_id: '', status: 'active', followers: '', account_type: 'business', notes: '' }

const inputClass = 'w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl px-3 py-2.5 text-sm text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED] transition-colors'
const textareaClass = 'w-full bg-[#0A0A0F] border border-[#22222E] rounded-xl p-3 text-sm text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none focus:border-[#7C3AED] resize-none leading-relaxed transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-600 text-[#9090A8] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function ContingenciaModal({ open, type, record, onClose }: ContingenciaModalProps) {
  const cfg = TYPE_CONFIG[type]
  const isNew = !record

  const createBM = useCreateBM()
  const updateBM = useUpdateBM()
  const deleteBM = useDeleteBM()
  const createAA = useCreateAdAccount()
  const updateAA = useUpdateAdAccount()
  const deleteAA = useDeleteAdAccount()
  const createPage = useCreateContingenciaPage()
  const updatePage = useUpdateContingenciaPage()
  const deletePage = useDeleteContingenciaPage()
  const createIG = useCreateInstagram()
  const updateIG = useUpdateInstagram()
  const deleteIG = useDeleteInstagram()

  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [bmForm, setBMForm] = useState<BMForm>(defaultBM)
  const [aaForm, setAAForm] = useState<AAForm>(defaultAA)
  const [pageForm, setPageForm] = useState<PageForm>(defaultPage)
  const [igForm, setIGForm] = useState<IGForm>(defaultIG)

  useEffect(() => {
    if (!open) return
    setConfirmDelete(false)
    if (!record) {
      setBMForm(defaultBM)
      setAAForm(defaultAA)
      setPageForm(defaultPage)
      setIGForm(defaultIG)
      return
    }
    if (type === 'bm') {
      const r = record as ContingenciaBM
      setBMForm({ name: r.name, bm_id: r.bm_id ?? '', admin_email: r.admin_email ?? '', status: r.status, ad_account_count: r.ad_account_count?.toString() ?? '', notes: r.notes ?? '' })
    } else if (type === 'ad_account') {
      const r = record as ContingenciaAdAccount
      setAAForm({ nickname: r.nickname, account_id: r.account_id ?? '', bm_id: r.bm_id ?? '', status: r.status, daily_limit: r.daily_limit?.toString() ?? '', spend_limit: r.spend_limit?.toString() ?? '', pixel_id: r.pixel_id ?? '', currency: r.currency ?? 'BRL', country: r.country ?? 'BR', notes: r.notes ?? '' })
    } else if (type === 'page') {
      const r = record as ContingenciaPage
      setPageForm({ name: r.name, page_id: r.page_id ?? '', page_url: r.page_url ?? '', niche: r.niche ?? '', bm_id: r.bm_id ?? '', status: r.status, followers: r.followers?.toString() ?? '', notes: r.notes ?? '' })
    } else {
      const r = record as ContingenciaInstagram
      setIGForm({ username: r.username, profile_url: r.profile_url ?? '', linked_page_id: r.linked_page_id ?? '', status: r.status, followers: r.followers?.toString() ?? '', account_type: r.account_type ?? 'business', notes: r.notes ?? '' })
    }
  }, [open, record, type])

  const currentStatus: ContingenciaStatus =
    type === 'bm' ? bmForm.status :
    type === 'ad_account' ? aaForm.status :
    type === 'page' ? pageForm.status :
    igForm.status

  function setStatus(s: ContingenciaStatus) {
    if (type === 'bm') setBMForm(f => ({ ...f, status: s }))
    else if (type === 'ad_account') setAAForm(f => ({ ...f, status: s }))
    else if (type === 'page') setPageForm(f => ({ ...f, status: s }))
    else setIGForm(f => ({ ...f, status: s }))
  }

  const canSave =
    type === 'bm' ? !!bmForm.name.trim() :
    type === 'ad_account' ? !!aaForm.nickname.trim() :
    type === 'page' ? !!pageForm.name.trim() :
    !!igForm.username.trim()

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      if (type === 'bm') {
        const payload = {
          name: bmForm.name.trim(),
          bm_id: bmForm.bm_id || undefined,
          admin_email: bmForm.admin_email || undefined,
          status: bmForm.status,
          ad_account_count: bmForm.ad_account_count ? parseInt(bmForm.ad_account_count) : undefined,
          notes: bmForm.notes || undefined,
        }
        isNew ? await createBM.mutateAsync(payload) : await updateBM.mutateAsync({ id: (record as ContingenciaBM).id, ...payload })
      } else if (type === 'ad_account') {
        const payload = {
          nickname: aaForm.nickname.trim(),
          account_id: aaForm.account_id || undefined,
          bm_id: aaForm.bm_id || undefined,
          status: aaForm.status,
          daily_limit: aaForm.daily_limit ? parseFloat(aaForm.daily_limit) : undefined,
          spend_limit: aaForm.spend_limit ? parseFloat(aaForm.spend_limit) : undefined,
          pixel_id: aaForm.pixel_id || undefined,
          currency: aaForm.currency || 'BRL',
          country: aaForm.country || 'BR',
          notes: aaForm.notes || undefined,
        }
        isNew ? await createAA.mutateAsync(payload) : await updateAA.mutateAsync({ id: (record as ContingenciaAdAccount).id, ...payload })
      } else if (type === 'page') {
        const payload = {
          name: pageForm.name.trim(),
          page_id: pageForm.page_id || undefined,
          page_url: pageForm.page_url || undefined,
          niche: pageForm.niche || undefined,
          bm_id: pageForm.bm_id || undefined,
          status: pageForm.status,
          followers: pageForm.followers ? parseInt(pageForm.followers) : undefined,
          notes: pageForm.notes || undefined,
        }
        isNew ? await createPage.mutateAsync(payload) : await updatePage.mutateAsync({ id: (record as ContingenciaPage).id, ...payload })
      } else {
        const payload = {
          username: igForm.username.trim().replace('@', ''),
          profile_url: igForm.profile_url || undefined,
          linked_page_id: igForm.linked_page_id || undefined,
          status: igForm.status,
          followers: igForm.followers ? parseInt(igForm.followers) : undefined,
          account_type: igForm.account_type,
          notes: igForm.notes || undefined,
        }
        isNew ? await createIG.mutateAsync(payload) : await updateIG.mutateAsync({ id: (record as ContingenciaInstagram).id, ...payload })
      }
      toast.success(isNew ? 'Cadastro criado!' : 'Atualizado com sucesso!')
      onClose()
    } catch {
      toast.error('Erro ao salvar. Verifique as tabelas no Supabase.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!record) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      if (type === 'bm') await deleteBM.mutateAsync((record as ContingenciaBM).id)
      else if (type === 'ad_account') await deleteAA.mutateAsync((record as ContingenciaAdAccount).id)
      else if (type === 'page') await deletePage.mutateAsync((record as ContingenciaPage).id)
      else await deleteIG.mutateAsync((record as ContingenciaInstagram).id)
      toast.success('Excluído.')
      onClose()
    } catch {
      toast.error('Erro ao excluir.')
    }
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
            className="relative w-full max-w-lg bg-[#111118] rounded-2xl shadow-[0_0_0_1px_#22222E,0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Accent bar */}
            <div className="h-1 w-full" style={{ backgroundColor: cfg.color }} />

            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-[#22222E]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cfg.color}20` }}>
                <cfg.icon size={15} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#5A5A70] font-600 uppercase tracking-wider">{cfg.label}</p>
                <p className="text-sm font-700 text-[#F0F0F8]">{isNew ? 'Novo cadastro' : 'Editar cadastro'}</p>
              </div>
              <button onClick={onClose} className="text-[#5A5A70] hover:text-[#F0F0F8] transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Status - shared */}
              <div>
                <label className="block text-xs font-600 text-[#9090A8] mb-2">Status</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(opt => {
                    const selected = currentStatus === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(opt.value)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-600 transition-all border',
                          selected ? 'border-transparent' : 'border-[#22222E] text-[#9090A8] hover:border-[#7C3AED40]'
                        )}
                        style={selected ? { backgroundColor: `${opt.color}20`, color: opt.color, borderColor: `${opt.color}50` } : {}}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opt.color }} />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* BM Fields */}
              {type === 'bm' && (
                <>
                  <Field label="Nome do BM *">
                    <input autoFocus value={bmForm.name} onChange={e => setBMForm(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="Ex: BM Principal" className={inputClass} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ID do BM">
                      <input value={bmForm.bm_id} onChange={e => setBMForm(f => ({ ...f, bm_id: e.target.value }))} placeholder="123456789" className={inputClass} />
                    </Field>
                    <Field label="Qtd de contas">
                      <input type="number" min="0" value={bmForm.ad_account_count} onChange={e => setBMForm(f => ({ ...f, ad_account_count: e.target.value }))} placeholder="0" className={inputClass} />
                    </Field>
                  </div>
                  <Field label="E-mail admin">
                    <input type="email" value={bmForm.admin_email} onChange={e => setBMForm(f => ({ ...f, admin_email: e.target.value }))} placeholder="admin@dominio.com" className={inputClass} />
                  </Field>
                  <Field label="Observações">
                    <textarea rows={3} value={bmForm.notes} onChange={e => setBMForm(f => ({ ...f, notes: e.target.value }))} placeholder="Histórico, políticas, observações..." className={textareaClass} />
                  </Field>
                </>
              )}

              {/* Ad Account Fields */}
              {type === 'ad_account' && (
                <>
                  <Field label="Apelido / Nome *">
                    <input autoFocus value={aaForm.nickname} onChange={e => setAAForm(f => ({ ...f, nickname: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="Ex: Conta BR Principal" className={inputClass} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ID da conta">
                      <input value={aaForm.account_id} onChange={e => setAAForm(f => ({ ...f, account_id: e.target.value }))} placeholder="act_123456789" className={inputClass} />
                    </Field>
                    <Field label="BM vinculada">
                      <input value={aaForm.bm_id} onChange={e => setAAForm(f => ({ ...f, bm_id: e.target.value }))} placeholder="ID ou nome do BM" className={inputClass} />
                    </Field>
                  </div>
                  <Field label="ID do Pixel">
                    <input value={aaForm.pixel_id} onChange={e => setAAForm(f => ({ ...f, pixel_id: e.target.value }))} placeholder="ID do Pixel vinculado" className={inputClass} />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Limite diário (R$)">
                      <input type="number" min="0" value={aaForm.daily_limit} onChange={e => setAAForm(f => ({ ...f, daily_limit: e.target.value }))} placeholder="200" className={inputClass} />
                    </Field>
                    <Field label="Limite total (R$)">
                      <input type="number" min="0" value={aaForm.spend_limit} onChange={e => setAAForm(f => ({ ...f, spend_limit: e.target.value }))} placeholder="0" className={inputClass} />
                    </Field>
                    <Field label="Moeda">
                      <select value={aaForm.currency} onChange={e => setAAForm(f => ({ ...f, currency: e.target.value }))} className={inputClass}>
                        <option value="BRL">BRL</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="País">
                    <input value={aaForm.country} onChange={e => setAAForm(f => ({ ...f, country: e.target.value }))} placeholder="BR" className={inputClass} />
                  </Field>
                  <Field label="Observações">
                    <textarea rows={3} value={aaForm.notes} onChange={e => setAAForm(f => ({ ...f, notes: e.target.value }))} placeholder="Histórico de bloqueios, observações..." className={textareaClass} />
                  </Field>
                </>
              )}

              {/* Page Fields */}
              {type === 'page' && (
                <>
                  <Field label="Nome da página *">
                    <input autoFocus value={pageForm.name} onChange={e => setPageForm(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="Ex: Página de Vendas" className={inputClass} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ID da página">
                      <input value={pageForm.page_id} onChange={e => setPageForm(f => ({ ...f, page_id: e.target.value }))} placeholder="123456789" className={inputClass} />
                    </Field>
                    <Field label="BM vinculada">
                      <input value={pageForm.bm_id} onChange={e => setPageForm(f => ({ ...f, bm_id: e.target.value }))} placeholder="ID ou nome do BM" className={inputClass} />
                    </Field>
                  </div>
                  <Field label="URL da página">
                    <input type="url" value={pageForm.page_url} onChange={e => setPageForm(f => ({ ...f, page_url: e.target.value }))} placeholder="https://facebook.com/nomepagina" className={inputClass} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nicho">
                      <input value={pageForm.niche} onChange={e => setPageForm(f => ({ ...f, niche: e.target.value }))} placeholder="Ex: Saúde, Moda..." className={inputClass} />
                    </Field>
                    <Field label="Seguidores">
                      <input type="number" min="0" value={pageForm.followers} onChange={e => setPageForm(f => ({ ...f, followers: e.target.value }))} placeholder="0" className={inputClass} />
                    </Field>
                  </div>
                  <Field label="Observações">
                    <textarea rows={3} value={pageForm.notes} onChange={e => setPageForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas sobre esta página..." className={textareaClass} />
                  </Field>
                </>
              )}

              {/* Instagram Fields */}
              {type === 'instagram' && (
                <>
                  <Field label="Username *">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A70] text-sm font-600">@</span>
                      <input
                        autoFocus
                        value={igForm.username}
                        onChange={e => setIGForm(f => ({ ...f, username: e.target.value.replace('@', '') }))}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        placeholder="usuario"
                        className={`${inputClass} pl-7`}
                      />
                    </div>
                  </Field>
                  <Field label="Tipo de conta">
                    <div className="flex gap-2">
                      {([['personal', 'Pessoal'], ['business', 'Negócios'], ['creator', 'Criador']] as const).map(([val, lbl]) => (
                        <button
                          key={val}
                          onClick={() => setIGForm(f => ({ ...f, account_type: val }))}
                          className={cn(
                            'flex-1 py-2 rounded-xl text-xs font-600 transition-all border',
                            igForm.account_type === val
                              ? 'bg-[#EC489920] text-[#EC4899] border-[#EC489940]'
                              : 'text-[#9090A8] border-[#22222E] hover:border-[#EC489920]'
                          )}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Página vinculada">
                      <input value={igForm.linked_page_id} onChange={e => setIGForm(f => ({ ...f, linked_page_id: e.target.value }))} placeholder="ID ou nome da página" className={inputClass} />
                    </Field>
                    <Field label="Seguidores">
                      <input type="number" min="0" value={igForm.followers} onChange={e => setIGForm(f => ({ ...f, followers: e.target.value }))} placeholder="0" className={inputClass} />
                    </Field>
                  </div>
                  <Field label="URL do perfil">
                    <input type="url" value={igForm.profile_url} onChange={e => setIGForm(f => ({ ...f, profile_url: e.target.value }))} placeholder="https://instagram.com/usuario" className={inputClass} />
                  </Field>
                  <Field label="Observações">
                    <textarea rows={3} value={igForm.notes} onChange={e => setIGForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas sobre esta conta..." className={textareaClass} />
                  </Field>
                </>
              )}
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
                  {confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
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
                  disabled={saving || !canSave}
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
