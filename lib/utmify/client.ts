import type { UtmifyStorePayload } from '@/app/api/utmify/store/route'
import { format, subHours } from 'date-fns'

const BASE_URL = process.env.UTMIFY_API_BASE_URL ?? 'https://api.utmify.com.br'
const TOKEN = process.env.UTMIFY_API_TOKEN
const DASHBOARD_ID = process.env.UTMIFY_DASHBOARD_ID ?? '69237242b4c22f67823df830'
// UTMIFY_AUTH_SCHEME controla o formato de autenticação:
//   x-api-key  (padrão) → header customizado: x-api-key: TOKEN
//   bearer              → Authorization: Bearer TOKEN
//   raw                 → Authorization: TOKEN
//   token=              → Authorization: token=TOKEN
const AUTH_SCHEME = process.env.UTMIFY_AUTH_SCHEME ?? 'x-api-key'

if (!BASE_URL) throw new Error('UTMIFY_API_BASE_URL missing')

function headers(): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' }
  switch (AUTH_SCHEME) {
    case 'bearer':        return { ...base, 'Authorization': `Bearer ${TOKEN}` }
    case 'bearer-token=': return { ...base, 'Authorization': `Bearer token=${TOKEN}` }
    case 'bearer-key=':   return { ...base, 'Authorization': `Bearer key=${TOKEN}` }
    case 'raw':           return { ...base, 'Authorization': TOKEN! }
    case 'token=':        return { ...base, 'Authorization': `token=${TOKEN}` }
    case 'x-api-key':     return { ...base, 'x-api-key': TOKEN! }
    default:              return { ...base, 'Authorization': `Bearer token=${TOKEN}` }
  }
}

export function isConfigured() {
  return !!TOKEN
}

// Formata a data com timezone -03:00
function withTz(date: Date, time: 'start' | 'end') {
  const base = format(date, 'yyyy-MM-dd')
  return time === 'start' ? `${base}T00:00:00-03:00` : `${base}T23:59:59-03:00`
}

export async function fetchSummary(date: Date): Promise<UtmifyStorePayload> {
  const from = withTz(date, 'start')
  const to = withTz(date, 'end')
  const dateStr = format(date, 'yyyy-MM-dd')

  const res = await fetch(`${BASE_URL}/api/v1/dashboards/${DASHBOARD_ID}/summary`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ dateRange: { from, to } }),
    next: { revalidate: 0 },
  })

  if (res.status === 401) throw new Error('Token inválido ou expirado. Verifique UTMIFY_API_TOKEN.')
  if (res.status === 403) {
    const txt = await res.text().catch(() => '')
    throw new Error(
      `Utmify API 403 — formato de autenticação incorreto (UTMIFY_AUTH_SCHEME="${AUTH_SCHEME}"). ` +
      `Tente: x-api-key, bearer, raw ou token=. Detalhe: ${txt}`
    )
  }
  if (res.status === 404) throw new Error('Dashboard não encontrado. Verifique UTMIFY_DASHBOARD_ID.')
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Utmify API ${res.status}: ${txt}`)
  }

  const d = await res.json()
  return mapToPayload(d, dateStr)
}

function mapToPayload(d: any, date: string): UtmifyStorePayload {
  const hourly = buildHourly(d)

  return {
    date,
    dashboard_id: DASHBOARD_ID,
    gross_revenue_cents:   d.comissions?.gross ?? 0,
    net_revenue_cents:     d.comissions?.net ?? 0,
    profit_cents:          d.analytics?.profit ?? 0,
    pending_revenue_cents: d.comissions?.pendingGrossRevenue ?? 0,
    total_orders:          d.ordersCount?.total ?? 0,
    approved_orders:       d.ordersCount?.approved ?? 0,
    pending_orders:        d.ordersCount?.pending ?? 0,
    refunded_orders:       d.ordersCount?.refunded ?? 0,
    ad_spend_cents:        d.ads?.spent ?? 0,
    meta_spend_cents:      d.ads?.meta?.spent ?? 0,
    tiktok_spend_cents:    d.ads?.tikTok?.spent ?? 0,
    google_spend_cents:    d.ads?.google?.spent ?? 0,
    roi:                   d.analytics?.roi ?? null,
    roas:                  d.analytics?.roas ?? null,
    cpa_cents:             d.analytics?.cpa != null ? Math.round(d.analytics.cpa) : null,
    avg_ticket_cents:      d.analytics?.avgTicket != null ? Math.round(d.analytics.avgTicket) : null,
    profit_margin:         d.analytics?.profitMargin ?? null,
    clicks:                d.ads?.clicks ?? 0,
    pix_orders:            d.statistics?.pix?.approved?.ordersCount ?? 0,
    card_orders:           d.statistics?.card?.approved?.ordersCount ?? 0,
    card_refused:          d.statistics?.card?.refused?.ordersCount ?? 0,
    products_data:         (d.ordersCount?.byProductName ?? []).map((p: any) => ({
      productName: p.productName,
      count: p.count,
      revenue: p.revenue ?? 0,
    })),
    hourly_data: hourly,
  }
}

function buildHourly(d: any) {
  const revCumulative: { hour: number; cents: number }[] = d.hourlyCumulative?.revenueByHourGrossCumulative ?? []
  const invCumulative: { hour: number; cents: number }[] = d.hourlyCumulative?.investmentByHourCumulative ?? []
  const profitByHour:  { hour: number; cents: number }[] = d.profitByHourNet ?? []

  return Array.from({ length: 24 }, (_, h) => {
    const revCurr = revCumulative.find(x => x.hour === h)?.cents ?? 0
    const revPrev = h > 0 ? (revCumulative.find(x => x.hour === h - 1)?.cents ?? 0) : 0
    const invCurr = invCumulative.find(x => x.hour === h)?.cents ?? 0
    const invPrev = h > 0 ? (invCumulative.find(x => x.hour === h - 1)?.cents ?? 0) : 0
    const profit  = profitByHour.find(x => x.hour === h)?.cents ?? 0

    return {
      hour: h,
      revenue_cents:    Math.max(0, revCurr - revPrev),
      profit_cents:     profit,
      investment_cents: Math.max(0, invCurr - invPrev),
    }
  })
}
