# LOWTICKET MANAGER — PROMPT COMPLETO PARA CLAUDE CODE (CURSOR)

Cole este documento inteiro como primeira mensagem no Claude Code dentro do Cursor. Ele contém tudo que o sistema precisa para ser construído do zero, sem perguntas.

---

## CONTEXTO DO PROJETO

Construa um sistema completo de gerenciamento de ofertas low ticket chamado **Lowticket Manager**. É uma plataforma usada por dois usuários fixos — **Matheus** e **Kauan** — para organizar o ciclo semanal de criação, desenvolvimento e escalonamento de ofertas digitais. O sistema substitui o uso do Trello e centraliza kanban semanal, gestão de ofertas, tarefas recorrentes, histórico e notificações push no celular.

---

## STACK TÉCNICA (siga à risca)

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Deploy | Vercel |
| Banco de dados | Supabase (Postgres + Auth + Realtime) |
| Estilo | Tailwind CSS + shadcn/ui |
| Drag and Drop | @dnd-kit/core + @dnd-kit/sortable |
| Push Notifications | OneSignal (Web SDK) |
| Fontes | Manrope (Google Fonts) — única fonte do projeto |
| Ícones | lucide-react |
| Datas | date-fns |
| State server | TanStack Query (React Query v5) |

---

## DESIGN SYSTEM (implemente com exatidão)

### Tema
Dark mode exclusivo. Sem toggle de tema.

### Paleta de cores
```css
/* Backgrounds */
--bg-base: #0A0A0F;          /* fundo principal */
--bg-surface: #111118;       /* cards, modais */
--bg-elevated: #1A1A24;      /* hover states, inputs */
--bg-border: #22222E;        /* bordas sutis */

/* Brand */
--brand: #7C3AED;            /* violeta principal */
--brand-light: #8B5CF6;      /* hover do brand */
--brand-dim: #7C3AED1A;      /* backgrounds com brand */

/* Status */
--status-pending: #6B7280;   /* cinza — pendente */
--status-progress: #F59E0B;  /* âmbar — em andamento */
--status-done: #10B981;      /* verde — feita */
--status-delayed: #EF4444;   /* vermelho — atrasada */

/* Assignees */
--matheus: #7C3AED;          /* violeta */
--kauan: #0EA5E9;            /* azul */

/* Texto */
--text-primary: #F0F0F8;
--text-secondary: #9090A8;
--text-muted: #5A5A70;
```

### Tipografia
- Fonte: `Manrope` (weights: 400, 500, 600, 700, 800)
- Importar via `next/font/google`
- Aplicar globalmente no `layout.tsx`

### Componentes visuais
- **Border radius:** `rounded-xl` nos cards, `rounded-2xl` nos modais
- **Sombras:** `shadow-[0_0_0_1px_#22222E]` nos cards (borda sutil sem sombra dura)
- **Hover nos cards:** `hover:shadow-[0_0_0_1px_#7C3AED40] hover:bg-[#1A1A24]` com `transition-all duration-200`
- **Botões primários:** `bg-[#7C3AED] hover:bg-[#8B5CF6]` com `transition-colors duration-150` e escala sutil `active:scale-[0.98]`
- **Botões secundários:** `bg-[#1A1A24] border border-[#22222E] hover:border-[#7C3AED40]`
- **Inputs:** fundo `#111118`, borda `#22222E`, focus `border-[#7C3AED]` com `ring-[#7C3AED20]`
- **Badges de status:** pills pequenas com `text-xs font-600` e cor do status
- **Separadores:** `border-[#22222E]`
- **Scrollbars customizadas:** finas, cor `#22222E`, thumb `#7C3AED40`

### Animações
```css
/* Use framer-motion para: */
- Entrada de modais: scale 0.95→1 + opacity 0→1, duration 200ms, ease out
- Cards no kanban: layout animation automático do dnd-kit
- Toasts: slide from bottom
- Hover nos botões: scale e cor suave
```
Adicione `framer-motion` como dependência.

---

## ESTRUTURA DE ARQUIVOS

