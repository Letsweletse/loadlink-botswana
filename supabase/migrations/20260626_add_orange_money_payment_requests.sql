-- Add Orange Money payment request tracking for manual MVP verification.
-- Purpose:
-- - Keep payment requests in Supabase so admin/backend workflows can verify them across devices.
-- - Avoid fake frontend wallet credits before the Orange Money payment is manually confirmed.
-- - The pay-to number is intentionally stored because customers/drivers must see where to pay.
--
-- This migration is append-only and does not delete or overwrite production data.

create extension if not exists pgcrypto;

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  amount numeric not null,
  provider text not null default 'orange_money',
  pay_to_number text not null default '75111891',
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now()
);

alter table public.payment_requests enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.payment_requests to anon, authenticated;

create index if not exists idx_payment_requests_phone_created on public.payment_requests(phone, created_at desc);
create index if not exists idx_payment_requests_status_created on public.payment_requests(status, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_requests' and policyname = 'mvp payment requests select'
  ) then
    create policy "mvp payment requests select" on public.payment_requests for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_requests' and policyname = 'mvp payment requests insert'
  ) then
    create policy "mvp payment requests insert" on public.payment_requests for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_requests' and policyname = 'mvp payment requests update'
  ) then
    create policy "mvp payment requests update" on public.payment_requests for update using (true) with check (true);
  end if;
end $$;

-- Verification query to run after applying this migration:
-- select schemaname, tablename, policyname, cmd, permissive
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'payment_requests'
-- order by policyname;
