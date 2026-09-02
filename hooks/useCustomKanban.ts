'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { CustomColumn, CustomCard, KanbanLabel, KanbanCreative, AssigneeName, TaskLink, ChecklistItem } from '@/lib/types'

// ─── Columns ────────────────────────────────────────────────────────────────

export function useCustomColumns() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['kanban_columns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('position', { ascending: true })
      if (error) throw error
      return data as CustomColumn[]
    },
  })
}

export function useCreateColumn() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Pick<CustomColumn, 'name' | 'color' | 'position'>) => {
      const { data, error } = await supabase.from('kanban_columns').insert(payload).select().single()
      if (error) throw error
      return data as CustomColumn
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban_columns'] }),
  })
}

export function useUpdateColumn() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomColumn> & { id: string }) => {
      const { data, error } = await supabase.from('kanban_columns').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as CustomColumn
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban_columns'] }),
  })
}

export function useDeleteColumn() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kanban_columns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban_columns'] })
      qc.invalidateQueries({ queryKey: ['kanban_cards'] })
    },
  })
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export function useCustomCards() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['kanban_cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_cards')
        .select('*')
        .order('position', { ascending: true })
      if (error) throw error
      return data as CustomCard[]
    },
  })
}

export function useCreateCard() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      column_id: string
      title: string
      position: number
      card_type?: 'open' | 'creative'
      assignee?: AssigneeName | null
      description?: string
      label_ids?: string[]
      links?: TaskLink[]
      creatives?: KanbanCreative[]
      checklist?: ChecklistItem[]
    }) => {
      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          column_id: payload.column_id,
          title: payload.title,
          position: payload.position,
          card_type: payload.card_type ?? 'open',
          assignee: payload.assignee ?? null,
          description: payload.description ?? null,
          label_ids: payload.label_ids ?? [],
          links: payload.links ?? [],
          creatives: payload.creatives ?? [],
          checklist: payload.checklist ?? [],
        })
        .select()
        .single()
      if (error) throw error
      return data as CustomCard
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban_cards'] }),
  })
}

export function useUpdateCard() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomCard> & { id: string }) => {
      const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }
      const { data, error } = await supabase
        .from('kanban_cards')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      // Se alguma coluna opcional ainda não existe no banco (migrations pendentes:
      // v8 → `links`, v14 → `checklist`), tenta novamente sem ela para não bloquear o fluxo.
      if (error && String(error.code) === '42703') {
        const detail = `${error.message ?? ''} ${error.details ?? ''}`
        const safePayload = { ...payload }
        for (const col of ['links', 'checklist'] as const) {
          if (col in safePayload && detail.includes(col)) delete safePayload[col]
        }
        const { data: d2, error: e2 } = await supabase
          .from('kanban_cards')
          .update(safePayload)
          .eq('id', id)
          .select()
          .single()
        if (e2) throw e2
        return d2 as CustomCard
      }

      if (error) throw error
      return data as CustomCard
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban_cards'] }),
  })
}

export function useDeleteCard() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kanban_cards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban_cards'] }),
  })
}

// ─── Labels (app_settings) ───────────────────────────────────────────────────

export function useKanbanLabels() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['kanban_labels'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'kanban_labels')
        .single()
      return (data?.value ?? []) as KanbanLabel[]
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  })
}

export function useSaveKanbanLabels() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (labels: KanbanLabel[]) => {
      const { error } = await supabase.from('app_settings').upsert({
        key: 'kanban_labels',
        value: labels,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban_labels'] }),
  })
}
