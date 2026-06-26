-- Enable LoadLink MVP cross-device access.
-- Purpose:
-- - Let customers create/read/update load requests across devices.
-- - Let drivers create/read/update truck profiles and see open loads.
-- - Let signup/profile and wallet flows work with the public anon frontend key.
--
-- This migration is intentionally permissive for MVP/soft-launch use.
-- It does not delete or modify production data.
-- Tighten these policies later when Supabase Auth roles and ownership rules are fully implemented.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'customer',
  name text not null,
  phone text not null unique,
  email text,
  business text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.loads (
  id text primary key,
  customer text not null,
  phone text not null,
  pickup text not null,
  dropoff text not null,
  category text not null,
  load text,
  km numeric not null default 0,
  offer numeric not null default 0,
  status text not null default 'Broadcasting',
  driver text,
  driver_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.trucks (
  id uuid primary key default gen_random_uuid(),
  owner_phone text,
  name text not null,
  phone text not null,
  category text not null,
  plate text not null,
  area text,
  wallet numeric not null default 0,
  rating numeric not null default 4.8,
  online boolean not null default false,
  status text not null default 'Pending review',
  licence text,
  disc text,
  permit text,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  type text not null,
  amount numeric not null default 0,
  note text,
  load_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.loads enable row level security;
alter table public.trucks enable row level security;
alter table public.wallet_transactions enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to anon, authenticated;
grant select, insert, update on public.loads to anon, authenticated;
grant select, insert, update on public.trucks to anon, authenticated;
grant select, insert on public.wallet_transactions to anon, authenticated;

create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_loads_status_created on public.loads(status, created_at desc);
create index if not exists idx_trucks_phone_created on public.trucks(phone, created_at desc);
create index if not exists idx_wallet_phone_created on public.wallet_transactions(phone, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'mvp profiles select'
  ) then
    create policy "mvp profiles select" on public.profiles for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'mvp profiles insert'
  ) then
    create policy "mvp profiles insert" on public.profiles for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'mvp profiles update'
  ) then
    create policy "mvp profiles update" on public.profiles for update using (true) with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'loads' and policyname = 'mvp loads select'
  ) then
    create policy "mvp loads select" on public.loads for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'loads' and policyname = 'mvp loads insert'
  ) then
    create policy "mvp loads insert" on public.loads for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'loads' and policyname = 'mvp loads update'
  ) then
    create policy "mvp loads update" on public.loads for update using (true) with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'trucks' and policyname = 'mvp trucks select'
  ) then
    create policy "mvp trucks select" on public.trucks for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'trucks' and policyname = 'mvp trucks insert'
  ) then
    create policy "mvp trucks insert" on public.trucks for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'trucks' and policyname = 'mvp trucks update'
  ) then
    create policy "mvp trucks update" on public.trucks for update using (true) with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wallet_transactions' and policyname = 'mvp wallet select'
  ) then
    create policy "mvp wallet select" on public.wallet_transactions for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wallet_transactions' and policyname = 'mvp wallet insert'
  ) then
    create policy "mvp wallet insert" on public.wallet_transactions for insert with check (true);
  end if;
end $$;

-- Verification query to run after applying this migration:
-- select schemaname, tablename, policyname, cmd, permissive
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('profiles', 'loads', 'trucks', 'wallet_transactions')
-- order by tablename, policyname;
