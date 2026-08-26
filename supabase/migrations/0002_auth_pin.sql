-- PIN + email verification columns for LBPay accounts.

alter table public.profiles
  add column if not exists email_verified boolean not null default false,
  add column if not exists pin_hash text;
