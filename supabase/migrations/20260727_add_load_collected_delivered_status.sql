-- Extend load status tracking: Broadcasting -> Accepted -> Collected -> Delivered.
alter table public.loads
  add column if not exists collected_at timestamptz,
  add column if not exists delivered_at timestamptz;

-- These check the caller against loads.driver_phone directly (the specific
-- driver already assigned to *this* load by accept_load), rather than
-- re-deriving ownership via owns_phone() the way accept_load has to before
-- any assignment exists. Simpler, self-contained, and avoids depending on
-- owns_phone()'s exact signature, which isn't tracked in this repo's
-- migrations (see the accept_load fix commit for that history).
create or replace function public.mark_load_collected(p_load_id text)
returns public.loads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_load public.loads;
  v_caller_phone text;
begin
  select phone into v_caller_phone from public.profiles where user_id = auth.uid();

  select * into v_load from public.loads where id = p_load_id for update;
  if not found then
    raise exception 'LOAD_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_caller_phone is null or v_load.driver_phone is null or v_caller_phone <> v_load.driver_phone then
    raise exception 'NOT_AUTHORIZED: you can only update your own accepted loads' using errcode = 'P0001';
  end if;

  if v_load.status <> 'Accepted' then
    raise exception 'INVALID_STATUS_TRANSITION' using errcode = 'P0001';
  end if;

  update public.loads
  set status = 'Collected', collected_at = now()
  where id = p_load_id
  returning * into v_load;

  return v_load;
end;
$$;

create or replace function public.mark_load_delivered(p_load_id text)
returns public.loads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_load public.loads;
  v_caller_phone text;
begin
  select phone into v_caller_phone from public.profiles where user_id = auth.uid();

  select * into v_load from public.loads where id = p_load_id for update;
  if not found then
    raise exception 'LOAD_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_caller_phone is null or v_load.driver_phone is null or v_caller_phone <> v_load.driver_phone then
    raise exception 'NOT_AUTHORIZED: you can only update your own accepted loads' using errcode = 'P0001';
  end if;

  if v_load.status <> 'Collected' then
    raise exception 'INVALID_STATUS_TRANSITION' using errcode = 'P0001';
  end if;

  update public.loads
  set status = 'Delivered', delivered_at = now()
  where id = p_load_id
  returning * into v_load;

  return v_load;
end;
$$;

-- Granted to anon as well as authenticated per spec. Harmless: an anon caller
-- has no auth.uid(), so v_caller_phone resolves to null and the function
-- rejects with NOT_AUTHORIZED before touching a row either way — same as
-- calling any other SECURITY DEFINER function here unauthenticated.
grant execute on function public.mark_load_collected(text) to anon, authenticated;
grant execute on function public.mark_load_delivered(text) to anon, authenticated;
