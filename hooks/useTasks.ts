'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

export function useTasks(weekKey: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks', weekKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, offer:offers(id, name, color, emoji)')
        .eq('week_key', weekKey)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Task[]
    },
  })
}

export function useCreateTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data, error } = await supabase.from('tasks').insert(task).select().single()
      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.week_key] })
    },
  })
}

export function useUpdateTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.week_key] })
      if (data.original_week_key) {
        queryClient.invalidateQueries({ queryKey: ['tasks', data.original_week_key] })
      }
    },
  })
}

export function useDeleteTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, weekKey }: { id: string; weekKey: string }) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      return { weekKey }
    },
    onSuccess: ({ weekKey }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', weekKey] })
    },
  })
}
