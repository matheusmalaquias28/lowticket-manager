'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_TASK_STATUSES } from '@/lib/constants'
import type { TaskStatusConfig } from '@/lib/types'

export function useTaskStatuses() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['app_settings', 'task_statuses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'task_statuses')
        .single()
      return (data?.value as TaskStatusConfig[]) ?? DEFAULT_TASK_STATUSES
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_TASK_STATUSES,
  })
}

export function useSaveTaskStatuses() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (statuses: TaskStatusConfig[]) => {
      const { error } = await supabase.from('app_settings').upsert({
        key: 'task_statuses',
        value: statuses,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_settings', 'task_statuses'] })
    },
  })
}
