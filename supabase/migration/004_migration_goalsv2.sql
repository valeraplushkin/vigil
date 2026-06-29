alter table public.goal add column if not exists description text;
alter table public.goal add column if not exists progress_pct int not null default 0
  check (progress_pct between 0 and 100);
alter table public.goal add column if not exists started_at timestamptz not null default now();
alter table public.goal add column if not exists closed_at timestamptz;

-- снять старый guard «одна активная цель на день»
drop index if exists uniq_goal_active_per_day;

-- новый guard: одна активная цель на пользователя (последовательность целей)
create unique index if not exists uniq_goal_active_per_user
  on public.goal (user_id) where status = 'active';

alter table public.answer add column if not exists progress_pct int
  check (progress_pct between 0 and 100);
alter table public.answer add column if not exists goal_id uuid
  references public.goal(id) on delete set null;

create index if not exists idx_answer_goal on public.answer (goal_id);


alter table public.settings add column if not exists daily_report_after time not null default '20:00';

create table if not exists public.goal_report (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null unique references public.goal(id) on delete cascade,
  user_id uuid not null references public.profile(id) on delete cascade,
  answers_count int,
  duration_minutes int,
  first_answer_at timestamptz,
  last_answer_at timestamptz,
  final_progress_pct int,
  goal_status text,                 -- done | dropped | active (срез на момент разбора)
  ai_summary text,
  created_at timestamptz not null default now()
);

alter table public.goal_report enable row level security;

create policy "goal_report select" on public.goal_report
  for select using (auth.uid() = user_id);

alter table public.daily_report add column if not exists goals_done int default 0;
alter table public.daily_report add column if not exists goals_in_progress int default 0;