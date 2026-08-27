'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RadarKeyword, RadarOferta, RadarOfertaStatus } from '@/lib/types'

// ─── Keywords ─────────────────────────────────────────────────────────────────

export function useRadarKeywords() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['radar_keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_keywords')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as RadarKeyword[]
    },
  })
}

export function useCreateRadarKeyword() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (word: string) => {
      const { data, error } = await supabase
        .from('radar_keywords')
        .insert({ word: word.trim() })
        .select()
        .single()
      if (error) throw error
      return data as RadarKeyword
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radar_keywords'] }),
  })
}

export function useToggleRadarKeyword() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('radar_keywords')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radar_keywords'] }),
  })
}

export function useDeleteRadarKeyword() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('radar_keywords').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radar_keywords'] }),
  })
}

// ─── Ofertas ──────────────────────────────────────────────────────────────────

export function useRadarOfertas() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['radar_ofertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radar_ofertas')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as RadarOferta[]
    },
  })
}

export function useUpdateRadarOfertaStatus() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RadarOfertaStatus }) => {
      const { error } = await supabase
        .from('radar_ofertas')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radar_ofertas'] }),
  })
}

export function useDeleteRadarOferta() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('radar_ofertas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radar_ofertas'] }),
  })
}
