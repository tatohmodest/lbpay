-- Role-based access: personal, business, developer, admin.

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists business_name text;

create table if not exists public.kyc_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track text not null check (track in ('personal', 'business', 'developer')),
  status text not null default 'pending',
  legal_name text not null,
  id_number text not null,
  business_name text,
  tax_id text,
  website text,
  note text,
  review_note text,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.kyc_applications enable row level security;
alter table public.audit_log enable row level security;
