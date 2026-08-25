import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getWeekKey, getWeekStart, getWeekEnd } from '@/lib/weeks'
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

  // Check if already generated
  const { data: existing } = await supabase.from('weeks').select('week_key').eq('week_key', weekKey).single()
  if (existing) {
    return NextResponse.json({ message: 'Week already generated', week_key: weekKey })
  }

  // Fetch active templates from active offers
  const { data: templates, error: tmplErr } = await supabase
    .from('recurring_templates')
    .select('*, offer:offers(id, status)')
    .eq('is_active', true)

  if (tmplErr) return NextResponse.json({ error: tmplErr.message }, { status: 500 })

  const activeTemplates = templates?.filter(t => t.offer?.status === 'active') ?? []

  if (activeTemplates.length > 0) {
    const tasks = activeTemplates.map(tmpl => ({
      title: tmpl.title,
      description: tmpl.description,
      week_key: weekKey,
      day_of_week: tmpl.day_of_week,
      assignee_name: tmpl.assignee_name,
      category: tmpl.category,
      offer_id: tmpl.offer_id,
      checklist: (tmpl.default_checklist as { text: string }[]).map(item => ({
        id: crypto.randomUUID(),
        text: item.text,
        done: false,
      })),
      due_time: tmpl.due_time,
      status: 'pending',
      is_delayed: false,
      from_template_id: tmpl.id,
    }))

    const { error: insertErr } = await supabase.from('tasks').insert(tasks)
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Register week
  const weekStart = getWeekStart(weekKey)
  const weekEnd = getWeekEnd(weekKey)
  await supabase.from('weeks').insert({
    week_key: weekKey,
    start_date: format(weekStart, 'yyyy-MM-dd'),
    end_date: format(weekEnd, 'yyyy-MM-dd'),
    generated_at: new Date().toISOString(),
  })

  // Push notification to all users
  const { data: profiles } = await supabase.from('profiles').select('onesignal_player_id').not('onesignal_player_id', 'is', null)
  const playerIds = (profiles ?? []).map(p => p.onesignal_player_id).filter(Boolean) as string[]

  if (playerIds.length > 0) {
    await sendPushNotification({
      playerIds,
      title: '⚡ Semana gerada!',
      message: `${activeTemplates.length} novas tarefas criadas para a semana ${weekKey}.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/kanban`,
    })
  }

  return NextResponse.json({
    success: true,
    week_key: weekKey,
    tasks_created: activeTemplates.length,
  })
}
