'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import type { ActivityLog } from '@/lib/activity'

export function useActivityLogs(limit = 60) {
  const supabase = createClient()
  const qc = useQueryClient()

  // Realtime: invalida ao inserir novo log
  useEffect(() => {
    const channel = supabase
      .channel('activity_logs_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        qc.invalidateQueries({ queryKey: ['activity_logs'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, qc])

  return useQuery({
    queryKey: ['activity_logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      return (data ?? []) as ActivityLog[]
    },
    staleTime: 30_000,
  })
}
