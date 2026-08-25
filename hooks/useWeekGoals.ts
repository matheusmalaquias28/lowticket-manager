'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface WeekGoal {
  id: string
  week_key: string
  text: string
  done: boolean
  position: number
  created_at: string
}

export function useWeekGoals(weekKey: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['week_goals', weekKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('week_goals')
        .select('*')
        .eq('week_key', weekKey)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as WeekGoal[]
    },
  })
}

export function useCreateWeekGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ weekKey, text, position }: { weekKey: string; text: string; position: number }) => {
      const { data, error } = await supabase
        .from('week_goals')
        .insert({ week_key: weekKey, text, position })
        .select()
        .single()
      if (error) throw error
      return data as WeekGoal
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['week_goals', data.week_key] })
    },
  })
}

export function useUpdateWeekGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, weekKey, ...updates }: Partial<WeekGoal> & { id: string; weekKey: string }) => {
      const { data, error } = await supabase
        .from('week_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { ...data, weekKey } as WeekGoal & { weekKey: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['week_goals', data.weekKey] })
    },
  })
}

export function useDeleteWeekGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, weekKey }: { id: string; weekKey: string }) => {
      const { error } = await supabase.from('week_goals').delete().eq('id', id)
      if (error) throw error
      return { weekKey }
    },
    onSuccess: ({ weekKey }) => {
      queryClient.invalidateQueries({ queryKey: ['week_goals', weekKey] })
    },
  })
}
