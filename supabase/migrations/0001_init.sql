-- Stint — initial schema
-- Mirrors types/domain.ts. All monetary values are integer cents.

-- ---------- Enums ----------
create type user_role     as enum ('customer', 'provider', 'both');
create type pricing_model as enum ('hourly', 'flat', 'package');
create type booking_status as enum (
  'requested', 'quoted', 'confirmed', 'in_progress', 'completed', 'cancelled', 'declined'
);
create type payment_status as enum ('none', 'authorized', 'captured', 'refunded', 'failed');
create type media_kind     as enum ('image', 'video');
create type message_kind   as enum ('text', 'system', 'quote');

-- ---------- Markets ----------
create table markets (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  region      text not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- Profiles (1:1 with auth.users) ----------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  role        user_role not null default 'customer',
  phone       text,
  onboarded   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- Categories ----------
create table categories (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name           text not null,
  tagline        text,
  description    text,
  icon           text,
  hero_image_url text,
  sort_order     int not null default 0,
  is_active      boolean not null default true
);

-- ---------- Providers ----------
create table providers (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references profiles(id) on delete cascade,
  business_name   text not null,
  slug            text unique not null,
  tagline         text,
  bio             text,
  avatar_url      text,
  cover_image_url text,
  category_id     uuid references categories(id),
  market_id       uuid references markets(id),
  neighborhood    text,
  years_experience int not null default 0,
  response_rate   numeric not null default 1,
  response_minutes int not null default 60,
  rating_avg      numeric not null default 0,
  rating_count    int not null default 0,
  instant_book    boolean not null default false,
  is_verified     boolean not null default false,
  is_published    boolean not null default false,
  credentials     text[] not null default '{}',
  created_at      timestamptz not null default now()
);
create index providers_market_published_idx on providers (market_id, is_published);
create index providers_category_idx on providers (category_id);

-- ---------- Listings ----------
create table listings (
  id                 uuid primary key default gen_random_uuid(),
  provider_id        uuid not null references providers(id) on delete cascade,
  category_id        uuid references categories(id),
  title              text not null,
  description        text,
  pricing_model      pricing_model not null,
  base_price_cents   int not null,
  unit_label         text,
  min_hours          int,
  min_guests         int not null default 1,
  max_guests         int not null default 100,
  travel_radius_miles int not null default 25,
  travel_fee_cents   int not null default 0,
  instant_book       boolean not null default false,
  includes           text[] not null default '{}',
  is_published       boolean not null default false,
  created_at         timestamptz not null default now()
);
create index listings_category_published_idx on listings (category_id, is_published);
create index listings_provider_idx on listings (provider_id);

-- ---------- Packages & add-ons ----------
create table packages (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  name        text not null,
  description text,
  price_cents int not null,
  includes    text[] not null default '{}',
  sort_order  int not null default 0
);

create table addons (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings(id) on delete cascade,
  name            text not null,
  description     text,
  price_cents     int not null,
  price_per_guest boolean not null default false,
  sort_order      int not null default 0
);

-- ---------- Media (provider or listing) ----------
create table media (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid references providers(id) on delete cascade,
  listing_id    uuid references listings(id) on delete cascade,
  kind          media_kind not null default 'image',
  url           text not null,
  thumbnail_url text,
  caption       text,
  sort_order    int not null default 0,
  constraint media_owner_chk check (
    (provider_id is not null) <> (listing_id is not null)
  )
);

-- ---------- Availability ----------
create table availability_rules (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  weekday     int not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null
);

create table availability_blocks (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references providers(id) on delete cascade,
  date         date not null,
  is_available boolean not null default false,
  start_time   time,
  end_time     time
);

-- ---------- Bookings ----------
create table bookings (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid references profiles(id) on delete set null,
  provider_id        uuid not null references providers(id),
  listing_id         uuid not null references listings(id),
  package_id         uuid references packages(id),
  status             booking_status not null default 'requested',
  payment_status     payment_status not null default 'none',
  payment_ref        text,
  is_instant         boolean not null default false,
  event_date         date not null,
  start_time         time not null,
  duration_hours     numeric not null default 1,
  guest_count        int not null default 1,
  event_address      text,
  event_neighborhood text,
  notes              text,
  base_price_cents   int not null default 0,
  addons_total_cents int not null default 0,
  travel_fee_cents   int not null default 0,
  service_fee_cents  int not null default 0,
  subtotal_cents     int not null default 0,
  total_cents        int not null default 0,
  created_at         timestamptz not null default now()
);
create index bookings_customer_idx on bookings (customer_id);
create index bookings_provider_date_idx on bookings (provider_id, event_date);

create table booking_addons (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references bookings(id) on delete cascade,
  addon_id        uuid references addons(id),
  name            text not null,
  quantity        int not null default 1,
  unit_price_cents int not null,
  line_total_cents int not null
);

-- ---------- Messaging ----------
create table message_threads (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid unique references bookings(id) on delete cascade,
  customer_id     uuid references profiles(id) on delete set null,
  provider_id     uuid references providers(id) on delete cascade,
  last_message_at timestamptz not null default now()
);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references message_threads(id) on delete cascade,
  sender_id   uuid references profiles(id) on delete set null,
  kind        message_kind not null default 'text',
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- Reviews ----------
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid unique references bookings(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  customer_id uuid references profiles(id) on delete set null,
  rating      int not null check (rating between 1 and 5),
  title       text,
  body        text,
  -- Denormalized author display for seeded/demo reviews (real reviews derive
  -- identity from customer_id/profiles).
  author_name       text,
  author_avatar_url text,
  event_type        text,
  created_at  timestamptz not null default now()
);
create index reviews_provider_idx on reviews (provider_id);
