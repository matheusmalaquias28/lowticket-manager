'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { OfferCreative, CreativeTag } from '@/lib/types'

export function useCreatives(offerId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['creatives', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_creatives')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as OfferCreative[]
    },
    enabled: !!offerId,
  })
}

export function useCreateCreative() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (creative: Pick<OfferCreative, 'offer_id' | 'name'> & { drive_url?: string; image_url?: string; tag?: CreativeTag }) => {
      const { data, error } = await supabase.from('offer_creatives').insert(creative).select().single()
      if (error) throw error
      return data as OfferCreative
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creatives', data.offer_id] })
    },
  })
}

export function useUpdateCreative() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, offer_id, ...updates }: Partial<OfferCreative> & { id: string; offer_id: string }) => {
      const { data, error } = await supabase
        .from('offer_creatives')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as OfferCreative
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creatives', data.offer_id] })
    },
  })
}

export function useDeleteCreative() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, offer_id }: { id: string; offer_id: string }) => {
      const { error } = await supabase.from('offer_creatives').delete().eq('id', id)
      if (error) throw error
      return offer_id
    },
    onSuccess: (offer_id) => {
      queryClient.invalidateQueries({ queryKey: ['creatives', offer_id] })
    },
  })
}
