-- ============================================================
-- Admin moderation — user suspension + admin write access
--
-- The admin panel could only ever read data (profiles, listings, audit
-- log) — there was no way to act on a bad account or a listing that
-- needs to come down. This adds:
--   1. profiles.suspended, enforced at login and on every request
--      (middleware), so a suspended account is actually locked out —
--      not just flagged in a table nobody acts on.
--   2. RLS policies letting admins write to profiles/seller_listings —
--      the existing policies only ever granted self-writes (a user to
--      their own profile, a seller to their own listing), so an admin
--      acting on someone else's row was silently blocked by RLS even
--      though the /admin pages could already read it.
-- ============================================================

alter table public.profiles
  add column suspended boolean not null default false;

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

create policy "Admins can update any listing"
  on public.seller_listings for update
  using (public.is_admin());