```
lowticket/
├── app/
│   ├── layout.tsx                    # Manrope, dark body, providers
│   ├── page.tsx                      # redirect → /kanban
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # tela de login
│   ├── (app)/
│   │   ├── layout.tsx                # sidebar + header + auth guard
│   │   ├── kanban/
│   │   │   └── page.tsx              # visão principal
│   │   ├── offers/
│   │   │   ├── page.tsx              # painel de ofertas ativas
│   │   │   └── [id]/
│   │   │       └── page.tsx          # dossiê da oferta
│   │   └── settings/
│   │       └── page.tsx              # templates recorrentes + perfil
│   └── api/
│       ├── cron/
│       │   └── weekly-tasks/
│       │       └── route.ts          # gera tarefas da semana (Vercel Cron)
│       ├── notify/
│       │   └── route.ts              # envia push via OneSignal REST
│       └── webhooks/
│           └── make/
│               └── route.ts          # recebe webhooks do Make (futuro)
├── components/
│   ├── kanban/
│   │   ├── KanbanBoard.tsx
│   │   ├── DayColumn.tsx
│   │   ├── TaskCard.tsx
│   │   └── WeekNavigator.tsx
│   ├── tasks/
│   │   ├── TaskModal.tsx             # modal de criação/edição completa
│   │   ├── ChecklistEditor.tsx
│   │   ├── LinksList.tsx
│   │   └── ReferencesUpload.tsx
│   ├── offers/
│   │   ├── OfferCard.tsx
│   │   ├── OfferDossier.tsx
│   │   ├── OfferModal.tsx
│   │   └── RecurringTemplateEditor.tsx
│   ├── ui/                           # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── UserAvatar.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── AssigneeBadge.tsx
│       ├── DelayedBadge.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient
│   │   ├── server.ts                 # createServerClient
│   │   └── middleware.ts
│   ├── onesignal.ts                  # funções de push
│   ├── weeks.ts                      # helpers de semana (getWeekKey, etc)
│   ├── types.ts                      # todos os tipos TypeScript
│   └── constants.ts                  # dias da semana, categorias, etc
├── hooks/
│   ├── useCurrentWeek.ts
│   ├── useTasks.ts
│   ├── useOffers.ts
│   └── usePushNotifications.ts
├── public/
│   ├── sw.js                         # service worker OneSignal
│   ├── OneSignalSDKWorker.js         # necessário pelo OneSignal
│   └── manifest.json                 # PWA manifest
├── supabase/
│   ├── schema.sql                    # schema completo
│   └── seed.sql                      # dados iniciais (2 users)
├── middleware.ts                     # proteção de rotas
├── .env.local.example
├── vercel.json                       # cron jobs
└── package.json
```

---

## SCHEMA DO BANCO DE DADOS (Supabase)

Execute este SQL no Supabase SQL Editor:

