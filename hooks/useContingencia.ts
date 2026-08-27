'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  ContingenciaBM,
  ContingenciaAdAccount,
  ContingenciaPage,
  ContingenciaInstagram,
} from '@/lib/types'

// ─── Business Managers ────────────────────────────────────────────────────────

export function useContingenciaBMs() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['contingencia_bms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contingencia_bms')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ContingenciaBM[]
    },
  })
}

export function useCreateBM() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<ContingenciaBM, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('contingencia_bms').insert(payload).select().single()
      if (error) throw error
      return data as ContingenciaBM
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_bms'] }),
  })
}

export function useUpdateBM() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContingenciaBM> & { id: string }) => {
      const { data, error } = await supabase
        .from('contingencia_bms')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ContingenciaBM
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_bms'] }),
  })
}

export function useDeleteBM() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contingencia_bms').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_bms'] }),
  })
}

// ─── Ad Accounts ──────────────────────────────────────────────────────────────

export function useContingenciaAdAccounts() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['contingencia_ad_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contingencia_ad_accounts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ContingenciaAdAccount[]
    },
  })
}

export function useCreateAdAccount() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<ContingenciaAdAccount, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('contingencia_ad_accounts').insert(payload).select().single()
      if (error) throw error
      return data as ContingenciaAdAccount
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_ad_accounts'] }),
  })
}

export function useUpdateAdAccount() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContingenciaAdAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('contingencia_ad_accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ContingenciaAdAccount
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_ad_accounts'] }),
  })
}

export function useDeleteAdAccount() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contingencia_ad_accounts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_ad_accounts'] }),
  })
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export function useContingenciaPages() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['contingencia_pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contingencia_pages')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ContingenciaPage[]
    },
  })
}

export function useCreateContingenciaPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<ContingenciaPage, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('contingencia_pages').insert(payload).select().single()
      if (error) throw error
      return data as ContingenciaPage
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_pages'] }),
  })
}

export function useUpdateContingenciaPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContingenciaPage> & { id: string }) => {
      const { data, error } = await supabase
        .from('contingencia_pages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ContingenciaPage
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_pages'] }),
  })
}

export function useDeleteContingenciaPage() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contingencia_pages').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_pages'] }),
  })
}

// ─── Instagram ────────────────────────────────────────────────────────────────

export function useContingenciaInstagrams() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['contingencia_instagrams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contingencia_instagrams')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ContingenciaInstagram[]
    },
  })
}

export function useCreateInstagram() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<ContingenciaInstagram, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('contingencia_instagrams').insert(payload).select().single()
      if (error) throw error
      return data as ContingenciaInstagram
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_instagrams'] }),
  })
}

export function useUpdateInstagram() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContingenciaInstagram> & { id: string }) => {
      const { data, error } = await supabase
        .from('contingencia_instagrams')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ContingenciaInstagram
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_instagrams'] }),
  })
}

export function useDeleteInstagram() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contingencia_instagrams').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contingencia_instagrams'] }),
  })
}
