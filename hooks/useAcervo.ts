'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AcervoCard } from '@/lib/types'

export function useAcervoCards() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['acervo_cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acervo_cards')
        .select('*')
        .order('position', { ascending: true })
      if (error) throw error
      return data as AcervoCard[]
    },
  })
}

export function useCreateAcervoCard() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Pick<AcervoCard, 'title' | 'content' | 'links' | 'color' | 'position'>) => {
      const { data, error } = await supabase.from('acervo_cards').insert(payload).select().single()
      if (error) throw error
      return data as AcervoCard
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acervo_cards'] }),
  })
}

export function useUpdateAcervoCard() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AcervoCard> & { id: string }) => {
      const { data, error } = await supabase
        .from('acervo_cards')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as AcervoCard
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acervo_cards'] }),
  })
}

export function useDeleteAcervoCard() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('acervo_cards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acervo_cards'] }),
  })
}
