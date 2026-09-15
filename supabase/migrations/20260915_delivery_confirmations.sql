-- Dual delivery confirmation for LoadLink.
-- Driver confirms the physical handover; client confirms receipt.
-- The load remains Delivered while waiting for the second confirmation.

alter table public.loads
  add column if not exists driver_delivery_confirmed boolean not null default false,
  add column if not exists client_delivery_confirmed boolean not null default false,
  add column if not exists driver_delivery_confirmed_at timestamptz,
  add column if not exists client_delivery_confirmed_at timestamptz;

create index if not exists idx_loads_delivery_confirmations
  on public.loads(driver_delivery_confirmed, client_delivery_confirmed);
