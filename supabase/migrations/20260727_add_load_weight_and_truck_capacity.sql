-- Add load weight/cargo detail and truck capacity/area requirement so
-- drivers only see loads their truck can actually carry and cover.
alter table public.loads
  add column if not exists weight_tonnes numeric,
  add column if not exists cargo_description text;

alter table public.trucks
  add column if not exists capacity_tonnes numeric;

alter table public.trucks
  alter column area set not null;
