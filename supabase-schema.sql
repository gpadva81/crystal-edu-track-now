-- ============================================================
-- StudyTrack Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. PROFILES TABLE (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  account_type text check (account_type in ('student', 'parent')),
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. STUDENT TABLE
create table public.student (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  grade text,
  school text,
  avatar_color text default 'blue',
  student_user_id uuid references auth.users,
  parent_user_id uuid references auth.users,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

alter table public.student enable row level security;

create policy "Users can view own students"
  on public.student for select
  using (student_user_id = auth.uid() or parent_user_id = auth.uid());

create policy "Users can insert own students"
  on public.student for insert
  with check (student_user_id = auth.uid() or parent_user_id = auth.uid());

create policy "Users can update own students"
  on public.student for update
  using (student_user_id = auth.uid() or parent_user_id = auth.uid());

create policy "Users can delete own students"
  on public.student for delete
  using (student_user_id = auth.uid() or parent_user_id = auth.uid());

-- 3. CLASS TABLE
create table public.class (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student on delete cascade not null,
  name text not null,
  subject text,
  teacher text,
  teacher_email text,
  room text,
  color text default '#3b82f6',
  schedule jsonb default '[]'::jsonb,
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

-- 4. HOMEWORK TABLE
create table public.homework (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student on delete cascade not null,
  class_id uuid references public.class on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  subject text,
  estimated_time integer,
  actual_time integer,
  notes text,
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

-- 5. TUTOR_CONVERSATION TABLE
create table public.tutor_conversation (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student on delete cascade not null,
  homework_id uuid references public.homework on delete set null,
  title text,
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

-- 6. STUDENT_LEARNING_PROFILE TABLE
create table public.student_learning_profile (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student on delete cascade unique not null,
  strengths text[] default '{}',
  weaknesses text[] default '{}',
  learning_style text,
  notes text,
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

-- 7. ACHIEVEMENT TABLE
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

-- ============================================================
-- AUTO-UPDATE updated_date TRIGGER (applies to all tables)
-- ============================================================

create or replace function public.update_updated_date()
returns trigger as $$
begin
  new.updated_date = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_date
  before update on public.profiles
  for each row execute function public.update_updated_date();

create trigger update_student_updated_date
  before update on public.student
  for each row execute function public.update_updated_date();

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
