-- ==========================================================================
-- Admin Features Migration: API Key storage on profiles
-- Run this in the Supabase SQL Editor
-- ==========================================================================

-- -------------------------------------------------------------------------
-- Add api_key column to profiles table
-- Only the owning user can read/write their own api_key
-- -------------------------------------------------------------------------
alter table public.profiles
  add column if not exists api_key text;

-- -------------------------------------------------------------------------
-- RPC: update_api_key — lets users set their own API key securely
-- Using SECURITY DEFINER so it bypasses column-level checks
-- -------------------------------------------------------------------------
create or replace function public.update_api_key(new_api_key text)
returns json as $$
begin
  update public.profiles
  set api_key = new_api_key
  where id = auth.uid();

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;

-- -------------------------------------------------------------------------
-- RPC: get_api_key — lets users retrieve their own API key
-- -------------------------------------------------------------------------
create or replace function public.get_api_key()
returns json as $$
declare
  v_key text;
begin
  select api_key into v_key
  from public.profiles
  where id = auth.uid();

  return json_build_object('api_key', v_key);
end;
$$ language plpgsql security definer stable;

-- -------------------------------------------------------------------------
-- RPC: admin_remove_student_parent — lets the owning parent remove a
-- collaborator from the junction table
-- -------------------------------------------------------------------------
create or replace function public.admin_remove_student_parent(p_student_parent_id uuid)
returns json as $$
declare
  v_sp record;
begin
  select sp.*, s.parent_user_id as owner_id
  into v_sp
  from public.student_parent sp
  join public.student s on s.id = sp.student_id
  where sp.id = p_student_parent_id;

  if not found then
    raise exception 'Link not found';
  end if;

  -- Only the original parent (owner) can remove collaborators
  if v_sp.owner_id != auth.uid() then
    raise exception 'Only the primary parent can remove collaborators';
  end if;

  -- Prevent removing self (owner)
  if v_sp.parent_user_id = auth.uid() then
    raise exception 'You cannot remove yourself as the primary parent';
  end if;

  delete from public.student_parent where id = p_student_parent_id;

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;
