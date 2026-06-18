-- Stint — bookable availability slots (specific date + time windows).
-- Providers publish discrete slots; customers book one and it's reserved (auto-book).

create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  is_booked boolean not null default false,
  booking_id uuid references bookings(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists availability_slots_provider_date_idx
  on availability_slots (provider_id, slot_date);

alter table availability_slots enable row level security;

-- Anyone may read slots for a published provider (so customers see openings).
create policy "availability_slots public read" on availability_slots for select using (
  exists (
    select 1 from providers p
    where p.id = availability_slots.provider_id and p.is_published = true
  )
);

-- The owning provider manages their own slots.
create policy "availability_slots owner all" on availability_slots for all using (
  exists (
    select 1 from providers p
    where p.id = availability_slots.provider_id and p.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from providers p
    where p.id = availability_slots.provider_id and p.owner_id = auth.uid()
  )
);
