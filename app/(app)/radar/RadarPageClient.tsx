'use client'

import { useState } from 'react'
import {
  Radar, Plus, Trash2, ExternalLink, ChevronDown, ChevronUp,
  Search, Tag, TrendingUp, CheckCircle2, Clock,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  useRadarKeywords, useRadarOfertas,
  useCreateRadarKeyword, useToggleRadarKeyword, useDeleteRadarKeyword,
  useUpdateRadarOfertaStatus, useDeleteRadarOferta,
} from '@/hooks/useRadar'
import type { RadarOferta, RadarOfertaStatus } from '@/lib/types'

type Tab = 'keywords' | 'ofertas'

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<RadarOfertaStatus, { label: string; color: string; bg: string }> = {
  novo:        { label: 'Novo',        color: '#7C3AED', bg: '#7C3AED18' },
  analisando:  { label: 'Analisando',  color: '#F59E0B', bg: '#F59E0B18' },
  aprovado:    { label: 'Aprovado',    color: '#10B981', bg: '#10B98118' },
  descartado:  { label: 'Descartado',  color: '#64748B', bg: '#64748B18' },
}

const STATUS_ORDER: RadarOfertaStatus[] = ['novo', 'analisando', 'aprovado', 'descartado']

// ─── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 9 ? '#7C3AED' : score >= 8 ? '#10B981' : '#F59E0B'
  const bg    = score >= 9 ? '#7C3AED22' : score >= 8 ? '#10B98122' : '#F59E0B22'
  return (
    <span
      className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-700 shrink-0"
      style={{ color, backgroundColor: bg }}
    >
      {score}
    </span>
  )
}

// ─── Status dropdown ───────────────────────────────────────────────────────────

function StatusSelect({ oferta }: { oferta: RadarOferta }) {
  const update = useUpdateRadarOfertaStatus()
  const cfg = STATUS_CFG[oferta.status]
  return (
    <select
      value={oferta.status}
      onChange={e => update.mutate({ id: oferta.id, status: e.target.value as RadarOfertaStatus })}
      className="text-[11px] font-600 px-2 py-1 rounded-full border-0 outline-none cursor-pointer"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {STATUS_ORDER.map(s => (
        <option key={s} value={s} style={{ color: '#F0F0F8', backgroundColor: '#111118' }}>
          {STATUS_CFG[s].label}
        </option>
      ))}
    </select>
  )
}

// ─── Oferta card ───────────────────────────────────────────────────────────────

