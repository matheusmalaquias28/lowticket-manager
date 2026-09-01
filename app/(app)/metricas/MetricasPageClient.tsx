'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, subDays, parseISO, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Target, Zap, BarChart2, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { MetricsAgent } from '@/components/metrics/MetricsAgent'
import { useUtmifyByDate, useUtmifySnapshots } from '@/hooks/useUtmify'
import { cn } from '@/lib/utils'
import type { UtmifySnapshot } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cents(v?: number | null) {
  if (v == null) return null
  return v / 100
}

function brl(v?: number | null, decimals = 2) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function pct(v?: number | null) {
  if (v == null) return '—'
  return `${(v * 100).toFixed(1)}%`
}

function trend(curr?: number | null, prev?: number | null) {
  if (curr == null || prev == null || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: string
  sub?: string
  delta?: number | null
  icon: React.ElementType
  accent?: string
}

function KpiCard({ label, value, sub, delta, icon: Icon, accent = '#7C3AED' }: KpiProps) {
  const up = delta != null && delta > 0
  const down = delta != null && delta < 0
  return (
    <div className="bg-[#111118] border border-[#22222E] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-600 text-[#9090A8]">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
          <Icon size={13} style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="text-xl font-800 text-[#F0F0F8] leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-[#5A5A70] mt-0.5">{sub}</p>}
      </div>
      {delta != null && (
        <div className={cn('flex items-center gap-1 text-[11px] font-600', up ? 'text-[#10B981]' : down ? 'text-[#EF4444]' : 'text-[#9090A8]')}>
          {up ? <TrendingUp size={11} /> : down ? <TrendingDown size={11} /> : null}
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs ontem
        </div>
      )}
    </div>
  )
}

// ─── Hourly Chart ─────────────────────────────────────────────────────────────