```sql
-- Habilitar extensão de UUID
create extension if not exists "uuid-ossp";

-- =====================
-- PROFILES (extiende auth.users)
-- =====================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null check (name in ('Matheus', 'Kauan')),
  email text not null,
  avatar_color text not null default '#7C3AED',
  onesignal_player_id text,           -- ID do device no OneSignal
  created_at timestamptz default now()
);

-- RLS: cada usuário vê todos os profiles (workspace compartilhado)
alter table public.profiles enable row level security;
create policy "profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- =====================
-- OFFERS
-- =====================
create table public.offers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  niche text,
  status text not null default 'draft'
    check (status in ('draft', 'development', 'active', 'paused', 'ended')),
  lp_url text,
  checkout_url text,
  pixel_id text,
  weekly_budget numeric(10,2),
  notes text,
  color text default '#7C3AED',       -- cor do badge da oferta no kanban
  emoji text default '🎯',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.offers enable row level security;
create policy "offers viewable by authenticated"
  on public.offers for all to authenticated using (true);

-- =====================
-- RECURRING TEMPLATES (tarefas que se repetem toda semana por oferta)
-- =====================
create table public.recurring_templates (
  id uuid default uuid_generate_v4() primary key,
  offer_id uuid references public.offers(id) on delete cascade,
  title text not null,
  description text,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Dom,1=Seg,...,6=Sab
  assignee_name text not null check (assignee_name in ('Matheus', 'Kauan')),
  category text not null default 'other'
    check (category in ('offer_conception','lp_design','ad_copy','creative','media_buy','other')),
  default_checklist jsonb default '[]',  -- array de {text: string}
  due_time text,                          -- ex: "18:00"
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.recurring_templates enable row level security;
create policy "templates viewable by authenticated"
  on public.recurring_templates for all to authenticated using (true);

-- =====================
-- TASKS
-- =====================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  link_url text,                          -- link clicável (alternativa à descrição)
  week_key text not null,                 -- formato: "2026-W35"
  day_of_week integer not null check (day_of_week between 0 and 6),
  assignee_name text not null check (assignee_name in ('Matheus', 'Kauan')),
  created_by uuid references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done')),
  offer_id uuid references public.offers(id) on delete set null,
  category text not null default 'other'
    check (category in ('offer_conception','lp_design','ad_copy','creative','media_buy','other')),
  checklist jsonb default '[]',           -- array de {id, text, done}
  links jsonb default '[]',              -- array de {label, url}
  references jsonb default '[]',         -- array de {type: 'image'|'url', value, label}
  due_date date,
  due_time text,                          -- "HH:MM"
  -- Controle de atraso
  is_delayed boolean default false,
  original_week_key text,                -- semana original se foi arrastada
  original_day_of_week integer,
  -- Template que gerou essa task (se recorrente)
  from_template_id uuid references public.recurring_templates(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;
create policy "tasks viewable by authenticated"
  on public.tasks for all to authenticated using (true);

-- =====================
-- WEEKS (registro de semanas geradas)
-- =====================
create table public.weeks (
  week_key text primary key,            -- "2026-W35"
  start_date date not null,             -- segunda-feira da semana
  end_date date not null,               -- domingo
  generated_at timestamptz,
  created_at timestamptz default now()
);

alter table public.weeks enable row level security;
create policy "weeks viewable by authenticated"
  on public.weeks for all to authenticated using (true);

-- =====================
-- TRIGGERS: updated_at automático
-- =====================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at before update on public.tasks
  for each row execute function update_updated_at();

create trigger offers_updated_at before update on public.offers
  for each row execute function update_updated_at();

-- =====================
-- REALTIME: habilitar nas tabelas principais
-- =====================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.offers;
```

---

## TIPOS TYPESCRIPT (lib/types.ts)

```typescript
export type AssigneeName = 'Matheus' | 'Kauan';

export type TaskStatus = 'pending' | 'in_progress' | 'done';

export type OfferStatus = 'draft' | 'development' | 'active' | 'paused' | 'ended';

export type TaskCategory =
  | 'offer_conception'
  | 'lp_design'
  | 'ad_copy'
  | 'creative'
  | 'media_buy'
  | 'other';

export interface Profile {
  id: string;
  name: AssigneeName;
  email: string;
  avatar_color: string;
  onesignal_player_id?: string;
}

export interface Offer {
  id: string;
  name: string;
  niche?: string;
  status: OfferStatus;
  lp_url?: string;
  checkout_url?: string;
  pixel_id?: string;
  weekly_budget?: number;
  notes?: string;
  color: string;
  emoji: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskLink {
  label: string;
  url: string;
}

export interface TaskReference {
  type: 'image' | 'url';
  value: string; // URL da imagem ou link externo
  label?: string;
}

export interface RecurringTemplate {
  id: string;
  offer_id: string;
  title: string;
  description?: string;
  day_of_week: number;
  assignee_name: AssigneeName;
  category: TaskCategory;
  default_checklist: { text: string }[];
  due_time?: string;
  is_active: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  link_url?: string;
  week_key: string;
  day_of_week: number;
  assignee_name: AssigneeName;
  created_by: string;
  status: TaskStatus;
  offer_id?: string;
  offer?: Offer; // joined
  category: TaskCategory;
  checklist: ChecklistItem[];
  links: TaskLink[];
  references: TaskReference[];
  due_date?: string;
  due_time?: string;
  is_delayed: boolean;
  original_week_key?: string;
  original_day_of_week?: number;
  from_template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Week {
  week_key: string;
  start_date: string;
  end_date: string;
  generated_at?: string;
}
```

