'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Offer } from '@/lib/types'

export function useOffers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Offer[]
    },
  })
}

export function useOffer(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['offers', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('offers').select('*').eq('id', id).single()
      if (error) throw error
      return data as Offer
    },
    enabled: !!id,
  })
}

export function useCreateOffer() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (offer: Partial<Offer>) => {
      const { data, error } = await supabase.from('offers').insert(offer).select().single()
      if (error) throw error
      return data as Offer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}

export function useUpdateOffer() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Offer> & { id: string }) => {
      const { data, error } = await supabase.from('offers').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as Offer
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers', data.id] })
    },
  })
}

export function useDeleteOffer() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('offers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}
