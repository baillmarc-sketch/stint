-- Stint — triggers & helper functions

-- Create a profile row whenever a new auth user signs up (Google SSO).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep provider rating aggregates in sync with reviews.
create or replace function public.update_provider_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.provider_id, old.provider_id);
begin
  update providers p
  set rating_count = (select count(*) from reviews where provider_id = pid),
      rating_avg   = coalesce((select round(avg(rating)::numeric, 2) from reviews where provider_id = pid), 0)
  where p.id = pid;
  return null;
end;
$$;

drop trigger if exists reviews_rating_change on reviews;
create trigger reviews_rating_change
  after insert or delete on reviews
  for each row execute function public.update_provider_rating();

-- Bump a thread's last_message_at when a message is posted.
create or replace function public.set_thread_last_message()
returns trigger
language plpgsql
as $$
begin
  update message_threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists messages_set_last on messages;
create trigger messages_set_last
  after insert on messages
  for each row execute function public.set_thread_last_message();

-- Coarse (day-level) availability check used by search + instant-book guard.
create or replace function public.is_listing_available(
  p_provider_id uuid,
  p_date date,
  p_start time default null,
  p_duration numeric default null
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    exists (
      select 1 from availability_rules r
      where r.provider_id = p_provider_id
        and r.weekday = extract(dow from p_date)::int
    )
    and not exists (
      select 1 from availability_blocks b
      where b.provider_id = p_provider_id
        and b.date = p_date
        and b.is_available = false
    )
    and not exists (
      select 1 from bookings bk
      where bk.provider_id = p_provider_id
        and bk.event_date = p_date
        and bk.status in ('confirmed', 'in_progress')
    );
$$;

-- Provider ids available on a date in a market (used by date-filtered search).
create or replace function public.available_provider_ids(p_market_id uuid, p_date date)
returns table (provider_id uuid)
language sql
stable
set search_path = public
as $$
  select p.id
  from providers p
  where p.market_id = p_market_id
    and p.is_published = true
    and public.is_listing_available(p.id, p_date);
$$;
