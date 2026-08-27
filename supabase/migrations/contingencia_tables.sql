-- Tabelas de Contingência
-- Execute este script no SQL Editor do Supabase

create table if not exists contingencia_bms (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  bm_id            text,
  admin_email      text,
  status           text        not null default 'active',
  ad_account_count integer,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists contingencia_ad_accounts (
  id          uuid        primary key default gen_random_uuid(),
  nickname    text        not null,
  account_id  text,
  bm_id       text,
  status      text        not null default 'active',
  daily_limit numeric,
  spend_limit numeric,
  pixel_id    text,
  currency    text        default 'BRL',
  country     text        default 'BR',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists contingencia_pages (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  page_id    text,
  page_url   text,
  niche      text,
  bm_id      text,
  status     text        not null default 'active',
  followers  integer,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contingencia_instagrams (
  id              uuid        primary key default gen_random_uuid(),
  username        text        not null,
  profile_url     text,
  linked_page_id  text,
  status          text        not null default 'active',
  followers       integer,
  account_type    text        default 'business',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS: permitir acesso a usuários autenticados
alter table contingencia_bms           enable row level security;
alter table contingencia_ad_accounts   enable row level security;
alter table contingencia_pages         enable row level security;
alter table contingencia_instagrams    enable row level security;

create policy "Authenticated users can manage BMs"
  on contingencia_bms for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage ad accounts"
  on contingencia_ad_accounts for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage pages"
  on contingencia_pages for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage instagrams"
  on contingencia_instagrams for all to authenticated using (true) with check (true);
