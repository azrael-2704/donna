-- ============================================================================
-- Donna OS — Full Database Schema
-- Supabase (PostgreSQL + pgvector)
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "pgvector" with schema public;
create extension if not exists "pg_cron"  with schema extensions;

-- ─── Users (profile extension of auth.users) ────────────────────────────────

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text        not null unique,
  display_name text        not null default '',
  avatar_url   text,
  xp           integer     not null default 0,
  level        integer     not null default 1,
  streak_days  integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_users_email      on public.users (email);
create index idx_users_created_at on public.users (created_at);

-- ─── Conversations ──────────────────────────────────────────────────────────

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  title      text        not null default 'New Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversations_user_id    on public.conversations (user_id);
create index idx_conversations_created_at on public.conversations (created_at);

-- ─── Messages ───────────────────────────────────────────────────────────────

create type public.message_sender as enum ('user', 'agent', 'system');
create type public.message_type   as enum ('voice', 'text', 'system', 'script_result');

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid               not null references public.conversations(id) on delete cascade,
  user_id         uuid               not null references public.users(id) on delete cascade,
  sender          public.message_sender not null default 'user',
  type            public.message_type   not null default 'text',
  content         text               not null,
  audio_url       text,
  metadata        jsonb              default '{}'::jsonb,
  created_at      timestamptz        not null default now()
);

create index idx_messages_user_id         on public.messages (user_id);
create index idx_messages_conversation_id on public.messages (conversation_id);
create index idx_messages_created_at      on public.messages (created_at);

-- ─── Scripts ────────────────────────────────────────────────────────────────

create type public.script_status as enum (
  'draft', 'auditing', 'approved', 'running', 'paused', 'failed', 'completed'
);

create table public.scripts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid                not null references public.users(id) on delete cascade,
  name          text                not null,
  description   text                not null default '',
  code          text                not null default '',
  language      text                not null default 'python',
  status        public.script_status not null default 'draft',
  schedule_cron text,
  last_run_at   timestamptz,
  last_error    text,
  run_count     integer             not null default 0,
  created_at    timestamptz         not null default now(),
  updated_at    timestamptz         not null default now()
);

create index idx_scripts_user_id    on public.scripts (user_id);
create index idx_scripts_status     on public.scripts (status);
create index idx_scripts_created_at on public.scripts (created_at);

-- ─── Script Logs ────────────────────────────────────────────────────────────

create type public.script_log_status as enum ('success', 'error', 'warning');

create table public.script_logs (
  id          uuid primary key default gen_random_uuid(),
  script_id   uuid                   not null references public.scripts(id) on delete cascade,
  user_id     uuid                   not null references public.users(id)   on delete cascade,
  status      public.script_log_status not null default 'success',
  output      text                   not null default '',
  error_trace text,
  duration_ms integer                not null default 0,
  created_at  timestamptz            not null default now()
);

create index idx_script_logs_script_id  on public.script_logs (script_id);
create index idx_script_logs_user_id    on public.script_logs (user_id);
create index idx_script_logs_status     on public.script_logs (status);
create index idx_script_logs_created_at on public.script_logs (created_at);

-- ─── Memories ───────────────────────────────────────────────────────────────

create type public.memory_category as enum (
  'preference', 'goal', 'habit', 'event', 'insight', 'relationship'
);

create table public.memories (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid                  not null references public.users(id) on delete cascade,
  content           text                  not null,
  embedding         vector(1536),
  category          public.memory_category not null default 'insight',
  importance        float                 not null default 0.5 check (importance >= 0 and importance <= 1),
  source_message_id uuid                  references public.messages(id) on delete set null,
  created_at        timestamptz           not null default now()
);

create index idx_memories_user_id    on public.memories (user_id);
create index idx_memories_category   on public.memories (category);
create index idx_memories_created_at on public.memories (created_at);

-- HNSW index for fast similarity search on embeddings
create index idx_memories_embedding on public.memories
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ─── Habits ─────────────────────────────────────────────────────────────────

create type public.habit_frequency as enum ('daily', 'weekly', 'monthly');

