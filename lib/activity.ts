import { createClient } from '@/lib/supabase/client'

export interface ActivityLog {
  id: string
  action: string
  title: string
  actor_name?: string
  entity_type?: string
  entity_id?: string
  created_at: string
}

interface LogEntry {
  action: string
  title: string
  actor_name?: string
  entity_type?: string
  entity_id?: string
}

export async function logActivity(entry: LogEntry): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from('activity_logs').insert(entry)
  } catch {
    // Log nunca deve quebrar o fluxo principal
  }
}