---

## HELPERS DE SEMANA (lib/weeks.ts)

```typescript
import { format, startOfWeek, endOfWeek, addWeeks, getISOWeek, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Gera chave da semana no formato "2026-W35"
export function getWeekKey(date: Date = new Date()): string {
  const week = getISOWeek(date);
  const year = getYear(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

// Retorna a segunda-feira da semana a partir da chave
export function getWeekStart(weekKey: string): Date {
  const [year, weekStr] = weekKey.split('-W');
  const week = parseInt(weekStr);
  // Calcula a data da segunda da semana ISO
  const jan4 = new Date(parseInt(year), 0, 4);
  const startOfYear = startOfWeek(jan4, { weekStartsOn: 1 });
  return addWeeks(startOfYear, week - 1);
}

export function getWeekEnd(weekKey: string): Date {
  const start = getWeekStart(weekKey);
  return endOfWeek(start, { weekStartsOn: 1 });
}

export function navigateWeek(weekKey: string, direction: 'prev' | 'next'): string {
  const start = getWeekStart(weekKey);
  const newDate = addWeeks(start, direction === 'next' ? 1 : -1);
  return getWeekKey(newDate);
}

export function formatWeekLabel(weekKey: string): string {
  const start = getWeekStart(weekKey);
  const end = getWeekEnd(weekKey);
  const startStr = format(start, "d 'de' MMM", { locale: ptBR });
  const endStr = format(end, "d 'de' MMM", { locale: ptBR });
  return `${startStr} – ${endStr}`;
}

export const DAYS_OF_WEEK = [
  { index: 1, label: 'Segunda', short: 'Seg' },
  { index: 2, label: 'Terça', short: 'Ter' },
  { index: 3, label: 'Quarta', short: 'Qua' },
  { index: 4, label: 'Quinta', short: 'Qui' },
  { index: 5, label: 'Sexta', short: 'Sex' },
  { index: 6, label: 'Sábado', short: 'Sáb' },
  { index: 0, label: 'Domingo', short: 'Dom' },
];
```

---

## FUNCIONALIDADES — ESPECIFICAÇÃO DETALHADA

### 1. AUTENTICAÇÃO

- Supabase Auth com e-mail + senha
- Middleware Next.js protege todas as rotas de `/(app)`
- Ao criar conta, um trigger Supabase insere automaticamente em `public.profiles`
- Não há cadastro público — os dois usuários são criados manualmente via Supabase Dashboard ou seed
- Seed: criar os dois usuários no Supabase Auth e inserir em profiles:
  - Matheus → cor `#7C3AED`
  - Kauan → cor `#0EA5E9`

Tela de login: logo + nome do sistema, campo e-mail, campo senha, botão "Entrar". Sem botão de cadastro visível.

### 2. KANBAN SEMANAL (`/kanban`)

**Layout:**
- Header com semana atual (ex: "25 de ago – 31 de ago, 2026") e botões `←` `→` para navegar
- Botão "Semana atual" para voltar ao presente quando navegando
- 7 colunas em ordem: Seg, Ter, Qua, Qui, Sex, Sáb, Dom
- Cada coluna tem: título do dia + data, contador de tasks, botão `+` para adicionar task
- Scroll horizontal se necessário (não quebra colunas)
- Altura das colunas: fixa com scroll interno

**Colunas — estado visual:**
- Dia atual: borda superior `#7C3AED`
- Dias passados (na semana atual): opacity reduzida, `opacity-60`
- Semanas passadas: indicador "Semana encerrada" no header, mas tarefas continuam visíveis e interativas

**Cards de tarefa:**
- Fundo `#111118`, borda `#22222E`, hover com borda violeta sutil
- Badge de status (colorido) no canto superior direito
- Badge `🔴 Atrasada` quando `is_delayed = true`
- Avatar/cor do responsável (Matheus=violeta, Kauan=azul) como bolinha no card
- Nome da oferta vinculada (se houver) como chip pequeno
- Progresso do checklist: `3/5 ✓` em texto muted
- Horário limite se tiver `due_time`
- Badge de categoria com ícone
- Clique abre `TaskModal`

