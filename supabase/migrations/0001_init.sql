-- LBPay core ledger. PayUnit (or another processor) is a rail, not the schema.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  lbpay_id text unique not null,
  full_name text not null,
  phone text,
  account_kinds text[] not null default array['personal']::text[],
  kyc_status text not null default 'unverified',
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'personal',
  currency text not null default 'XAF',
  available_balance bigint not null default 0,
  pending_balance bigint not null default 0,
  status text not null default 'active',
  unique (owner_id, kind, currency)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  kind text not null,
  status text not null,
  amount bigint not null,
  fee bigint not null default 0,
  currency text not null default 'XAF',
  method text,
  rail text,
  payer_wallet_id uuid references public.wallets(id),
  payee_wallet_id uuid references public.wallets(id),
  counterparty_label text,
  external_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id),
  direction text not null check (direction in ('credit', 'debit')),
  amount bigint not null check (amount > 0),
  balance_after bigint,
  entry_type text not null,
  transaction_id uuid references public.transactions(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  title text not null,
  amount bigint,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.money_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  lbpay_id text,
  network text,
  created_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  environment text not null check (environment in ('live', 'sandbox')),
  public_key text unique not null,
  secret_key_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  events text[] not null,
  status text not null default 'active',
  secret text not null
);

create table if not exists public.api_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  method text not null,
  path text not null,
  status_code int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null,
  phone text not null,
  network text not null,
  status text not null,
  rail text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  amount bigint not null,
  interval text not null,
  status text not null default 'active'
);

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payment_links enable row level security;
alter table public.money_requests enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.api_keys enable row level security;
alter table public.webhooks enable row level security;
alter table public.api_logs enable row level security;
alter table public.payouts enable row level security;
alter table public.subscription_plans enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own wallets" on public.wallets
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own payment links" on public.payment_links
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own requests" on public.money_requests
  for all using (requester_id = auth.uid()) with check (requester_id = auth.uid());

create policy "own beneficiaries" on public.beneficiaries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own api keys" on public.api_keys
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own webhooks" on public.webhooks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own logs" on public.api_logs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own payouts" on public.payouts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own plans" on public.subscription_plans
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
