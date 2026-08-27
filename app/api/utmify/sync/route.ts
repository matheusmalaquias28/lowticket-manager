import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchSummary, isConfigured } from '@/lib/utmify/client'
import { format } from 'date-fns'

export const runtime = 'nodejs'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/utmify/sync?date=YYYY-MM-DD (opcional, padrão = hoje)
// Chamado pelo botão "Sincronizar" da plataforma — sem auth extra,
// pois o usuário já está autenticado no Supabase (cookie SSR).
export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error: 'UTMIFY_API_TOKEN não configurado.',
        setup: true,
        instructions: [
          '1. Acesse utmify.com.br → Configurações → API (ou Integrações)',
          '2. Copie seu token de acesso à API',
          '3. Adicione UTMIFY_API_TOKEN=<token> no .env.local (local) ou nas Env Vars da Vercel',
          '4. Reinicie o servidor e tente novamente',
        ],
      },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  const targetDate = dateParam ? new Date(dateParam) : new Date()
  const dateStr = format(targetDate, 'yyyy-MM-dd')

  let payload
  try {
    payload = await fetchSummary(targetDate)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro ao buscar dados do Utmify' }, { status: 502 })
  }

  const supabase = adminClient()
  const row = {
    date: dateStr,
    dashboard_id: payload.dashboard_id,
    gross_revenue_cents:   payload.gross_revenue_cents,
    net_revenue_cents:     payload.net_revenue_cents,
    profit_cents:          payload.profit_cents,
    pending_revenue_cents: payload.pending_revenue_cents,
    total_orders:          payload.total_orders,
    approved_orders:       payload.approved_orders,
    pending_orders:        payload.pending_orders,
    refunded_orders:       payload.refunded_orders,
    ad_spend_cents:        payload.ad_spend_cents,
    meta_spend_cents:      payload.meta_spend_cents ?? 0,
    tiktok_spend_cents:    payload.tiktok_spend_cents ?? 0,
    google_spend_cents:    payload.google_spend_cents ?? 0,
    roi:                   payload.roi,
    roas:                  payload.roas,
    cpa_cents:             payload.cpa_cents,
    avg_ticket_cents:      payload.avg_ticket_cents,
    profit_margin:         payload.profit_margin,
    clicks:                payload.clicks ?? 0,
    pix_orders:            payload.pix_orders ?? 0,
    card_orders:           payload.card_orders ?? 0,
    card_refused:          payload.card_refused ?? 0,
    products_data:         payload.products_data ?? [],
    hourly_data:           payload.hourly_data ?? [],
    synced_at:             new Date().toISOString(),
  }

  const { error } = await supabase
    .from('utmify_snapshots')
    .upsert(row, { onConflict: 'date' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, date: dateStr, approved_orders: payload.approved_orders })
}
