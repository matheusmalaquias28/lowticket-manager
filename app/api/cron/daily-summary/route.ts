import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getWeekKey } from '@/lib/weeks'
import { sendPushNotification } from '@/lib/onesignal'
import { format } from 'date-fns'

export const runtime = 'nodejs'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = adminClient()
  const weekKey = getWeekKey()
  const today = new Date().getDay() // 0=Sun,...,6=Sat

  // Fetch profiles with OneSignal IDs
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, onesignal_player_id')
    .not('onesignal_player_id', 'is', null)

  if (!profiles?.length) return NextResponse.json({ message: 'No profiles' })

  for (const profile of profiles) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('week_key', weekKey)
      .eq('day_of_week', today)
      .eq('assignee_name', profile.name)
      .neq('status', 'done')

    const count = tasks?.length ?? 0
    if (count === 0) continue

    await sendPushNotification({
      playerIds: [profile.onesignal_player_id!],
      title: '📋 Resumo do dia',
      message: `${profile.name}, você tem ${count} tarefa${count > 1 ? 's' : ''} para hoje!`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/kanban`,
    })
  }

  return NextResponse.json({ success: true })
}
