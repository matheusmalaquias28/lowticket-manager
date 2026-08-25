export type AssigneeName = 'Matheus' | 'Kauan'

export type TaskStatus = string // livre para aceitar status customizados

export type OfferStatus = 'draft' | 'development' | 'active' | 'paused' | 'ended'

export type TaskCategory =
  | 'offer_conception'
  | 'lp_design'
  | 'ad_copy'
  | 'creative'
  | 'media_buy'
  | 'other'

export interface TaskStatusConfig {
  id: string    // 'pending', 'in_progress', 'done' ou slug customizado
  label: string
  color: string
}

export interface Profile {
  id: string
  name: AssigneeName
  email: string
  avatar_color: string
  onesignal_player_id?: string
}

export interface Offer {
  id: string
  name: string
  niche?: string
  status: OfferStatus
  lp_url?: string
  checkout_url?: string
  pixel_id?: string
  weekly_budget?: number
  notes?: string
  color: string
  emoji: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface TaskLink {
  label: string
  url: string
}

export interface TaskReference {
  type: 'image' | 'url'
  value: string
  label?: string
}

export interface RecurringTemplate {
  id: string
  offer_id: string
  title: string
  description?: string
  day_of_week: number
  assignee_name: AssigneeName
  category: TaskCategory
  default_checklist: { text: string }[]
  due_time?: string
  is_active: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  link_url?: string
  week_key: string
  day_of_week: number
  assignee_name: AssigneeName
  created_by: string
  status: TaskStatus
  offer_id?: string
  offer?: Offer
  category: TaskCategory
  checklist: ChecklistItem[]
  links: TaskLink[]
  references: TaskReference[]
  due_date?: string
  due_time?: string
  is_urgent: boolean
  is_delayed: boolean
  original_week_key?: string
  original_day_of_week?: number
  from_template_id?: string
  created_at: string
  updated_at: string
}

export interface KanbanLabel {
  id: string
  name: string
  color: string
}

export interface CustomColumn {
  id: string
  name: string
  color: string
  position: number
  created_at: string
}

export interface CustomCard {
  id: string
  column_id: string
  title: string
  description?: string
  label_ids: string[]
  position: number
  created_at: string
  updated_at: string
}

export interface Week {
  week_key: string
  start_date: string
  end_date: string
  generated_at?: string
}
