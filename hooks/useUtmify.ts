'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UtmifySnapshot } from '@/lib/types'

export function useUtmifySnapshots(limit = 30) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['utmify_snapshots', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utmify_snapshots')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as UtmifySnapshot[]
    },
  })
}

export function useUtmifyLatest() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['utmify_snapshots_latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utmify_snapshots')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as UtmifySnapshot | null
    },
  })
}

export function useUtmifyByDate(date: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['utmify_snapshots', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utmify_snapshots')
        .select('*')
        .eq('date', date)
        .maybeSingle()
      if (error) throw error
      return data as UtmifySnapshot | null
    },
    enabled: !!date,
  })
}
