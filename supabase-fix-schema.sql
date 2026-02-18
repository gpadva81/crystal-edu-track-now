-- ============================================================
-- StudyTrack Schema Fix
-- Run this in Supabase SQL Editor to fix column mismatches
-- Safe to run: drops and recreates tables (no real data yet)
-- ============================================================

-- Drop child tables first (foreign key order), then recreate
drop table if exists public.achievement cascade;
drop table if exists public.student_learning_profile cascade;
drop table if exists public.tutor_conversation cascade;
drop table if exists public.homework cascade;
drop table if exists public.class cascade;

-- 3. CLASS TABLE (fixed: teacher_name, teacher_phone, room_number, current_grade, schedule as text)
create table public.class (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student on delete cascade not null,
  name text not null,
  subject text,
  teacher_name text,
  teacher_email text,
  teacher_phone text,
  room_number text,
  current_grade text,
  color text default 'blue',
  schedule text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

alter table public.class enable row level security;

create policy "Users can view own classes"
  on public.class for select
  using (
    exists (
      select 1 from public.student s
      where s.id = class.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can insert own classes"
  on public.class for insert
  with check (
    exists (
      select 1 from public.student s
      where s.id = class.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can update own classes"
  on public.class for update
  using (
    exists (
      select 1 from public.student s
      where s.id = class.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can delete own classes"
  on public.class for delete
  using (
    exists (
      select 1 from public.student s
      where s.id = class.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

-- 4. HOMEWORK TABLE (fixed: added teacher_feedback, source, tutor_conversation_id; relaxed status check)
create table public.homework (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student on delete cascade not null,
  class_id uuid references public.class on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  status text default 'todo',
  priority text default 'medium',
  subject text,
  notes text,
  teacher_feedback text,
  source text default 'manual',
  tutor_conversation_id uuid,
  estimated_time integer,
  actual_time integer,
  attachments jsonb default '[]'::jsonb,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

alter table public.homework enable row level security;

create policy "Users can view own homework"
  on public.homework for select
  using (
    exists (
      select 1 from public.student s
      where s.id = homework.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can insert own homework"
  on public.homework for insert
  with check (
    exists (
      select 1 from public.student s
      where s.id = homework.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can update own homework"
  on public.homework for update
  using (
    exists (
      select 1 from public.student s
      where s.id = homework.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can delete own homework"
  on public.homework for delete
  using (
    exists (
      select 1 from public.student s
      where s.id = homework.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

-- 5. TUTOR_CONVERSATION TABLE (fixed: added subject, tutor_id)
create table public.tutor_conversation (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student on delete cascade not null,
  homework_id uuid,
  title text,
  subject text,
  tutor_id text,
  messages jsonb default '[]'::jsonb,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

alter table public.tutor_conversation enable row level security;

create policy "Users can view own conversations"
  on public.tutor_conversation for select
  using (
    exists (
      select 1 from public.student s
      where s.id = tutor_conversation.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can insert own conversations"
  on public.tutor_conversation for insert
  with check (
    exists (
      select 1 from public.student s
      where s.id = tutor_conversation.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can update own conversations"
  on public.tutor_conversation for update
  using (
    exists (
      select 1 from public.student s
      where s.id = tutor_conversation.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can delete own conversations"
  on public.tutor_conversation for delete
  using (
    exists (
      select 1 from public.student s
      where s.id = tutor_conversation.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

-- 6. STUDENT_LEARNING_PROFILE TABLE (fixed: correct column names matching app code)
create table public.student_learning_profile (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student on delete cascade unique not null,
  strengths text[] default '{}',
  areas_for_growth text[] default '{}',
  learning_style_notes text,
  preferred_explanation_style text,
  common_misconceptions text,
  motivation_factors text,
  tutor_handoff_notes text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

alter table public.student_learning_profile enable row level security;

create policy "Users can view own learning profiles"
  on public.student_learning_profile for select
  using (
    exists (
      select 1 from public.student s
      where s.id = student_learning_profile.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can insert own learning profiles"
  on public.student_learning_profile for insert
  with check (
    exists (
      select 1 from public.student s
      where s.id = student_learning_profile.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can update own learning profiles"
  on public.student_learning_profile for update
  using (
    exists (
      select 1 from public.student s
      where s.id = student_learning_profile.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can delete own learning profiles"
  on public.student_learning_profile for delete
  using (
    exists (
      select 1 from public.student s
      where s.id = student_learning_profile.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

-- 7. ACHIEVEMENT TABLE (unchanged — schema was correct)
create table public.achievement (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student on delete cascade not null,
  name text not null,
  description text,
  reward text,
  unlocked boolean default false,
  unlocked_date timestamptz,
  icon text,
  category text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

alter table public.achievement enable row level security;

create policy "Users can view own achievements"
  on public.achievement for select
  using (
    exists (
      select 1 from public.student s
      where s.id = achievement.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can insert own achievements"
  on public.achievement for insert
  with check (
    exists (
      select 1 from public.student s
      where s.id = achievement.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can update own achievements"
  on public.achievement for update
  using (
    exists (
      select 1 from public.student s
      where s.id = achievement.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "Users can delete own achievements"
  on public.achievement for delete
  using (
    exists (
      select 1 from public.student s
      where s.id = achievement.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

-- Re-create updated_date triggers for the recreated tables
create trigger update_class_updated_date
  before update on public.class
  for each row execute function public.update_updated_date();

create trigger update_homework_updated_date
  before update on public.homework
  for each row execute function public.update_updated_date();

create trigger update_tutor_conversation_updated_date
  before update on public.tutor_conversation
  for each row execute function public.update_updated_date();

create trigger update_student_learning_profile_updated_date
  before update on public.student_learning_profile
  for each row execute function public.update_updated_date();

create trigger update_achievement_updated_date
  before update on public.achievement
  for each row execute function public.update_updated_date();