create table public.habits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid                  not null references public.users(id) on delete cascade,
  name            text                  not null,
  description     text                  not null default '',
  frequency       public.habit_frequency not null default 'daily',
  xp_reward       integer               not null default 10,
  streak          integer               not null default 0,
  completed_today boolean               not null default false,
  created_at      timestamptz           not null default now(),
  updated_at      timestamptz           not null default now()
);

create index idx_habits_user_id    on public.habits (user_id);
create index idx_habits_created_at on public.habits (created_at);

-- ─── Quests ─────────────────────────────────────────────────────────────────

create type public.quest_status as enum ('active', 'completed', 'failed');

create table public.quests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid               not null references public.users(id) on delete cascade,
  title       text               not null,
  description text               not null default '',
  xp_reward   integer            not null default 50,
  status      public.quest_status not null default 'active',
  due_date    timestamptz,
  created_at  timestamptz        not null default now(),
  updated_at  timestamptz        not null default now()
);

create index idx_quests_user_id    on public.quests (user_id);
create index idx_quests_status     on public.quests (status);
create index idx_quests_created_at on public.quests (created_at);

-- ─── Integration Credentials ────────────────────────────────────────────────

create table public.integration_credentials (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid        not null references public.users(id) on delete cascade,
  service               text        not null,
  credentials_encrypted text        not null,
  is_active             boolean     not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, service)
);

create index idx_integration_credentials_user_id on public.integration_credentials (user_id);
create index idx_integration_credentials_service on public.integration_credentials (service);

-- ============================================================================
-- Updated-at trigger helper
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to every table with an updated_at column
create trigger set_updated_at before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.conversations
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.scripts
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.habits
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.quests
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.integration_credentials
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

alter table public.users                    enable row level security;
alter table public.conversations            enable row level security;
alter table public.messages                 enable row level security;
alter table public.scripts                  enable row level security;
alter table public.script_logs              enable row level security;
alter table public.memories                 enable row level security;
alter table public.habits                   enable row level security;
alter table public.quests                   enable row level security;
alter table public.integration_credentials  enable row level security;

-- ─── Users ──────────────────────────────────────────────────────────────────

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ─── Conversations ─────────────────────────────────────────────────────────

create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- ─── Messages ───────────────────────────────────────────────────────────────

create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "Users can create own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

-- ─── Scripts ────────────────────────────────────────────────────────────────

create policy "Users can view own scripts"
  on public.scripts for select
  using (auth.uid() = user_id);

create policy "Users can create own scripts"
  on public.scripts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scripts"
  on public.scripts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own scripts"
  on public.scripts for delete
  using (auth.uid() = user_id);

-- ─── Script Logs ────────────────────────────────────────────────────────────

create policy "Users can view own script logs"
  on public.script_logs for select
  using (auth.uid() = user_id);

create policy "Users can create own script logs"
  on public.script_logs for insert
  with check (auth.uid() = user_id);

-- ─── Memories ───────────────────────────────────────────────────────────────

create policy "Users can view own memories"
  on public.memories for select
  using (auth.uid() = user_id);

create policy "Users can create own memories"
  on public.memories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own memories"
  on public.memories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own memories"
  on public.memories for delete
  using (auth.uid() = user_id);

-- ─── Habits ─────────────────────────────────────────────────────────────────

create policy "Users can view own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can create own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on public.habits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- ─── Quests ─────────────────────────────────────────────────────────────────

create policy "Users can view own quests"
  on public.quests for select
  using (auth.uid() = user_id);

create policy "Users can create own quests"
  on public.quests for insert
  with check (auth.uid() = user_id);

create policy "Users can update own quests"
  on public.quests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own quests"
  on public.quests for delete
  using (auth.uid() = user_id);

-- ─── Integration Credentials ────────────────────────────────────────────────

create policy "Users can view own credentials"
  on public.integration_credentials for select
  using (auth.uid() = user_id);

create policy "Users can create own credentials"
  on public.integration_credentials for insert
  with check (auth.uid() = user_id);

create policy "Users can update own credentials"
  on public.integration_credentials for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own credentials"
  on public.integration_credentials for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- Auto-create user profile on signup (auth trigger)
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
