-- Add live driver GPS columns to loads.
-- Purpose: let the driver app persist periodic GPS pings for an accepted/in-transit
-- load, and let the customer /track page render a live Mapbox marker for it.

alter table public.loads
  add column if not exists driver_lat double precision,
  add column if not exists driver_lng double precision,
  add column if not exists location_updated_at timestamptz;

-- No RLS changes needed: the existing "mvp loads update" policy
-- (using (true) with check (true)) already permits the anon key to write these.
