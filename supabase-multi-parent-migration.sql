-- ==========================================================================
-- Multi-Parent Collaboration & Homework Comments Migration
-- Run this in the Supabase SQL Editor
-- ==========================================================================

-- -------------------------------------------------------------------------
-- 1.1 Helper function: checks if current user has access to a student
-- -------------------------------------------------------------------------
create or replace function public.user_has_student_access(p_student_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.student s
    where s.id = p_student_id
      and (
        s.student_user_id = auth.uid()
        or s.parent_user_id = auth.uid()
        or exists (
          select 1 from public.student_parent sp
          where sp.student_id = s.id and sp.parent_user_id = auth.uid()
        )
      )
  );
end;
$$ language plpgsql security definer stable;

-- -------------------------------------------------------------------------
-- 1.2 student_parent junction table
-- -------------------------------------------------------------------------
create table public.student_parent (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student(id) on delete cascade not null,
  parent_user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'collaborator' check (role in ('owner', 'collaborator')),
  created_date timestamptz default now(),
  unique(student_id, parent_user_id)
);

alter table public.student_parent enable row level security;

-- RLS for student_parent
create policy "student_parent_select" on public.student_parent
  for select using (
    parent_user_id = auth.uid()
    or exists (
      select 1 from public.student s
      where s.id = student_parent.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "student_parent_insert" on public.student_parent
  for insert with check (
    exists (
      select 1 from public.student s
      where s.id = student_parent.student_id
        and s.parent_user_id = auth.uid()
    )
  );

create policy "student_parent_delete" on public.student_parent
  for delete using (
    exists (
      select 1 from public.student s
      where s.id = student_parent.student_id
        and s.parent_user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------
-- 1.3 Auto-sync trigger: when student.parent_user_id is set, mirror to junction
-- -------------------------------------------------------------------------
create or replace function public.sync_student_parent_junction()
returns trigger as $$
begin
  if NEW.parent_user_id is not null then
    insert into public.student_parent (student_id, parent_user_id, role)
    values (NEW.id, NEW.parent_user_id, 'owner')
    on conflict (student_id, parent_user_id) do nothing;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_sync_student_parent
  after insert or update of parent_user_id on public.student
  for each row execute function public.sync_student_parent_junction();

-- Backfill existing rows
insert into public.student_parent (student_id, parent_user_id, role)
select id, parent_user_id, 'owner' from public.student
where parent_user_id is not null
on conflict do nothing;

-- -------------------------------------------------------------------------
-- 1.4 parent_invite table
-- -------------------------------------------------------------------------
create table public.parent_invite (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student(id) on delete cascade not null,
  invited_by uuid references auth.users(id) on delete cascade not null,
  token text unique default encode(gen_random_bytes(24), 'hex') not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  accepted_by uuid references auth.users(id),
  expires_at timestamptz default (now() + interval '7 days'),
  created_date timestamptz default now()
);

alter table public.parent_invite enable row level security;

-- Only the inviting parent can see/manage invites for their students
create policy "parent_invite_select" on public.parent_invite
  for select using (
    invited_by = auth.uid()
    or accepted_by = auth.uid()
    or exists (
      select 1 from public.student s
      where s.id = parent_invite.student_id
        and (s.student_user_id = auth.uid() or s.parent_user_id = auth.uid())
    )
  );

create policy "parent_invite_insert" on public.parent_invite
  for insert with check (
    invited_by = auth.uid()
    and exists (
      select 1 from public.student s
      where s.id = parent_invite.student_id
        and s.parent_user_id = auth.uid()
    )
  );

create policy "parent_invite_update" on public.parent_invite
  for update using (
    invited_by = auth.uid()
  );

-- -------------------------------------------------------------------------
-- 1.5 accept_parent_invite RPC (SECURITY DEFINER)
-- -------------------------------------------------------------------------
create or replace function public.accept_parent_invite(invite_token text)
returns json as $$
declare
  v_invite record;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite
  from public.parent_invite
  where token = invite_token;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.status != 'pending' then
    raise exception 'Invite is no longer valid (status: %)', v_invite.status;
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Invite has expired';
  end if;

  if v_invite.invited_by = v_uid then
    raise exception 'You cannot accept your own invite';
  end if;

  -- Check if user is already the student's owner
  if exists (
    select 1 from public.student
    where id = v_invite.student_id
      and (student_user_id = v_uid or parent_user_id = v_uid)
  ) then
    raise exception 'You already have access to this student';
  end if;

  -- Insert into junction table
  insert into public.student_parent (student_id, parent_user_id, role)
  values (v_invite.student_id, v_uid, 'collaborator')
  on conflict (student_id, parent_user_id) do nothing;

  -- Mark invite as accepted
  update public.parent_invite
  set status = 'accepted', accepted_by = v_uid
  where id = v_invite.id;

  return json_build_object(
    'success', true,
    'student_id', v_invite.student_id
  );
end;
$$ language plpgsql security definer;

-- -------------------------------------------------------------------------
-- 1.6 homework_comment table
-- -------------------------------------------------------------------------
create table public.homework_comment (
  id uuid default gen_random_uuid() primary key,
  homework_id uuid references public.homework(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

alter table public.homework_comment enable row level security;

-- Anyone with access to the homework's student can read comments
create policy "homework_comment_select" on public.homework_comment
  for select using (
    exists (
      select 1 from public.homework h
      join public.student s on s.id = h.student_id
      where h.id = homework_comment.homework_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

-- Anyone with access can create comments
create policy "homework_comment_insert" on public.homework_comment
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.homework h
      join public.student s on s.id = h.student_id
      where h.id = homework_comment.homework_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

-- Users can only update their own comments
create policy "homework_comment_update" on public.homework_comment
  for update using (user_id = auth.uid());

-- Users can only delete their own comments
create policy "homework_comment_delete" on public.homework_comment
  for delete using (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- 1.7 Update existing RLS policies on 6 tables
-- -------------------------------------------------------------------------

-- ===== STUDENT =====
-- SELECT: allow student, original parent, AND junction parents
drop policy if exists "student_select" on public.student;
create policy "student_select" on public.student
  for select using (
    student_user_id = auth.uid()
    or parent_user_id = auth.uid()
    or exists (
      select 1 from public.student_parent sp
      where sp.student_id = student.id and sp.parent_user_id = auth.uid()
    )
  );

-- INSERT: owner-only (no change — only the creating parent can insert)
drop policy if exists "student_insert" on public.student;
create policy "student_insert" on public.student
  for insert with check (
    student_user_id = auth.uid() or parent_user_id = auth.uid()
  );

-- UPDATE: allow student, original parent, AND junction parents
drop policy if exists "student_update" on public.student;
create policy "student_update" on public.student
  for update using (
    student_user_id = auth.uid()
    or parent_user_id = auth.uid()
    or exists (
      select 1 from public.student_parent sp
      where sp.student_id = student.id and sp.parent_user_id = auth.uid()
    )
  );

-- DELETE: original parent only (no change)
drop policy if exists "student_delete" on public.student;
create policy "student_delete" on public.student
  for delete using (
    parent_user_id = auth.uid()
  );

-- ===== CLASS =====
drop policy if exists "class_select" on public.class;
create policy "class_select" on public.class
  for select using (
    exists (
      select 1 from public.student s
      where s.id = class.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "class_insert" on public.class;
create policy "class_insert" on public.class
  for insert with check (
    exists (
      select 1 from public.student s
      where s.id = class.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "class_update" on public.class;
create policy "class_update" on public.class
  for update using (
    exists (
      select 1 from public.student s
      where s.id = class.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "class_delete" on public.class;
create policy "class_delete" on public.class
  for delete using (
    exists (
      select 1 from public.student s
      where s.id = class.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

-- ===== HOMEWORK =====
drop policy if exists "homework_select" on public.homework;
create policy "homework_select" on public.homework
  for select using (
    exists (
      select 1 from public.student s
      where s.id = homework.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "homework_insert" on public.homework;
create policy "homework_insert" on public.homework
  for insert with check (
    exists (
      select 1 from public.student s
      where s.id = homework.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "homework_update" on public.homework;
create policy "homework_update" on public.homework
  for update using (
    exists (
      select 1 from public.student s
      where s.id = homework.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "homework_delete" on public.homework;
create policy "homework_delete" on public.homework
  for delete using (
    exists (
      select 1 from public.student s
      where s.id = homework.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

-- ===== TUTOR_CONVERSATION =====
drop policy if exists "tutor_conversation_select" on public.tutor_conversation;
create policy "tutor_conversation_select" on public.tutor_conversation
  for select using (
    exists (
      select 1 from public.student s
      where s.id = tutor_conversation.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "tutor_conversation_insert" on public.tutor_conversation;
create policy "tutor_conversation_insert" on public.tutor_conversation
  for insert with check (
    exists (
      select 1 from public.student s
      where s.id = tutor_conversation.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "tutor_conversation_update" on public.tutor_conversation;
create policy "tutor_conversation_update" on public.tutor_conversation
  for update using (
    exists (
      select 1 from public.student s
      where s.id = tutor_conversation.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "tutor_conversation_delete" on public.tutor_conversation;
create policy "tutor_conversation_delete" on public.tutor_conversation
  for delete using (
    exists (
      select 1 from public.student s
      where s.id = tutor_conversation.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

-- ===== STUDENT_LEARNING_PROFILE =====
drop policy if exists "student_learning_profile_select" on public.student_learning_profile;
create policy "student_learning_profile_select" on public.student_learning_profile
  for select using (
    exists (
      select 1 from public.student s
      where s.id = student_learning_profile.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "student_learning_profile_insert" on public.student_learning_profile;
create policy "student_learning_profile_insert" on public.student_learning_profile
  for insert with check (
    exists (
      select 1 from public.student s
      where s.id = student_learning_profile.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "student_learning_profile_update" on public.student_learning_profile;
create policy "student_learning_profile_update" on public.student_learning_profile
  for update using (
    exists (
      select 1 from public.student s
      where s.id = student_learning_profile.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "student_learning_profile_delete" on public.student_learning_profile;
create policy "student_learning_profile_delete" on public.student_learning_profile
  for delete using (
    exists (
      select 1 from public.student s
      where s.id = student_learning_profile.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

-- ===== ACHIEVEMENT =====
drop policy if exists "achievement_select" on public.achievement;
create policy "achievement_select" on public.achievement
  for select using (
    exists (
      select 1 from public.student s
      where s.id = achievement.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "achievement_insert" on public.achievement;
create policy "achievement_insert" on public.achievement
  for insert with check (
    exists (
      select 1 from public.student s
      where s.id = achievement.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "achievement_update" on public.achievement;
create policy "achievement_update" on public.achievement
  for update using (
    exists (
      select 1 from public.student s
      where s.id = achievement.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "achievement_delete" on public.achievement;
create policy "achievement_delete" on public.achievement
  for delete using (
    exists (
      select 1 from public.student s
      where s.id = achievement.student_id
        and (
          s.student_user_id = auth.uid()
          or s.parent_user_id = auth.uid()
          or exists (
            select 1 from public.student_parent sp
            where sp.student_id = s.id and sp.parent_user_id = auth.uid()
          )
        )
    )
  );

-- -------------------------------------------------------------------------
-- 1.8 Performance indexes
-- -------------------------------------------------------------------------
create index idx_student_parent_parent_user_id on public.student_parent(parent_user_id);
create index idx_student_parent_student_id on public.student_parent(student_id);
create index idx_homework_comment_homework_id on public.homework_comment(homework_id);
create index idx_parent_invite_token on public.parent_invite(token);
create index idx_parent_invite_student_id on public.parent_invite(student_id);
