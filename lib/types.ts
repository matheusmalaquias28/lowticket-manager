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
  links: TaskLink[]
  position: number
  created_at: string
  updated_at: string
}

export interface AcervoLink {
  label: string
  url: string
}

export interface AcervoCard {
  id: string
  title: string
  content: string
  links: AcervoLink[]
  color: string
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

export type ContingenciaStatus = 'active' | 'blocked' | 'warming' | 'disabled' | 'restricted'
export type ContingenciaAccountType = 'personal' | 'business' | 'creator'

export interface ContingenciaBM {
  id: string
  name: string
  bm_id?: string
  admin_email?: string
  status: ContingenciaStatus
  ad_account_count?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface ContingenciaAdAccount {
  id: string
  nickname: string
  account_id?: string
  bm_id?: string
  status: ContingenciaStatus
  daily_limit?: number
  spend_limit?: number
  pixel_id?: string
  currency?: string
  country?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ContingenciaPage {
  id: string
  name: string
  page_id?: string
  page_url?: string
  niche?: string
  bm_id?: string
  status: ContingenciaStatus
  followers?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface ContingenciaInstagram {
  id: string
  username: string
  profile_url?: string
  linked_page_id?: string
  status: ContingenciaStatus
  followers?: number
  account_type?: ContingenciaAccountType
  notes?: string
  created_at: string
  updated_at: string
}

// ─── Utmify ───────────────────────────────────────────────────────────────────

export interface UtmifyProductMetric {
  productName: string
  count: number
  revenue: number // centavos
}

export interface UtmifyHourlyMetric {
  hour: number
  revenue_cents: number
  profit_cents: number
  investment_cents: number
}

export interface UtmifySnapshot {
  id: string
  date: string // YYYY-MM-DD
  dashboard_id?: string
  // Receita em centavos
  gross_revenue_cents: number
  net_revenue_cents: number
  profit_cents: number
  pending_revenue_cents: number
  // Pedidos
  total_orders: number
  approved_orders: number
  pending_orders: number
  refunded_orders: number
  // Anúncios em centavos
  ad_spend_cents: number
  meta_spend_cents: number
  tiktok_spend_cents: number
  google_spend_cents: number
  // Métricas
  roi?: number
  roas?: number
  cpa_cents?: number
  avg_ticket_cents?: number
  profit_margin?: number
  clicks?: number
  // Pagamentos
  pix_orders: number
  card_orders: number
  card_refused: number
  // JSON
  products_data: UtmifyProductMetric[]
  hourly_data: UtmifyHourlyMetric[]
  // Meta
  synced_at: string
  created_at: string
}

// ─── Radar de Ofertas ─────────────────────────────────────────────────────────

export interface RadarKeyword {
  id: string
  word: string
  is_active: boolean
  created_at: string
}

export type RadarOfertaStatus = 'novo' | 'analisando' | 'aprovado' | 'descartado'

export interface RadarOferta {
  id: string
  keyword_used: string
  advertiser?: string
  domain: string
  active_ads_count?: number
  days_running?: number
  niche?: string
  price?: number
  ad_link?: string
  page_link?: string
  angle?: string
  score: number
  justification?: string
  status: RadarOfertaStatus
  created_at: string
}

// ─── Creatives ────────────────────────────────────────────────────────────────

export type CreativeTag = 'untested' | 'active' | 'validated' | 'roi_supreme'

export interface OfferCreative {
  id: string
  offer_id: string
  name: string
  drive_url?: string
  image_url?: string
  tag?: CreativeTag
  created_at: string
  updated_at: string
}
