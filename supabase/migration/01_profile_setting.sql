Блок 1 — таблицы:
sqlcreate table public.profile (
  id uuid primary key references auth.users(id) on delete cascade,
  tz text not null default 'UTC',
  ai_context text,
  ai_tone text not null default 'neutral',
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  user_id uuid primary key references public.profile(id) on delete cascade,
  freq_level text not null default 'med' check (freq_level in ('low','med','high')),
  window_start time not null default '09:00',
  window_end time not null default '19:00',
  mode_passive boolean not null default true,
  mode_active boolean not null default false,
  push_enabled boolean not null default false,
  next_question_at timestamptz
);

create index idx_settings_next_question_at on public.settings (next_question_at);
Блок 2 — RLS и политики «только свои строки»:
sqlalter table public.profile enable row level security;
alter table public.settings enable row level security;

create policy "own profile select" on public.profile
  for select using (auth.uid() = id);
create policy "own profile update" on public.profile
  for update using (auth.uid() = id);

create policy "own settings select" on public.settings
  for select using (auth.uid() = user_id);
create policy "own settings update" on public.settings
  for update using (auth.uid() = user_id);
Блок 3 — триггер автосоздания:
sqlcreate or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profile (id) values (new.id);
  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
