-- Production schema hardening for LoadLink Botswana.
-- Apply this in Supabase SQL Editor if the live app cannot sign up, create bookings, save trucks, or top up wallets.

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

drop policy if exists "public read profiles" on public.profiles;
drop policy if exists "public insert profiles" on public.profiles;
drop policy if exists "public update profiles" on public.profiles;
create policy "public read profiles" on public.profiles for select using (true);
create policy "public insert profiles" on public.profiles for insert with check (true);
create policy "public update profiles" on public.profiles for update using (true) with check (true);

drop policy if exists "public read loads" on public.loads;
drop policy if exists "public insert loads" on public.loads;
drop policy if exists "public update loads" on public.loads;
create policy "public read loads" on public.loads for select using (true);
create policy "public insert loads" on public.loads for insert with check (true);
create policy "public update loads" on public.loads for update using (true) with check (true);

drop policy if exists "public read trucks" on public.trucks;
drop policy if exists "public insert trucks" on public.trucks;
drop policy if exists "public update trucks" on public.trucks;
create policy "public read trucks" on public.trucks for select using (true);
create policy "public insert trucks" on public.trucks for insert with check (true);
create policy "public update trucks" on public.trucks for update using (true) with check (true);

drop policy if exists "public read wallet transactions" on public.wallet_transactions;
drop policy if exists "public insert wallet transactions" on public.wallet_transactions;
create policy "public read wallet transactions" on public.wallet_transactions for select using (true);
create policy "public insert wallet transactions" on public.wallet_transactions for insert with check (true);

create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_loads_status_created on public.loads(status, created_at desc);
create index if not exists idx_trucks_phone_created on public.trucks(phone, created_at desc);
create index if not exists idx_wallet_phone_created on public.wallet_transactions(phone, created_at desc);
