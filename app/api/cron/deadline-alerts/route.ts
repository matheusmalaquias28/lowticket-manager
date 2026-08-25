import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getWeekKey } from '@/lib/weeks'
import { sendPushNotification } from '@/lib/onesignal'
import { format, addHours } from 'date-fns'

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
  const now = new Date()
  const in2h = addHours(now, 2)
  const nowTime = format(now, 'HH:mm')
  const in2hTime = format(in2h, 'HH:mm')
  const weekKey = getWeekKey()
  const today = now.getDay()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_time, assignee_name')
    .eq('week_key', weekKey)
    .eq('day_of_week', today)
    .neq('status', 'done')
    .not('due_time', 'is', null)
    .gte('due_time', nowTime)
    .lte('due_time', in2hTime)

  if (!tasks?.length) return NextResponse.json({ message: 'No deadlines in range' })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('name, onesignal_player_id')
    .not('onesignal_player_id', 'is', null)

  for (const task of tasks) {
    const profile = profiles?.find(p => p.name === task.assignee_name)
    if (!profile?.onesignal_player_id) continue

    await sendPushNotification({
      playerIds: [profile.onesignal_player_id],
      title: '⏰ Prazo se aproximando',
      message: `"${task.title}" vence às ${task.due_time}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/kanban`,
    })
  }

  return NextResponse.json({ success: true, alerts: tasks.length })
}