**Drag and drop:**
- Arrastar entre colunas na mesma semana: muda `day_of_week`, sem flag de atraso
- Arrastar para semana diferente: só via UI de "mover para semana" no modal (não arrastar entre páginas)
- Dentro da coluna: reordena posição

**Adicionar tarefa:**
- Clicar em `+` na coluna abre `TaskModal` com o dia pré-selecionado

### 3. MODAL DE TAREFA (`TaskModal`)

Modal centralizado com overlay blur. Animação de entrada scale+fade.

**Seções do modal:**

**Header:**
- Campo de título editável inline (grande, proeminente)
- Status selector: pills clicáveis (Pendente / Em andamento / Feita)
- Botão fechar (X)

**Coluna principal (2/3 da largura):**

*Descrição ou Link:*
- Toggle: `Descrição` | `Link`
- Se descrição: textarea com placeholder "Descreva a tarefa..."
- Se link: input de URL + preview clicável do link (favicon + nome do domínio)

*Checklist:*
- Lista de itens com checkbox
- Cada item: checkbox + texto editável inline + botão deletar (aparece no hover)
- Botão "+ Adicionar item" no final
- Progresso mostrado em barra sutil acima da lista
- Drag para reordenar itens do checklist

*Links relacionados:*
- Lista de links com label + URL
- Cada linha: ícone de link + label editável + URL editável + abrir em nova aba + deletar
- Botão "+ Adicionar link"

*Referências visuais:*
- Upload de imagem (armazena na Supabase Storage) ou URL externa
- Miniaturas clicáveis (abre em fullscreen)
- Botão "+ Adicionar referência"

**Coluna lateral (1/3 da largura):**

- **Responsável:** selector com avatar Matheus/Kauan (ao mudar, dispara push notification para o novo responsável)
- **Oferta vinculada:** dropdown com search das ofertas ativas (ou "Nenhuma — tarefa avulsa")
- **Categoria:** dropdown (Concepção de oferta / Design da LP / Copy dos criativos / Criativo / Compra de mídia / Outro)
- **Dia da semana:** selector visual dos 7 dias
- **Prazo:** date picker + time picker
- **Mover para semana:** selector de semana (gera lista das próximas 4 semanas) — ao confirmar, move a task com flag `is_delayed = true` e registra `original_week_key`

*Metadados no rodapé lateral:*
- Criado por + data
- Última atualização

**Rodapé do modal:**
- Botão "Salvar" (primário)
- Botão "Excluir tarefa" (destrutivo, com confirmação)

### 4. PAINEL DE OFERTAS (`/offers`)

**Header:** título "Ofertas" + botão "Nova oferta"

**Filtros por status:** pills horizontais (Todas / Rascunho / Em dev / Ativas / Pausadas / Encerradas)

**Grid de cards de oferta:**
- Card: emoji + nome + niche badge + status badge colorido
- Barra de progresso sutil (tarefas feitas na semana atual vs total)
- Links rápidos: LP, checkout (ícones clicáveis)
- Contador: tarefas abertas desta semana
- Clique no card → `/offers/[id]` (dossiê)
- Botão de editar (⋯) no hover

**Modal de oferta (criação/edição):**
- Nome, emoji (picker), cor, nicho
- Status (select)
- URL da LP, URL do Checkout, Pixel ID
- Orçamento semanal (R$)
- Notas (textarea)

### 5. DOSSIÊ DA OFERTA (`/offers/[id]`)

**Header:** emoji + nome da oferta + status badge + botão editar

**Abas:**
- **Visão geral:** todos os campos da oferta (LP, checkout, pixel, orçamento, notas)
- **Histórico de tarefas:** lista agrupada por semana (mais recente primeiro). Cada semana: header com semana key + progresso (X/Y feitas). Tasks listadas como linhas compactas com status, responsável, categoria e checklist resumido. Clicável para abrir TaskModal.
- **Templates recorrentes:** lista dos templates configurados para essa oferta. Botão "Novo template".

