'use client'

import { useState } from 'react'
import { Plus, Building2, CreditCard, Globe, AtSign, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { ContingenciaModal, type ContingenciaModalType, type ContingenciaRecord } from '@/components/contingencia/ContingenciaModal'
import {
  useContingenciaBMs,
  useContingenciaAdAccounts,
  useContingenciaPages,
  useContingenciaInstagrams,
} from '@/hooks/useContingencia'
import { cn } from '@/lib/utils'
import type {
  ContingenciaBM, ContingenciaAdAccount,
  ContingenciaPage, ContingenciaInstagram, ContingenciaStatus,
} from '@/lib/types'

type Tab = 'ad_accounts' | 'bms' | 'pages' | 'instagrams'

const STATUS_CFG: Record<ContingenciaStatus, { label: string; color: string; bg: string }> = {
  active:     { label: 'Ativa',      color: '#10B981', bg: '#10B98118' },
  blocked:    { label: 'Bloqueada',  color: '#EF4444', bg: '#EF444418' },
  warming:    { label: 'Aquecendo',  color: '#F59E0B', bg: '#F59E0B18' },
  disabled:   { label: 'Desativada', color: '#64748B', bg: '#64748B18' },
  restricted: { label: 'Restrita',   color: '#F97316', bg: '#F9731618' },
}

function StatusBadge({ status }: { status: ContingenciaStatus }) {
  const cfg = STATUS_CFG[status]
  return (
    <span className="flex items-center gap-1 text-[10px] font-600 px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function fmt(n?: number) {
  if (!n) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toString()
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function BMCard({ bm, onClick }: { bm: ContingenciaBM; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-[#111118] rounded-2xl border border-[#22222E] hover:border-[#7C3AED40] overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.08)] active:scale-[0.99] p-4 group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#7C3AED20]">
            <Building2 size={14} className="text-[#8B5CF6]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-700 text-[#F0F0F8] group-hover:text-white transition-colors truncate">{bm.name}</h3>
            {bm.bm_id && <p className="text-[10px] text-[#5A5A70]">ID: {bm.bm_id}</p>}
          </div>
        </div>
        <StatusBadge status={bm.status} />
      </div>
      {bm.admin_email && <p className="text-[11px] text-[#9090A8] truncate mb-2">{bm.admin_email}</p>}
      {(bm.ad_account_count != null || bm.notes) && (
        <div className="mt-2 pt-2 border-t border-[#22222E] flex items-center gap-3">
          {bm.ad_account_count != null && (
            <span className="text-[10px] text-[#5A5A70]">{bm.ad_account_count} {bm.ad_account_count === 1 ? 'conta' : 'contas'}</span>
          )}
          {bm.notes && <span className="text-[10px] text-[#5A5A70] line-clamp-1 flex-1">{bm.notes}</span>}
        </div>
      )}
    </button>
  )
}

function AdAccountCard({ acc, onClick }: { acc: ContingenciaAdAccount; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-[#111118] rounded-2xl border border-[#22222E] hover:border-[#0EA5E940] overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(14,165,233,0.08)] active:scale-[0.99] p-4 group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#0EA5E920]">
            <CreditCard size={14} className="text-[#0EA5E9]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-700 text-[#F0F0F8] group-hover:text-white transition-colors truncate">{acc.nickname}</h3>
            {acc.account_id && <p className="text-[10px] text-[#5A5A70] truncate">{acc.account_id}</p>}
          </div>
        </div>
        <StatusBadge status={acc.status} />
      </div>
      <div className="space-y-1">
        {acc.bm_id && <p className="text-[11px] text-[#9090A8]">BM: <span className="text-[#C0C0D8]">{acc.bm_id}</span></p>}
        {acc.pixel_id && <p className="text-[11px] text-[#9090A8]">Pixel: <span className="text-[#C0C0D8]">{acc.pixel_id}</span></p>}
      </div>
      {(acc.daily_limit || acc.spend_limit) && (
        <div className="mt-2 pt-2 border-t border-[#22222E] flex items-center gap-3">
          {acc.daily_limit != null && <span className="text-[10px] text-[#5A5A70]">R$ {acc.daily_limit}/dia</span>}
          {acc.spend_limit != null && <span className="text-[10px] text-[#5A5A70]">Limite: R$ {acc.spend_limit}</span>}
          {acc.currency && acc.currency !== 'BRL' && <span className="text-[10px] text-[#5A5A70]">{acc.currency}</span>}
        </div>
      )}
    </button>
  )
}

function PageCard({ page, onClick }: { page: ContingenciaPage; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-[#111118] rounded-2xl border border-[#22222E] hover:border-[#3B82F640] overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.08)] active:scale-[0.99] p-4 group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#3B82F620]">
            <Globe size={14} className="text-[#3B82F6]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-700 text-[#F0F0F8] group-hover:text-white transition-colors truncate">{page.name}</h3>
            {page.page_id && <p className="text-[10px] text-[#5A5A70]">ID: {page.page_id}</p>}
          </div>
        </div>
        <StatusBadge status={page.status} />
      </div>
      <div className="space-y-1">
        {page.niche && <p className="text-[11px] text-[#9090A8]">Nicho: <span className="text-[#C0C0D8]">{page.niche}</span></p>}
        {page.bm_id && <p className="text-[11px] text-[#9090A8]">BM: <span className="text-[#C0C0D8]">{page.bm_id}</span></p>}
      </div>
      {(page.followers || page.page_url) && (
        <div className="mt-2 pt-2 border-t border-[#22222E] flex items-center gap-3">
          {page.followers != null && <span className="text-[10px] text-[#5A5A70]">{fmt(page.followers)} seguidores</span>}
          {page.page_url && (
            <span className="flex items-center gap-1 text-[10px] text-[#3B82F6]">
              <ExternalLink size={10} />
              Ver página
            </span>
          )}
        </div>
      )}
    </button>
  )
}

const IG_ACCOUNT_TYPE: Record<string, string> = { personal: 'Pessoal', business: 'Negócios', creator: 'Criador' }

function InstagramCard({ ig, onClick }: { ig: ContingenciaInstagram; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-[#111118] rounded-2xl border border-[#22222E] hover:border-[#EC489940] overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.08)] active:scale-[0.99] p-4 group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#EC489920]">
            <AtSign size={14} className="text-[#EC4899]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-700 text-[#F0F0F8] group-hover:text-white transition-colors">@{ig.username}</h3>
            {ig.account_type && <p className="text-[10px] text-[#5A5A70]">{IG_ACCOUNT_TYPE[ig.account_type]}</p>}
          </div>
        </div>
        <StatusBadge status={ig.status} />
      </div>
      {ig.linked_page_id && <p className="text-[11px] text-[#9090A8]">Página: <span className="text-[#C0C0D8]">{ig.linked_page_id}</span></p>}
      {ig.followers != null && (
        <div className="mt-2 pt-2 border-t border-[#22222E]">
          <span className="text-[10px] text-[#5A5A70]">{fmt(ig.followers)} seguidores</span>
        </div>
      )}
      {ig.notes && !ig.followers && (
        <div className="mt-2 pt-2 border-t border-[#22222E]">
          <span className="text-[10px] text-[#5A5A70] line-clamp-1">{ig.notes}</span>
        </div>
      )}
    </button>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EMPTY_CFG = {
  ad_accounts: { icon: CreditCard, title: 'Nenhuma conta de anúncio',   desc: 'Cadastre contas para rastrear status, limites e pixels',       btn: 'Nova conta' },
  bms:         { icon: Building2,  title: 'Nenhum Business Manager',     desc: 'Cadastre seus BMs para organizar contas e ativos',             btn: 'Novo BM' },
  pages:       { icon: Globe,      title: 'Nenhuma página cadastrada',    desc: 'Cadastre páginas do Facebook e gerencie o status delas',       btn: 'Nova página' },
  instagrams:  { icon: AtSign,     title: 'Nenhum Instagram cadastrado',  desc: 'Cadastre contas do Instagram e acompanhe aquecimento e status', btn: 'Novo Instagram' },
}

function EmptyState({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const cfg = EMPTY_CFG[tab]
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[380px] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[#111118] border border-[#22222E] flex items-center justify-center">
        <cfg.icon size={28} className="text-[#5A5A70]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-600 text-[#9090A8]">{cfg.title}</p>
        <p className="text-xs text-[#5A5A70] mt-1 max-w-xs">{cfg.desc}</p>
      </div>
      <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors">
        <Plus size={15} />
        {cfg.btn}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ContingenciaPageClient() {
  const [activeTab, setActiveTab] = useState<Tab>('ad_accounts')
  const [statusFilter, setStatusFilter] = useState<ContingenciaStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<ContingenciaModalType>('ad_account')
  const [selectedRecord, setSelectedRecord] = useState<ContingenciaRecord | null>(null)

  const { data: bms = [] }         = useContingenciaBMs()
  const { data: adAccounts = [] }  = useContingenciaAdAccounts()
  const { data: pages = [] }       = useContingenciaPages()
  const { data: instagrams = [] }  = useContingenciaInstagrams()

  const TAB_TYPE_MAP: Record<Tab, ContingenciaModalType> = {
    ad_accounts: 'ad_account',
    bms: 'bm',
    pages: 'page',
    instagrams: 'instagram',
  }

  const ADD_LABEL: Record<Tab, string> = {
    ad_accounts: 'Nova conta',
    bms: 'Novo BM',
    pages: 'Nova página',
    instagrams: 'Novo Instagram',
  }

  const currentData: ContingenciaRecord[] =
    activeTab === 'ad_accounts' ? adAccounts :
    activeTab === 'bms' ? bms :
    activeTab === 'pages' ? pages :
    instagrams

  const filteredData = statusFilter === 'all'
    ? currentData
    : currentData.filter(item => (item as any).status === statusFilter)

  const statusCounts = Object.fromEntries(
    (Object.keys(STATUS_CFG) as ContingenciaStatus[]).map(s => [
      s,
      currentData.filter(i => (i as any).status === s).length,
    ])
  ) as Record<ContingenciaStatus, number>

  function openNew() {
    setSelectedRecord(null)
    setModalType(TAB_TYPE_MAP[activeTab])
    setModalOpen(true)
  }

  function openEdit(type: ContingenciaModalType, record: ContingenciaRecord) {
    setSelectedRecord(record)
    setModalType(type)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedRecord(null)
  }

  function changeTab(tab: Tab) {
    setActiveTab(tab)
    setStatusFilter('all')
  }

  const tabs = [
    { id: 'ad_accounts' as Tab, label: 'Contas de Anúncio', icon: CreditCard, count: adAccounts.length },
    { id: 'bms'         as Tab, label: 'Business Managers', icon: Building2,  count: bms.length },
    { id: 'pages'       as Tab, label: 'Páginas',           icon: Globe,      count: pages.length },
    { id: 'instagrams'  as Tab, label: 'Instagram',          icon: AtSign,     count: instagrams.length },
  ]

  return (
    <>
      <Header title="Contingência">
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors active:scale-[0.98]"
        >
          <Plus size={14} />
          {ADD_LABEL[activeTab]}
        </button>
      </Header>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-5 py-2.5 border-b border-[#22222E] bg-[#111118] overflow-x-auto shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => changeTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-600 transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-[#7C3AED1A] text-[#8B5CF6]'
                : 'text-[#9090A8] hover:bg-[#1A1A24] hover:text-[#F0F0F8]'
            )}
          >
            <tab.icon size={13} />
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-700',
                activeTab === tab.id ? 'bg-[#7C3AED40] text-[#8B5CF6]' : 'bg-[#1A1A24] text-[#5A5A70]'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Status stats row */}
        <div className="grid grid-cols-5 gap-3">
          {(Object.entries(STATUS_CFG) as [ContingenciaStatus, typeof STATUS_CFG['active']][]).map(([key, cfg]) => {
            const count = statusCounts[key]
            const isActive = statusFilter === key
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(isActive ? 'all' : key)}
                className={cn(
                  'p-3 rounded-xl border transition-all text-left group',
                  isActive
                    ? 'border-[#7C3AED40] bg-[#7C3AED0A]'
                    : 'border-[#22222E] bg-[#111118] hover:border-[#7C3AED20]'
                )}
              >
                <div className="text-xl font-800 leading-none mb-1" style={{ color: count > 0 ? cfg.color : '#5A5A70' }}>
                  {count}
                </div>
                <div className="text-[10px] font-600 text-[#9090A8]">{cfg.label}</div>
              </button>
            )
          })}
        </div>

        {/* Content grid */}
        {filteredData.length === 0 && statusFilter === 'all' ? (
          <EmptyState tab={activeTab} onAdd={openNew} />
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
            <p className="text-sm text-[#9090A8]">Nenhum item com status "{STATUS_CFG[statusFilter as ContingenciaStatus]?.label}"</p>
            <button onClick={() => setStatusFilter('all')} className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
              Limpar filtro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((item, i) => (
              <motion.div
                key={(item as any).id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                {activeTab === 'bms' && (
                  <BMCard bm={item as ContingenciaBM} onClick={() => openEdit('bm', item)} />
                )}
                {activeTab === 'ad_accounts' && (
                  <AdAccountCard acc={item as ContingenciaAdAccount} onClick={() => openEdit('ad_account', item)} />
                )}
                {activeTab === 'pages' && (
                  <PageCard page={item as ContingenciaPage} onClick={() => openEdit('page', item)} />
                )}
                {activeTab === 'instagrams' && (
                  <InstagramCard ig={item as ContingenciaInstagram} onClick={() => openEdit('instagram', item)} />
                )}
              </motion.div>
            ))}

            {/* Add new card */}
            <button
              onClick={openNew}
              className="flex flex-col items-center justify-center gap-2 min-h-[120px] rounded-2xl border-2 border-dashed border-[#22222E] hover:border-[#7C3AED40] text-[#5A5A70] hover:text-[#8B5CF6] transition-all"
            >
              <Plus size={20} />
              <span className="text-xs font-600">{ADD_LABEL[activeTab]}</span>
            </button>
          </div>
        )}
      </div>

      <ContingenciaModal
        open={modalOpen}
        type={modalType}
        record={selectedRecord}
        onClose={closeModal}
      />
    </>
  )
}
