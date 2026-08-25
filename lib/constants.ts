import type { TaskCategory, OfferStatus, TaskStatus } from './types'

export const TASK_CATEGORIES: { value: TaskCategory; label: string; icon: string }[] = [
  { value: 'offer_conception', label: 'Concepção de oferta', icon: '💡' },
  { value: 'lp_design', label: 'Design da LP', icon: '🎨' },
  { value: 'ad_copy', label: 'Copy dos criativos', icon: '✍️' },
  { value: 'creative', label: 'Criativo', icon: '🖼️' },
  { value: 'media_buy', label: 'Compra de mídia', icon: '📊' },
  { value: 'other', label: 'Outro', icon: '📌' },
]

export const OFFER_STATUSES: { value: OfferStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Rascunho', color: '#6B7280' },
  { value: 'development', label: 'Em desenvolvimento', color: '#F59E0B' },
  { value: 'active', label: 'Ativa', color: '#10B981' },
  { value: 'paused', label: 'Pausada', color: '#0EA5E9' },
  { value: 'ended', label: 'Encerrada', color: '#EF4444' },
]

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendente', color: '#6B7280' },
  { value: 'in_progress', label: 'Em andamento', color: '#F59E0B' },
  { value: 'done', label: 'Feita', color: '#10B981' },
]

export const ASSIGNEE_COLORS: Record<string, string> = {
  Matheus: '#7C3AED',
  Kauan: '#0EA5E9',
}

export const DEFAULT_OFFER_EMOJIS = ['🎯', '🚀', '💎', '🔥', '⚡', '🌟', '💰', '📈', '🎪', '🏆']
