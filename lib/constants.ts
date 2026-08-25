import type { TaskCategory, OfferStatus, TaskStatusConfig } from './types'

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

// Fallback quando o banco ainda não tem a tabela app_settings
export const DEFAULT_TASK_STATUSES: TaskStatusConfig[] = [
  { id: 'pending', label: 'Pendente', color: '#6B7280' },
  { id: 'in_progress', label: 'Em andamento', color: '#F59E0B' },
  { id: 'done', label: 'Feita', color: '#10B981' },
]

export const ASSIGNEE_COLORS: Record<string, string> = {
  Matheus: '#7C3AED',
  Kauan: '#0EA5E9',
}

export const DEFAULT_OFFER_EMOJIS = ['🎯', '🚀', '💎', '🔥', '⚡', '🌟', '💰', '📈', '🎪', '🏆']

// Tarefas padrão criadas ao usar "Criar Nova Oferta"
export const DEFAULT_OFFER_TASK_TEMPLATES: {
  title: string
  category: TaskCategory
  day_of_week: number
}[] = [
  { title: 'Criar copy da LP', category: 'ad_copy', day_of_week: 1 },
  { title: 'Criar MVP da oferta', category: 'offer_conception', day_of_week: 1 },
  { title: 'Modelar anúncios', category: 'creative', day_of_week: 2 },
  { title: 'Configurar Hotmart', category: 'other', day_of_week: 3 },
  { title: 'Configurar Pixel e Utmify', category: 'media_buy', day_of_week: 3 },
  { title: 'Configurar Order Bumps', category: 'offer_conception', day_of_week: 4 },
]
