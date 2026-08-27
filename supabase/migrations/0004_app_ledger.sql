-- Durable app ledger so accounts survive serverless restarts.
-- The Next.js server uses the service role. Anon has no policy, so it cannot read this.

create table if not exists public.app_ledger (
  id text primary key default 'lbpay',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_ledger enable row level security;
