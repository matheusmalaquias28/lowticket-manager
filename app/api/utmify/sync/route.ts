import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { format } from 'date-fns'

export const runtime = 'nodejs'
export const maxDuration = 120

const DASHBOARD_ID = process.env.UTMIFY_DASHBOARD_ID ?? '69237242b4c22f67823df830'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// POST /api/utmify/sync?date=YYYY-MM-DD
// Usa Claude + Utmify MCP para buscar métricas em tempo real
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada.' }, { status: 503 })
  }
  if (!process.env.UTMIFY_MCP_URL) {
    return NextResponse.json({ error: 'UTMIFY_MCP_URL não configurada.' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  const date = dateParam ?? format(new Date(), 'yyyy-MM-dd')

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let rawText = ''
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (anthropic.beta.messages as any).create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `Você é um agente de coleta de dados. Busque o resumo do dashboard Utmify (dashboard ID: ${DASHBOARD_ID}) para a data ${date}.

Retorne APENAS um objeto JSON puro, sem markdown, sem explicações, no seguinte formato exato:
{
  "gross_revenue_cents": <number>,
  "net_revenue_cents": <number>,
  "profit_cents": <number>,
  "pending_revenue_cents": <number>,
  "total_orders": <number>,
  "approved_orders": <number>,
  "pending_orders": <number>,
  "refunded_orders": <number>,
  "ad_spend_cents": <number>,
  "meta_spend_cents": <number>,
  "tiktok_spend_cents": <number>,
  "google_spend_cents": <number>,
  "roi": <number | null>,
  "roas": <number | null>,
  "cpa_cents": <number | null>,
  "avg_ticket_cents": <number | null>,
  "profit_margin": <number | null>,
  "clicks": <number>,
  "pix_orders": <number>,
  "card_orders": <number>,
  "card_refused": <number>,
  "products_data": [{"productName": <string>, "count": <number>, "revenue": <number>}],
  "hourly_data": [{"hour": <0-23>, "revenue_cents": <number>, "profit_cents": <number>, "investment_cents": <number>}]
}

IMPORTANTE: valores monetários em centavos (inteiros). hourly_data deve conter exatamente 24 entradas (horas 0 a 23).`,
      messages: [{ role: 'user', content: `Busque as métricas do dashboard para ${date} e retorne o JSON.` }],
      betas: ['mcp-client-2025-04-04'],
      mcp_servers: [
        {
          type: 'url',
          url: process.env.UTMIFY_MCP_URL,
          name: 'utmify',
        },
      ],
    })

    rawText = (response.content as { type: string; text?: string }[])
      .filter(b => b.type === 'text')
      .map(b => b.text ?? '')
      .join('')
  } catch (err: unknown) {
    console.error('[sync/mcp]', err)
    const msg = err instanceof Error ? err.message : 'Erro ao chamar Claude + MCP'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Parse JSON from response (may be wrapped in markdown fences)
  let data: Record<string, unknown>
  try {
    const jsonMatch = rawText.match(/\{[\s\S]+\}/)
    if (!jsonMatch) throw new Error('Nenhum JSON encontrado na resposta do agente')
    data = JSON.parse(jsonMatch[0])
  } catch (err: unknown) {
    console.error('[sync/parse]', rawText)
    const msg = err instanceof Error ? err.message : 'Erro ao parsear resposta'
    return NextResponse.json({ error: msg, raw: rawText.slice(0, 500) }, { status: 502 })
  }

  // Ensure hourly_data has exactly 24 entries
  const rawHourly = Array.isArray(data.hourly_data) ? data.hourly_data as Record<string, number>[] : []
  const hourly_data = Array.from({ length: 24 }, (_, h) => {
    const entry = rawHourly.find(e => e.hour === h)
    return entry ?? { hour: h, revenue_cents: 0, profit_cents: 0, investment_cents: 0 }
  })

  const num = (v: unknown, fallback = 0): number =>
    typeof v === 'number' ? v : fallback

  const row = {
    date,
    dashboard_id:          DASHBOARD_ID,
    gross_revenue_cents:   num(data.gross_revenue_cents),
    net_revenue_cents:     num(data.net_revenue_cents),
    profit_cents:          num(data.profit_cents),
    pending_revenue_cents: num(data.pending_revenue_cents),
    total_orders:          num(data.total_orders),
    approved_orders:       num(data.approved_orders),
    pending_orders:        num(data.pending_orders),
    refunded_orders:       num(data.refunded_orders),
    ad_spend_cents:        num(data.ad_spend_cents),
    meta_spend_cents:      num(data.meta_spend_cents),
    tiktok_spend_cents:    num(data.tiktok_spend_cents),
    google_spend_cents:    num(data.google_spend_cents),
    roi:                   typeof data.roi === 'number' ? data.roi : null,
    roas:                  typeof data.roas === 'number' ? data.roas : null,
    cpa_cents:             typeof data.cpa_cents === 'number' ? data.cpa_cents : null,
    avg_ticket_cents:      typeof data.avg_ticket_cents === 'number' ? data.avg_ticket_cents : null,
    profit_margin:         typeof data.profit_margin === 'number' ? data.profit_margin : null,
    clicks:                num(data.clicks),
    pix_orders:            num(data.pix_orders),
    card_orders:           num(data.card_orders),
    card_refused:          num(data.card_refused),
    products_data:         Array.isArray(data.products_data) ? data.products_data : [],
    hourly_data,
    synced_at:             new Date().toISOString(),
  }

  const { error: dbError } = await adminClient()
    .from('utmify_snapshots')
    .upsert(row, { onConflict: 'date' })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    date,
    approved_orders: row.approved_orders,
    gross_revenue_cents: row.gross_revenue_cents,
  })
}