**Editor de template recorrente:**
- Título, descrição, dia da semana, responsável, categoria, checklist padrão, horário limite
- Toggle ativo/inativo

### 6. GERAÇÃO AUTOMÁTICA DE SEMANA

**Endpoint:** `POST /api/cron/weekly-tasks`

**Trigger:** Vercel Cron Job configurado no `vercel.json` para rodar toda segunda-feira às 06:00 (horário de Brasília = 09:00 UTC):

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-tasks",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Lógica do endpoint:**
1. Calcula o `week_key` da semana atual
2. Verifica se a semana já foi gerada (tabela `weeks`)
3. Se não: busca todos os `recurring_templates` com `is_active = true` de ofertas com `status = 'active'`
4. Cria uma `task` para cada template com `week_key` atual, `day_of_week`, `assignee_name`, `checklist` copiado do template
5. Insere o registro na tabela `weeks`
6. Dispara notificação push para Matheus e Kauan: "Semana gerada! X novas tarefas criadas."

**Também disponível manualmente:** botão "Gerar semana" nas settings (para casos onde a semana não foi gerada automaticamente).

### 7. MOVER TAREFA PARA OUTRA SEMANA (com flag de atrasada)

Quando uma tarefa é movida para uma semana diferente da original:

```typescript
// Ao confirmar o "mover para semana" no modal:
await supabase.from('tasks').update({
  week_key: newWeekKey,
  day_of_week: newDayOfWeek,
  is_delayed: true,
  original_week_key: task.original_week_key ?? task.week_key,
  original_day_of_week: task.original_day_of_week ?? task.day_of_week,
}).eq('id', task.id);
```

O card mostra badge `🔴 Atrasada` e tooltip: "Originalmente: Semana X, [dia]".

### 8. PUSH NOTIFICATIONS (OneSignal)

**Setup OneSignal:**
1. Criar conta em onesignal.com → New App → Web Push
2. Configurar o domínio da Vercel
3. Baixar os arquivos `OneSignalSDKWorker.js` e colocar em `/public`
4. Instalar `@onesignal/onesignal-react-native` ou usar o Web SDK via script

**Variáveis de ambiente:**
```
ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...
NEXT_PUBLIC_ONESIGNAL_APP_ID=...
```

**Inicialização no client (app/(app)/layout.tsx):**
```typescript
// Inicializar OneSignal e salvar o player_id no profile do usuário
useEffect(() => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({ appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID });
    const playerId = await OneSignal.User.PushSubscription.id;
    if (playerId) {
      // Salvar no profile do usuário no Supabase
      await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', user.id);
    }
  });
}, []);
```

**Endpoint de envio (`/api/notify`):**
```typescript
// POST com body: { player_ids: string[], title: string, message: string, url?: string }
// Chama a OneSignal REST API para enviar push aos player_ids especificados
```

**Momentos de notificação:**
- **Atribuição de tarefa:** ao salvar/criar uma task, se `assignee_name` !== usuário logado, dispara push para o assignee com título da task
- **Resumo diário 9h:** Vercel Cron `0 12 * * *` (9h Brasília = 12h UTC) → busca tasks de hoje de cada usuário → envia push com resumo "Você tem X tarefas hoje"
- **2h antes do prazo:** Vercel Cron `*/30 * * * *` (a cada 30min) → busca tasks com `due_time` entre agora e 2h → dispara push individual

### 9. REALTIME (Supabase)

No componente `KanbanBoard`, subscribe para mudanças na tabela `tasks` da semana atual:

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`tasks-${weekKey}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `week_key=eq.${weekKey}`
    }, () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', weekKey] });
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [weekKey]);
```

### 10. SETTINGS (`/settings`)

**Seções:**
- **Perfil:** nome (read-only), e-mail, avatar color (picker)
- **Notificações:** botão "Ativar notificações push" (solicita permissão do browser)
- **Templates recorrentes:** visão geral de todos os templates de todas as ofertas ativas, com link para editar em cada oferta
- **Ações da semana:** botão "Gerar semana manualmente" (chama o endpoint de cron)

