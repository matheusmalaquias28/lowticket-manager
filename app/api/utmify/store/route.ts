import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Payload enviado por Claude (via MCP) ou Make.com
export interface UtmifyStorePayload {
  date: string            // YYYY-MM-DD
  dashboard_id?: string
  gross_revenue_cents: number
  net_revenue_cents: number
  profit_cents: number
  pending_revenue_cents: number
  total_orders: number
  approved_orders: number
  pending_orders: number
  refunded_orders: number
  ad_spend_cents: number
  meta_spend_cents?: number
  tiktok_spend_cents?: number
  google_spend_cents?: number
  roi?: number
  roas?: number
  cpa_cents?: number
  avg_ticket_cents?: number
  profit_margin?: number
  clicks?: number
  pix_orders?: number
  card_orders?: number
  card_refused?: number
  products_data?: { productName: string; count: number; revenue: number }[]
  hourly_data?: { hour: number; revenue_cents: number; profit_cents: number; investment_cents: number }[]
}

export async function POST(req: NextRequest) {
  // Protege com CRON_SECRET (mesmo segredo usado nos crons)
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: UtmifyStorePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.date) {
    return NextResponse.json({ error: 'date is required (YYYY-MM-DD)' }, { status: 400 })
  }

  const supabase = adminClient()

  const row = {
    date: body.date,
    dashboard_id: body.dashboard_id ?? null,
    gross_revenue_cents: body.gross_revenue_cents,
    net_revenue_cents: body.net_revenue_cents,
    profit_cents: body.profit_cents,
    pending_revenue_cents: body.pending_revenue_cents ?? 0,
    total_orders: body.total_orders,
    approved_orders: body.approved_orders,
    pending_orders: body.pending_orders,
    refunded_orders: body.refunded_orders,
    ad_spend_cents: body.ad_spend_cents,
    meta_spend_cents: body.meta_spend_cents ?? 0,
    tiktok_spend_cents: body.tiktok_spend_cents ?? 0,
    google_spend_cents: body.google_spend_cents ?? 0,
    roi: body.roi ?? null,
    roas: body.roas ?? null,
    cpa_cents: body.cpa_cents ?? null,
    avg_ticket_cents: body.avg_ticket_cents ?? null,
    profit_margin: body.profit_margin ?? null,
    clicks: body.clicks ?? 0,
    pix_orders: body.pix_orders ?? 0,
    card_orders: body.card_orders ?? 0,
    card_refused: body.card_refused ?? 0,
    products_data: body.products_data ?? [],
    hourly_data: body.hourly_data ?? [],
    synced_at: new Date().toISOString(),
  }

  // Upsert — se já existe snapshot para o dia, atualiza
  const { error } = await supabase
    .from('utmify_snapshots')
    .upsert(row, { onConflict: 'date' })

  if (error) {
    console.error('[Utmify Store]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, date: body.date })
}