function OfertaCard({ oferta }: { oferta: RadarOferta }) {
  const [expanded, setExpanded] = useState(false)
  const del = useDeleteRadarOferta()

  return (
    <div className="bg-[#111118] rounded-2xl border border-[#22222E] hover:border-[#7C3AED30] transition-all overflow-hidden">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ScoreBadge score={oferta.score} />

          <div className="flex-1 min-w-0">
            {/* Domain + status */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-700 text-[#F0F0F8] truncate">{oferta.domain}</span>
              {oferta.advertiser && (
                <span className="text-[11px] text-[#5A5A70]">· {oferta.advertiser}</span>
              )}
              <StatusSelect oferta={oferta} />
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {oferta.keyword_used && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C3AED18] text-[#8B5CF6]">
                  {oferta.keyword_used}
                </span>
              )}
              {oferta.niche && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A1A24] text-[#9090A8]">
                  {oferta.niche}
                </span>
              )}
              {oferta.price != null && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B98118] text-[#10B981]">
                  R$ {oferta.price}
                </span>
              )}
              {oferta.active_ads_count != null && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A1A24] text-[#9090A8]">
                  {oferta.active_ads_count} anúncios
                </span>
              )}
              {oferta.days_running != null && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A1A24] text-[#9090A8]">
                  {oferta.days_running} dias no ar
                </span>
              )}
            </div>

            {/* Angle preview */}
            {oferta.angle && (
              <p className={cn('text-[12px] text-[#9090A8] leading-relaxed', !expanded && 'line-clamp-1')}>
                {oferta.angle}
              </p>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#22222E]">
          <span className="text-[10px] text-[#5A5A70] flex-1">
            {format(new Date(oferta.created_at), "d MMM yyyy", { locale: ptBR })}
          </span>
          {oferta.ad_link && (
            <a
              href={oferta.ad_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#9090A8] hover:text-[#8B5CF6] transition-colors"
            >
              <ExternalLink size={12} /> Anúncio
            </a>
          )}
          {oferta.page_link && (
            <a
              href={oferta.page_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#9090A8] hover:text-[#8B5CF6] transition-colors"
            >
              <ExternalLink size={12} /> Página
            </a>
          )}
          {(oferta.justification || oferta.angle) && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1 rounded-lg text-[#5A5A70] hover:text-[#F0F0F8] hover:bg-[#1A1A24] transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button
            onClick={() => del.mutate(oferta.id)}
            className="p-1 rounded-lg text-[#5A5A70] hover:text-[#EF4444] hover:bg-[#EF444412] transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded: justification */}
      {expanded && oferta.justification && (
        <div className="px-4 pb-4">
          <div className="bg-[#0A0A0F] rounded-xl p-3 border border-[#22222E]">
            <p className="text-[11px] text-[#5A5A70] font-600 mb-1 uppercase tracking-wider">Justificativa</p>
            <p className="text-[12px] text-[#9090A8] leading-relaxed">{oferta.justification}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Keywords tab ──────────────────────────────────────────────────────────────

function KeywordsTab() {
  const { data: keywords = [], isLoading } = useRadarKeywords()
  const create = useCreateRadarKeyword()
  const toggle = useToggleRadarKeyword()
  const del    = useDeleteRadarKeyword()
  const [input, setInput] = useState('')

  function handleAdd() {
    const word = input.trim()
    if (!word) return
    create.mutate(word, { onSuccess: () => setInput('') })
  }

  return (
    <div className="max-w-xl space-y-4">
      {/* Add input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Ex: apenas R$ 127"
          className="flex-1 bg-[#111118] border border-[#22222E] rounded-xl px-4 py-2.5 text-sm text-[#F0F0F8] placeholder-[#5A5A70] outline-none focus:border-[#7C3AED] transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim() || create.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white text-sm font-600 rounded-xl transition-colors"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-[#5A5A70]">Carregando...</p>
      ) : keywords.length === 0 ? (
        <p className="text-sm text-[#5A5A70]">Nenhuma palavra-chave. Adicione acima.</p>
      ) : (
        <div className="space-y-2">
          {keywords.map(kw => (
            <div
              key={kw.id}
              className="flex items-center gap-3 bg-[#111118] border border-[#22222E] rounded-xl px-4 py-3"
            >
              {/* Toggle */}
              <button
                onClick={() => toggle.mutate({ id: kw.id, is_active: !kw.is_active })}
                className={cn(
                  'w-9 h-5 rounded-full relative transition-colors shrink-0',
                  kw.is_active ? 'bg-[#7C3AED]' : 'bg-[#22222E]'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                    kw.is_active ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </button>
              <span className={cn('flex-1 text-sm', kw.is_active ? 'text-[#F0F0F8]' : 'text-[#5A5A70] line-through')}>
                {kw.word}
              </span>
              <button
                onClick={() => del.mutate(kw.id)}
                className="p-1 rounded-lg text-[#5A5A70] hover:text-[#EF4444] hover:bg-[#EF444412] transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[#5A5A70]">
        O Cowork usa apenas as palavras-chave <span className="text-[#8B5CF6]">ativas</span> em cada scan.
      </p>
    </div>
  )
}

// ─── Ofertas tab ───────────────────────────────────────────────────────────────

function OfertasTab() {
  const { data: ofertas = [], isLoading } = useRadarOfertas()
  const [statusFilter, setStatusFilter] = useState<RadarOfertaStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = ofertas.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        o.domain.toLowerCase().includes(q) ||
        (o.niche?.toLowerCase().includes(q) ?? false) ||
        (o.advertiser?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  const stats = {
    total:    ofertas.length,
    novos:    ofertas.filter(o => o.status === 'novo').length,
    aprovados: ofertas.filter(o => o.status === 'aprovado').length,
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total,    icon: TrendingUp,   color: '#7C3AED' },
          { label: 'Novos', value: stats.novos,     icon: Clock,        color: '#F59E0B' },
          { label: 'Aprovados', value: stats.aprovados, icon: CheckCircle2, color: '#10B981' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#111118] border border-[#22222E] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-700 text-[#F0F0F8]">{value}</p>
              <p className="text-[11px] text-[#5A5A70]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A70]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar domínio, nicho..."
            className="w-full bg-[#111118] border border-[#22222E] rounded-xl pl-8 pr-4 py-2 text-sm text-[#F0F0F8] placeholder-[#5A5A70] outline-none focus:border-[#7C3AED] transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {(['all', ...STATUS_ORDER] as const).map(s => {
            const label = s === 'all' ? 'Todos' : STATUS_CFG[s].label
            const active = statusFilter === s
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-600 transition-colors',
                  active
                    ? 'bg-[#7C3AED] text-white'
                    : 'bg-[#111118] border border-[#22222E] text-[#9090A8] hover:text-[#F0F0F8] hover:border-[#7C3AED40]'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-[#5A5A70]">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Radar size={40} className="text-[#22222E] mx-auto mb-3" />
          <p className="text-sm text-[#5A5A70]">
            {ofertas.length === 0
              ? 'Nenhuma oferta ainda. Rode o scan no Cowork para começar.'
              : 'Nenhuma oferta com esse filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => <OfertaCard key={o.id} oferta={o} />)}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function RadarPageClient() {
  const [tab, setTab] = useState<Tab>('ofertas')

  const TABS: { id: Tab; label: string; icon: typeof Tag }[] = [
    { id: 'ofertas',  label: 'Ofertas',          icon: Radar },
    { id: 'keywords', label: 'Palavras-chave',   icon: Tag },
  ]

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0F]">
      <Header title="Radar de Ofertas" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-[#111118] border border-[#22222E] rounded-xl p-1 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all',
                  tab === id
                    ? 'bg-[#7C3AED] text-white'
                    : 'text-[#9090A8] hover:text-[#F0F0F8]'
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {tab === 'ofertas'  && <OfertasTab />}
          {tab === 'keywords' && <KeywordsTab />}
        </div>
      </div>
    </div>
  )
}