---

## VARIÁVEIS DE AMBIENTE (.env.local.example)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OneSignal
NEXT_PUBLIC_ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=

# Vercel Cron (segurança)
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

---

## PACKAGE.JSON — DEPENDÊNCIAS PRINCIPAIS

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "tailwindcss": "^3",
    "@tailwindcss/typography": "^0.5",
    "shadcn-ui": "latest",
    "@radix-ui/react-dialog": "^1",
    "@radix-ui/react-select": "^2",
    "@radix-ui/react-checkbox": "^1",
    "@radix-ui/react-dropdown-menu": "^2",
    "@radix-ui/react-tabs": "^1",
    "@radix-ui/react-tooltip": "^1",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^8",
    "@dnd-kit/utilities": "^3",
    "framer-motion": "^11",
    "date-fns": "^3",
    "lucide-react": "^0.400",
    "@tanstack/react-query": "^5",
    "sonner": "^1",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "class-variance-authority": "^0.7"
  }
}
```

---

## ORDEM DE CONSTRUÇÃO (siga esta sequência)

**Fase 1 — Base**
1. `npx create-next-app@latest lowticket --typescript --tailwind --app`
2. Instalar todas as dependências listadas acima
3. Configurar Tailwind com as cores customizadas do design system
4. Configurar Manrope no `layout.tsx`
5. Criar variáveis CSS no `globals.css`
6. Rodar o SQL schema no Supabase
7. Configurar `lib/supabase/client.ts` e `server.ts`
8. Configurar `middleware.ts` para proteção de rotas
9. Criar `lib/types.ts` e `lib/weeks.ts` completos

**Fase 2 — Auth**
10. Tela de login (`/login`)
11. Middleware de autenticação
12. Layout do app com sidebar e header

**Fase 3 — Kanban (core)**
13. `WeekNavigator` com navegação entre semanas
14. `KanbanBoard` com 7 colunas
15. `DayColumn` com cards
16. `TaskCard` com todos os badges
17. Drag and drop entre colunas
18. `TaskModal` completo (criação + edição)
19. Checklist interativo dentro do modal
20. Realtime subscription

**Fase 4 — Ofertas**
21. Página `/offers` com grid de cards
22. `OfferModal` (criação/edição)
23. Página `/offers/[id]` (dossiê)
24. Aba de histórico agrupado por semana
25. `RecurringTemplateEditor`

**Fase 5 — Automações**
26. Endpoint `/api/cron/weekly-tasks`
27. `vercel.json` com crons
28. Endpoint `/api/notify`
29. Integração OneSignal (frontend + notificações)
30. Cron de resumo diário 9h
31. Cron de alerta 2h antes do prazo

**Fase 6 — Settings e polimento**
32. Página `/settings`
33. Ativar push via botão nas settings
34. Animações e transições finais
35. Estados vazios (EmptyState) em todas as páginas
36. Responsividade mobile
37. PWA manifest + ícone

---

## OBSERVAÇÕES FINAIS IMPORTANTES

- **Idioma:** toda a interface em **português brasileiro**
- **Nomes fixos:** os únicos usuários são Matheus e Kauan — não há sistema de cadastro público
- **Semanas:** sempre usando ISO week (segunda como primeiro dia)
- **Tarefas avulsas:** `offer_id` é opcional — qualquer tarefa pode existir sem oferta vinculada
- **Histórico imutável:** tarefas nunca são deletadas permanentemente; ao mover entre semanas, `original_week_key` preserva a origem
- **Consistência visual:** usar `cn()` (clsx + tailwind-merge) em todos os componentes, nunca classes condicionais inline bagunçadas
- **Erros:** usar `sonner` para todos os toasts de erro e sucesso
- **Loading states:** skeleton loaders em todas as listas e kanban (não spinners)
- **Mobile:** o kanban em mobile deve ter scroll horizontal suave entre colunas (snap scroll)

---

*Documento gerado para uso no Claude Code (Cursor). Versão 1.0 — Lowticket Manager.*