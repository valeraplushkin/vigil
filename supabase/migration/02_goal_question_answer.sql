SQL — четыре блока в SQL Editor
Блок 1 — таблицы:
sqlcreate table public.goal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile(id) on delete cascade,
  day date not null,
  essence text not null,
  result text,
  status text not null default 'active' check (status in ('active','done','dropped')),
  created_at timestamptz not null default now()
);
create index idx_goal_user_day on public.goal (user_id, day);
create unique index uniq_goal_active_per_day
  on public.goal (user_id, day) where status = 'active';

create table public.question (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile(id) on delete cascade,
  goal_id uuid references public.goal(id) on delete set null,
  type text not null check (type in ('active','passive')),
  text text not null,
  source text not null check (source in ('llm','fallback')),
  status text not null default 'ready'
    check (status in ('ready','sent','answered','skipped','expired')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_question_user_status on public.question (user_id, status);
create index idx_question_status_scheduled on public.question (status, scheduled_for);

create table public.answer (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.question(id) on delete cascade,
  user_id uuid not null references public.profile(id) on delete cascade,
  state text check (state in ('focus','drift','pause')),
  free_text text,
  entry_point text not null check (entry_point in ('chip','text','in_app','notification')),
  created_at timestamptz not null default now()
);
create index idx_answer_user_created on public.answer (user_id, created_at);
Блок 2 — включить RLS:
sqlalter table public.goal enable row level security;
alter table public.question enable row level security;
alter table public.answer enable row level security;
Блок 3 — политики. Здесь, в отличие от profile/settings, клиент создаёт и читает строки (ставит цель, пишет ответ), поэтому добавляем и INSERT, и SELECT, и UPDATE — все с проверкой владельца:
sql-- GOAL: пользователь полностью управляет своими целями
create policy "goal select" on public.goal for select using (auth.uid() = user_id);
create policy "goal insert" on public.goal for insert with check (auth.uid() = user_id);
create policy "goal update" on public.goal for update using (auth.uid() = user_id);

-- QUESTION: клиент читает свои вопросы (создаёт их сервер, не клиент)
create policy "question select" on public.question for select using (auth.uid() = user_id);

-- ANSWER: пользователь пишет и читает свои ответы
create policy "answer select" on public.answer for select using (auth.uid() = user_id);
create policy "answer insert" on public.answer for insert with check (auth.uid() = user_id);
Обрати внимание на разницу: у QUESTION нет insert-политики для клиента — вопросы пишет Edge Function (сервер, в обход RLS), а приложение их только читает. Это прямо отражает архитектуру «генерация на сервере». А with check в insert — это «разрешаю вставку, только если ставишь user_id = свой», чтобы нельзя было записать ответ от чужого имени.
Блок 4 — проверка изоляции (тот самый тест RLS). Это псевдо-тест прямо в SQL Editor: вставим цель от текущего юзера и убедимся, что политики на месте.
sql-- покажет включённость RLS и список политик по новым таблицам
select tablename, rowsecurity from pg_tables
  where schemaname='public' and tablename in ('goal','question','answer');
select tablename, policyname, cmd from pg_policies
  where schemaname='public' and tablename in ('goal','question','answer')
  order by tablename, cmd;