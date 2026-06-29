SQL — три блока в SQL Editor
Блок 1 — таблицы:
sqlcreate table public.push_token (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile(id) on delete cascade,
  expo_token text not null unique,
  platform text not null check (platform in ('ios','android')),
  updated_at timestamptz not null default now()
);
create index idx_push_token_user on public.push_token (user_id);

create table public.day_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile(id) on delete cascade,
  day date not null,
  rolling_context jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create unique index uniq_day_memory_user_day on public.day_memory (user_id, day);

create table public.daily_report (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile(id) on delete cascade,
  day date not null,
  focus_pct int,
  drift_pct int,
  pause_pct int,
  answers_count int,
  ai_summary text,
  user_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uniq_daily_report_user_day on public.daily_report (user_id, day);
Блок 2 — включить RLS:
sqlalter table public.push_token enable row level security;
alter table public.day_memory enable row level security;
alter table public.daily_report enable row level security;
Блок 3 — политики. Тут логика владения по user_id. Нюанс по каждой:
sql-- PUSH_TOKEN: клиент регистрирует/обновляет токен своего устройства
create policy "push_token select" on public.push_token for select using (auth.uid() = user_id);
create policy "push_token insert" on public.push_token for insert with check (auth.uid() = user_id);
create policy "push_token update" on public.push_token for update using (auth.uid() = user_id);

-- DAY_MEMORY: пишет/читает сервер (генератор); клиенту даём только чтение своих
create policy "day_memory select" on public.day_memory for select using (auth.uid() = user_id);

-- DAILY_REPORT: считает сервер (report-функция); клиент читает + правит заметку
create policy "daily_report select" on public.daily_report for select using (auth.uid() = user_id);
create policy "daily_report update" on public.daily_report for update using (auth.uid() 