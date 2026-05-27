-- LoadLink Botswana soft-launch schema and RLS policies
-- Run this in Supabase SQL Editor for project ebvjnirbkyixgwxahdpe.

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

create table if not exists public.trucks (
  id uuid primary key default gen_random_uuid(),
  owner_phone text,
  name text not null,
  phone text not null,
  category text not null check (category in ('mini','medium','big')),
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

create table if not exists public.loads (
  id text primary key,
  customer text not null,
  phone text not null,
  pickup text not null,
  dropoff text not null,
  category text not null check (category in ('mini','medium','big')),
  load text,
  km numeric not null default 0,
  offer numeric not null default 0,
  status text not null default 'Broadcasting',
  driver text,
  driver_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  type text not null default 'deposit',
  amount numeric not null default 0,
  note text,
  load_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.trucks enable row level security;
alter table public.loads enable row level security;
alter table public.wallet_transactions enable row level security;

-- Soft-launch policies for anon-key demo use.
-- Tighten these later once real Supabase Auth is implemented.
drop policy if exists "softlaunch read profiles" on public.profiles;
drop policy if exists "softlaunch insert profiles" on public.profiles;
drop policy if exists "softlaunch update profiles" on public.profiles;
create policy "softlaunch read profiles" on public.profiles for select using (true);
create policy "softlaunch insert profiles" on public.profiles for insert with check (true);
create policy "softlaunch update profiles" on public.profiles for update using (true) with check (true);

drop policy if exists "softlaunch read trucks" on public.trucks;
drop policy if exists "softlaunch insert trucks" on public.trucks;
drop policy if exists "softlaunch update trucks" on public.trucks;
create policy "softlaunch read trucks" on public.trucks for select using (true);
create policy "softlaunch insert trucks" on public.trucks for insert with check (true);
create policy "softlaunch update trucks" on public.trucks for update using (true) with check (true);

drop policy if exists "softlaunch read loads" on public.loads;
drop policy if exists "softlaunch insert loads" on public.loads;
drop policy if exists "softlaunch update loads" on public.loads;
create policy "softlaunch read loads" on public.loads for select using (true);
create policy "softlaunch insert loads" on public.loads for insert with check (true);
create policy "softlaunch update loads" on public.loads for update using (true) with check (true);

drop policy if exists "softlaunch read wallet" on public.wallet_transactions;
drop policy if exists "softlaunch insert wallet" on public.wallet_transactions;
create policy "softlaunch read wallet" on public.wallet_transactions for select using (true);
create policy "softlaunch insert wallet" on public.wallet_transactions for insert with check (true);

create index if not exists idx_loads_status_category on public.loads(status, category);
create index if not exists idx_trucks_phone on public.trucks(phone);
create index if not exists idx_wallet_phone on public.wallet_transactions(phone);
