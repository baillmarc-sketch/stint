-- Stint — Row-Level Security
-- Pattern: public read for published content; owner-write via auth.uid();
-- participant-scoped access for bookings/messages. Privileged writes
-- (booking status / payment transitions) go through service-role route handlers.

-- Helper: is the current user the owner of this provider? SECURITY DEFINER avoids
-- recursive RLS evaluation when used inside other tables' policies.
create or replace function public.is_provider_owner(p_provider_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from providers
    where id = p_provider_id and owner_id = auth.uid()
  );
$$;

-- Enable RLS everywhere
alter table markets             enable row level security;
alter table profiles            enable row level security;
alter table categories          enable row level security;
alter table providers           enable row level security;
alter table listings            enable row level security;
alter table packages            enable row level security;
alter table addons              enable row level security;
alter table media               enable row level security;
alter table availability_rules  enable row level security;
alter table availability_blocks enable row level security;
alter table bookings            enable row level security;
alter table booking_addons      enable row level security;
alter table message_threads     enable row level security;
alter table messages            enable row level security;
alter table reviews             enable row level security;

-- Public reference data
create policy "markets public read"    on markets    for select using (true);
create policy "categories public read" on categories for select using (true);

-- Profiles: users manage only their own row
create policy "profiles select own" on profiles for select using (id = auth.uid());
create policy "profiles update own" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Providers: public read published; owner full control of their own
create policy "providers public read" on providers for select using (is_published = true);
create policy "providers owner read"  on providers for select using (owner_id = auth.uid());
create policy "providers owner write" on providers for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Listings: public read published; owner writes via provider ownership
create policy "listings public read" on listings for select
  using (is_published = true and provider_id in (select id from providers where is_published = true));
create policy "listings owner all" on listings for all
  using (is_provider_owner(provider_id)) with check (is_provider_owner(provider_id));

-- Packages / add-ons / media: public read; owner writes via parent listing/provider
create policy "packages public read" on packages for select using (true);
create policy "packages owner all" on packages for all
  using (is_provider_owner((select provider_id from listings where id = listing_id)))
  with check (is_provider_owner((select provider_id from listings where id = listing_id)));

create policy "addons public read" on addons for select using (true);
create policy "addons owner all" on addons for all
  using (is_provider_owner((select provider_id from listings where id = listing_id)))
  with check (is_provider_owner((select provider_id from listings where id = listing_id)));

create policy "media public read" on media for select using (true);
create policy "media owner all" on media for all
  using (
    (provider_id is not null and is_provider_owner(provider_id))
    or (listing_id is not null and is_provider_owner((select provider_id from listings where id = listing_id)))
  )
  with check (
    (provider_id is not null and is_provider_owner(provider_id))
    or (listing_id is not null and is_provider_owner((select provider_id from listings where id = listing_id)))
  );

-- Availability: public read; owner writes
create policy "availability_rules public read" on availability_rules for select using (true);
create policy "availability_rules owner all" on availability_rules for all
  using (is_provider_owner(provider_id)) with check (is_provider_owner(provider_id));
create policy "availability_blocks public read" on availability_blocks for select using (true);
create policy "availability_blocks owner all" on availability_blocks for all
  using (is_provider_owner(provider_id)) with check (is_provider_owner(provider_id));

-- Bookings: only the customer or the provider-owner can see them; customer inserts.
-- Status/payment updates are performed by service-role route handlers.
create policy "bookings participant read" on bookings for select
  using (customer_id = auth.uid() or is_provider_owner(provider_id));
create policy "bookings customer insert" on bookings for insert
  with check (customer_id = auth.uid());

create policy "booking_addons participant read" on booking_addons for select
  using (exists (
    select 1 from bookings b
    where b.id = booking_id and (b.customer_id = auth.uid() or is_provider_owner(b.provider_id))
  ));

-- Messaging: only thread participants
create policy "threads participant read" on message_threads for select
  using (customer_id = auth.uid() or is_provider_owner(provider_id));
create policy "messages participant read" on messages for select
  using (exists (
    select 1 from message_threads t
    where t.id = thread_id and (t.customer_id = auth.uid() or is_provider_owner(t.provider_id))
  ));
create policy "messages participant insert" on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from message_threads t
      where t.id = thread_id and (t.customer_id = auth.uid() or is_provider_owner(t.provider_id))
    )
  );

-- Reviews: public read; a customer may review their own booking
create policy "reviews public read" on reviews for select using (true);
create policy "reviews customer insert" on reviews for insert
  with check (customer_id = auth.uid());
