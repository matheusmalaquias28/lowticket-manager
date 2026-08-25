import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/onesignal'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { player_ids, title, message, url } = await req.json()

  if (!player_ids?.length || !title || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const result = await sendPushNotification({ playerIds: player_ids, title, message, url })
  return NextResponse.json(result)
}
