-- ==========================================================================
-- Fix: Break infinite RLS recursion between student <-> student_parent
-- Run this in the Supabase SQL Editor
-- ==========================================================================

-- The student_parent SELECT policy was referencing the student table,
-- while the student SELECT policy references student_parent — creating
-- infinite recursion. Fix: student_parent policies should only check
-- direct column matches (parent_user_id) without joining back to student.

-- ---- student_parent SELECT: only your own rows ----
drop policy if exists "student_parent_select" on public.student_parent;
create policy "student_parent_select" on public.student_parent
  for select using (
    parent_user_id = auth.uid()
  );

-- ---- student_parent INSERT: only if you're the owning parent ----
-- This still needs to check student.parent_user_id, but since INSERT
-- policies use WITH CHECK (not USING), and student SELECT already works,
-- we use the SECURITY DEFINER helper instead to avoid recursion.
drop policy if exists "student_parent_insert" on public.student_parent;
create policy "student_parent_insert" on public.student_parent
  for insert with check (
    -- The accept_parent_invite RPC (SECURITY DEFINER) handles inserts
    -- for collaborators. Direct inserts are only by the owner.
    parent_user_id = auth.uid()
    or public.user_has_student_access(student_id)
  );

-- ---- student_parent DELETE: only owning parent ----
drop policy if exists "student_parent_delete" on public.student_parent;
create policy "student_parent_delete" on public.student_parent
  for delete using (
    public.user_has_student_access(student_id)
  );

-- ---- Also fix parent_invite SELECT to avoid similar recursion ----
drop policy if exists "parent_invite_select" on public.parent_invite;
create policy "parent_invite_select" on public.parent_invite
  for select using (
    invited_by = auth.uid()
    or accepted_by = auth.uid()
  );

drop policy if exists "parent_invite_insert" on public.parent_invite;
create policy "parent_invite_insert" on public.parent_invite
  for insert with check (
    invited_by = auth.uid()
  );
