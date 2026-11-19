alter table public.kyc_applications
  drop constraint if exists kyc_applications_track_check;

alter table public.kyc_applications
  add constraint kyc_applications_track_check
  check (track in ('personal', 'business', 'developer', 'badge'));
