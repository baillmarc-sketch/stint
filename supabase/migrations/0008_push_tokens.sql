-- Stint — Expo push tokens for native notifications (e.g. new-booking alerts).

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table push_tokens enable row level security;

-- Each user manages only their own device tokens.
create policy "push_tokens owner all" on push_tokens for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
