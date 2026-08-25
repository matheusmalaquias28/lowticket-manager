import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Webhook Make]', JSON.stringify(body))
    // Future: processar webhooks do Make.com
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}