function HourlyChart({ data }: { data: UtmifySnapshot['hourly_data'] }) {
  const nonZero = data.filter(h => h.revenue_cents > 0 || h.profit_cents !== 0)
  if (!nonZero.length) return <p className="text-xs text-[#5A5A70]">Sem dados por hora.</p>

  const maxRev = Math.max(...data.map(h => h.revenue_cents))
  const maxInv = Math.max(...data.map(h => h.investment_cents))
  const maxVal = Math.max(maxRev, maxInv, 1)

  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = data.find(d => d.hour === i) ?? { hour: i, revenue_cents: 0, profit_cents: 0, investment_cents: 0 }
    return h
  })

  return (
    <div className="flex items-end gap-[3px] h-24">
      {hours.map(h => {
        const revH = Math.round((h.revenue_cents / maxVal) * 96)
        const invH = Math.round((h.investment_cents / maxVal) * 96)
        const hasData = h.revenue_cents > 0 || h.investment_cents > 0
        return (
          <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="flex-1 flex flex-col-reverse w-full gap-0.5">
              {/* Receita */}
              <div
                className="w-full rounded-sm transition-all"
                style={{ height: `${revH}px`, backgroundColor: '#10B981', opacity: hasData ? 1 : 0.1 }}
              />
            </div>
            {/* Gasto */}
            <div
              className="w-full rounded-sm absolute bottom-0"
              style={{ height: `${invH}px`, backgroundColor: '#EF444440' }}
            />
            {/* Tooltip */}
            {hasData && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap bg-[#1A1A24] border border-[#22222E] rounded-lg px-2 py-1 text-[10px] text-[#F0F0F8]">
                {h.hour}h · Rev: {brl(cents(h.revenue_cents))} · Inv: {brl(cents(h.investment_cents))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Products Table ───────────────────────────────────────────────────────────

function ProductsTable({ products }: { products: UtmifySnapshot['products_data'] }) {
  if (!products?.length) return <p className="text-xs text-[#5A5A70]">Sem dados de produtos.</p>

  const sorted = [...products].sort((a, b) => b.revenue - a.revenue)
  const totalRev = sorted.reduce((s, p) => s + p.revenue, 0)

  return (
    <div className="space-y-1">
      {sorted.map((p, i) => {
        const share = totalRev > 0 ? (p.revenue / totalRev) * 100 : 0
        return (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-[#22222E] last:border-0">
            <div className="w-5 text-[10px] text-[#5A5A70] font-700">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-600 text-[#F0F0F8] truncate">{p.productName}</p>
              <div className="h-1 mt-1 rounded-full bg-[#22222E] overflow-hidden">
                <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${share}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-700 text-[#F0F0F8]">{brl(cents(p.revenue))}</p>
              <p className="text-[10px] text-[#5A5A70]">{p.count} vendas</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MetricasPageClient() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [syncedAgo, setSyncedAgo] = useState<string | null>(null)
  const qc = useQueryClient()

  // Update "X min ago" label every minute
  useEffect(() => {
    if (!lastSyncedAt) return
    const update = () => setSyncedAgo(
      formatDistanceToNow(new Date(lastSyncedAt), { locale: ptBR, addSuffix: true })
    )
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [lastSyncedAt])

  const { data: snapshot, isLoading } = useUtmifyByDate(selectedDate)
  const { data: history = [] } = useUtmifySnapshots(30)

  // Init lastSyncedAt from loaded snapshot
  useEffect(() => {
    if (snapshot?.synced_at && !lastSyncedAt) setLastSyncedAt(snapshot.synced_at)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.synced_at])

  // Busca snapshot do dia anterior para comparação
  const prevDate = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd')
  const prev = useMemo(() => history.find(s => s.date === prevDate), [history, prevDate])

  function shiftDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    const next = format(d, 'yyyy-MM-dd')
    if (next <= today) setSelectedDate(next)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch(`/api/utmify/sync?date=${selectedDate}`, { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao sincronizar')
        return
      }

      await qc.invalidateQueries({ queryKey: ['utmify_snapshots'] })
      setLastSyncedAt(new Date().toISOString())
      toast.success(`Sincronizado! ${json.approved_orders} pedidos aprovados em ${selectedDate}`)
    } catch {
      toast.error('Erro de conexão ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const displayDate = useMemo(() => {
    try {
      return format(parseISO(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return selectedDate
    }
  }, [selectedDate])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Métricas">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1A1A24] rounded-lg p-1">
            <button onClick={() => shiftDate(-1)} className="p-1 rounded text-[#5A5A70] hover:text-[#F0F0F8] transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-600 text-[#9090A8] px-2 min-w-[160px] text-center">{displayDate}</span>
            <button
              onClick={() => shiftDate(1)}
              disabled={selectedDate >= today}
              className="p-1 rounded text-[#5A5A70] hover:text-[#F0F0F8] transition-colors disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {syncedAgo && !syncing && (
              <span className="text-[10px] text-[#5A5A70]">
                <RefreshCw size={9} className="inline mr-1" />
                {syncedAgo}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              <RefreshCw size={13} className={cn(syncing && 'animate-spin')} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </div>
      </Header>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-[#111118] border border-[#22222E] animate-pulse" />
            ))}
          </div>
        ) : !snapshot ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#111118] border border-[#22222E] flex items-center justify-center">
              <BarChart2 size={28} className="text-[#5A5A70]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-600 text-[#9090A8]">Sem dados para {displayDate}</p>
              <p className="text-xs text-[#5A5A70] mt-1">Peça ao Claude para sincronizar os dados do Utmify</p>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* KPI grid principal */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Faturamento Bruto"
                value={brl(cents(snapshot.gross_revenue_cents))}
                delta={trend(snapshot.gross_revenue_cents, prev?.gross_revenue_cents)}
                icon={DollarSign}
                accent="#10B981"
              />
              <KpiCard
                label="Faturamento Líquido"
                value={brl(cents(snapshot.net_revenue_cents))}
                delta={trend(snapshot.net_revenue_cents, prev?.net_revenue_cents)}
                icon={DollarSign}
                accent="#0EA5E9"
              />
              <KpiCard
                label="Lucro"
                value={brl(cents(snapshot.profit_cents))}
                sub={snapshot.profit_margin != null ? `Margem ${pct(snapshot.profit_margin)}` : undefined}
                delta={trend(snapshot.profit_cents, prev?.profit_cents)}
                icon={TrendingUp}
                accent={snapshot.profit_cents >= 0 ? '#10B981' : '#EF4444'}
              />
              <KpiCard
                label="Investimento Meta"
                value={brl(cents(snapshot.ad_spend_cents))}
                delta={trend(snapshot.ad_spend_cents, prev?.ad_spend_cents)}
                icon={Zap}
                accent="#F59E0B"
              />
              <KpiCard
                label="ROI"
                value={snapshot.roi != null ? `${((snapshot.roi) * 100).toFixed(0)}%` : '—'}
                sub={snapshot.roas != null ? `ROAS ${snapshot.roas.toFixed(2)}x` : undefined}
                delta={trend(snapshot.roi, prev?.roi)}
                icon={Target}
                accent="#7C3AED"
              />
              <KpiCard
                label="Pedidos Aprovados"
                value={String(snapshot.approved_orders)}
                sub={snapshot.pending_orders > 0 ? `${snapshot.pending_orders} pendentes` : undefined}
                delta={trend(snapshot.approved_orders, prev?.approved_orders)}
                icon={ShoppingCart}
                accent="#8B5CF6"
              />
              <KpiCard
                label="Ticket Médio"
                value={brl(cents(snapshot.avg_ticket_cents))}
                delta={trend(snapshot.avg_ticket_cents, prev?.avg_ticket_cents)}
                icon={DollarSign}
                accent="#EC4899"
              />
              <KpiCard
                label="CPA"
                value={brl(cents(snapshot.cpa_cents))}
                sub={snapshot.clicks ? `${snapshot.clicks} cliques` : undefined}
                delta={snapshot.cpa_cents && prev?.cpa_cents ? -trend(snapshot.cpa_cents, prev.cpa_cents)! : null}
                icon={Target}
                accent="#F97316"
              />
            </div>

            {/* Pagamentos */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#111118] border border-[#22222E] rounded-2xl p-4">
                <p className="text-xs font-600 text-[#9090A8] mb-2">Pix</p>
                <p className="text-lg font-800 text-[#F0F0F8]">{snapshot.pix_orders}</p>
                <p className="text-[11px] text-[#5A5A70]">pedidos aprovados</p>
              </div>
              <div className="bg-[#111118] border border-[#22222E] rounded-2xl p-4">
                <p className="text-xs font-600 text-[#9090A8] mb-2">Cartão Aprovado</p>
                <p className="text-lg font-800 text-[#10B981]">{snapshot.card_orders}</p>
                <p className="text-[11px] text-[#5A5A70]">pedidos</p>
              </div>
              <div className="bg-[#111118] border border-[#22222E] rounded-2xl p-4">
                <p className="text-xs font-600 text-[#9090A8] mb-2">Cartão Recusado</p>
                <p className="text-lg font-800 text-[#EF4444]">{snapshot.card_refused}</p>
                <p className="text-[11px] text-[#5A5A70]">pedidos</p>
              </div>
            </div>

            {/* Gráfico + Produtos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Gráfico por hora */}
              <div className="bg-[#111118] border border-[#22222E] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-700 text-[#F0F0F8]">Receita por hora</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#9090A8]">
                      <div className="w-2 h-2 rounded-sm bg-[#10B981]" />
                      Receita
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#9090A8]">
                      <div className="w-2 h-2 rounded-sm bg-[#EF444440]" />
                      Investimento
                    </div>
                  </div>
                </div>
                <HourlyChart data={snapshot.hourly_data ?? []} />
                <div className="flex justify-between mt-2">
                  {[0, 6, 12, 18, 23].map(h => (
                    <span key={h} className="text-[9px] text-[#5A5A70]">{h}h</span>
                  ))}
                </div>
              </div>

              {/* Produtos */}
              <div className="bg-[#111118] border border-[#22222E] rounded-2xl p-5">
                <p className="text-sm font-700 text-[#F0F0F8] mb-4">Produtos</p>
                <ProductsTable products={snapshot.products_data ?? []} />
              </div>
            </div>

            {/* Última sync */}
            <div className="flex items-center gap-2 text-[11px] text-[#5A5A70]">
              <RefreshCw size={11} />
              Última sincronização: {format(parseISO(snapshot.synced_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </motion.div>
        )}

        {/* Histórico de snapshots */}
        {history.length > 1 && (
          <div className="bg-[#111118] border border-[#22222E] rounded-2xl p-5">
            <p className="text-sm font-700 text-[#F0F0F8] mb-4">Histórico (últimos {history.length} dias)</p>
            <div className="space-y-1">
              {history.map(s => (
                <button
                  key={s.date}
                  onClick={() => setSelectedDate(s.date)}
                  className={cn(
                    'w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs transition-all',
                    s.date === selectedDate
                      ? 'bg-[#7C3AED1A] text-[#8B5CF6]'
                      : 'text-[#9090A8] hover:bg-[#1A1A24]'
                  )}
                >
                  <span className="font-600">
                    {format(parseISO(s.date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span>{brl(cents(s.gross_revenue_cents))}</span>
                    <span className={cn('font-700', s.profit_cents >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                      {s.profit_cents >= 0 ? '+' : ''}{brl(cents(s.profit_cents))}
                    </span>
                    <span>{s.approved_orders} vendas</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Agent bar — fixed at bottom, outside scroll */}
      <MetricsAgent />
    </div>
  )
}
