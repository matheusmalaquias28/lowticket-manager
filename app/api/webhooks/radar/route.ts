import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface RadarPayload {
  keyword_used: string
  advertiser?: string
  domain: string
  active_ads_count?: number
  days_running?: number
  niche?: string
  price?: number
  ad_link?: string
  page_link?: string
  angle?: string
  score: number
  justification?: string
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.RADAR_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: RadarPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.domain || !body.keyword_used || body.score == null) {
    return NextResponse.json({ error: 'Missing required fields: domain, keyword_used, score' }, { status: 422 })
  }

  if (body.score < 6) {
    return NextResponse.json({ error: 'Score below threshold (6)' }, { status: 422 })
  }

  const supabase = adminClient()

  // Upsert: se o domínio já existe, atualiza com dados mais recentes
  const { data, error } = await supabase
    .from('radar_ofertas')
    .upsert(
      {
        keyword_used:     body.keyword_used,
        advertiser:       body.advertiser ?? null,
        domain:           body.domain,
        active_ads_count: body.active_ads_count ?? null,
        days_running:     body.days_running ?? null,
        niche:            body.niche ?? null,
        price:            body.price ?? null,
        ad_link:          body.ad_link ?? null,
        page_link:        body.page_link ?? null,
        angle:            body.angle ?? null,
        score:            body.score,
        justification:    body.justification ?? null,
        status:           'novo',
      },
      { onConflict: 'domain', ignoreDuplicates: false }
    )
    .select('id, domain, score')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, id: data.id, domain: data.domain, score: data.score })
}
