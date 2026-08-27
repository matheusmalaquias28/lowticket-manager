-- Tabela de snapshots diários do Utmify
-- Execute no SQL Editor do Supabase

create table if not exists utmify_snapshots (
  id                    uuid        primary key default gen_random_uuid(),
  date                  date        not null unique,
  dashboard_id          text,
  -- Receita em centavos (BRL)
  gross_revenue_cents   bigint      not null default 0,
  net_revenue_cents     bigint      not null default 0,
  profit_cents          bigint      not null default 0,
  pending_revenue_cents bigint      not null default 0,
  -- Pedidos
  total_orders          integer     not null default 0,
  approved_orders       integer     not null default 0,
  pending_orders        integer     not null default 0,
  refunded_orders       integer     not null default 0,
  -- Anúncios em centavos
  ad_spend_cents        bigint      not null default 0,
  meta_spend_cents      bigint      not null default 0,
  tiktok_spend_cents    bigint      not null default 0,
  google_spend_cents    bigint      not null default 0,
  -- Métricas calculadas
  roi                   float,
  roas                  float,
  cpa_cents             bigint,
  avg_ticket_cents      bigint,
  profit_margin         float,
  clicks                integer     default 0,
  -- Formas de pagamento
  pix_orders            integer     not null default 0,
  card_orders           integer     not null default 0,
  card_refused          integer     not null default 0,
  -- Detalhes em JSON
  products_data         jsonb       not null default '[]',
  hourly_data           jsonb       not null default '[]',
  -- Metadados
  synced_at             timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

-- Índice para consultas por data
create index if not exists utmify_snapshots_date_idx on utmify_snapshots (date desc);

-- RLS
alter table utmify_snapshots enable row level security;

create policy "Authenticated users can read snapshots"
  on utmify_snapshots for select to authenticated using (true);

-- Apenas service role pode inserir/atualizar (via API route do cron)
create policy "Service role can manage snapshots"
  on utmify_snapshots for all to service_role using (true) with check (true);
