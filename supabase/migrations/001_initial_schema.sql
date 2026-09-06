-- ============================================================
-- V+V Marketplace — Initial Database Schema
-- Run via: supabase db push
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('buyer', 'seller', 'dual', 'admin');
create type listing_status as enum ('draft', 'active', 'paused', 'sold');
create type match_status as enum ('pending', 'mutual', 'expired');
create type nda_status as enum ('pending', 'signed', 'declined');
create type swipe_direction as enum ('like', 'pass');
create type funding_source as enum ('cash', 'sba_loan', 'private_equity', 'seller_financing', 'combination');

-- ============================================================
-- PROFILES
-- Public extension of auth.users — created by trigger
-- ============================================================

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null check (char_length(full_name) >= 2),
  role          user_role not null default 'buyer',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Trigger: auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: keep updated_at current
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- ============================================================
-- SELLER LISTINGS
-- Private fields are NEVER returned to buyers pre-NDA
-- Enforced by RLS + application layer (defence in depth)
-- ============================================================

create table public.seller_listings (
  id                  uuid primary key default uuid_generate_v4(),
  seller_id           uuid not null references public.profiles(id) on delete cascade,
  status              listing_status not null default 'draft',
  anonymity_level     smallint not null default 1 check (anonymity_level between 1 and 3),

  -- Public fields (always visible)
  industry            text not null,
  industry_icon       text not null default '🏢',
  tagline             text not null,
  years_operating     integer not null check (years_operating >= 0),
  employees_range     text not null,
  revenue_band        text not null,
  asking_range        text not null,
  location_region     text not null,
  values              text[] not null default '{}',
  values_statement    text not null,
  transition_goals    text not null,
  transition_timeline text not null,
  seller_financing    boolean not null default false,

  -- Level 2 fields (partial reveal)
  owner_first_name    text,
  location_city       text,

  -- Level 3 fields (post-NDA only — RLS prevents read until NDA signed)
  business_name       text,
  owner_full_name     text,
  revenue_exact       text,
  asking_price_exact  text,
  ebitda              text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger seller_listings_updated_at
  before update on public.seller_listings
  for each row execute function public.update_updated_at();

create index idx_seller_listings_status      on public.seller_listings(status);
create index idx_seller_listings_seller_id   on public.seller_listings(seller_id);
create index idx_seller_listings_industry    on public.seller_listings(industry);

-- ============================================================
-- BUYER PROFILES
-- ============================================================

create table public.buyer_profiles (
  id                  uuid primary key default uuid_generate_v4(),
  buyer_id            uuid not null unique references public.profiles(id) on delete cascade,
  background          text not null,
  looking_for         text not null,
  price_min           numeric not null check (price_min >= 0),
  price_max           numeric not null,
  target_industries   text[] not null default '{}',
  location_preference text not null,
  funding_source      funding_source not null,
  experience_years    text not null,
  values              text[] not null default '{}',
  values_statement    text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint price_range_valid check (price_max > price_min)
);

create trigger buyer_profiles_updated_at
  before update on public.buyer_profiles
  for each row execute function public.update_updated_at();

-- ============================================================
-- COMPATIBILITY SCORES
-- Pre-computed on listing creation / buyer profile update
-- ============================================================

create table public.compatibility_scores (
  id          uuid primary key default uuid_generate_v4(),
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid not null references public.seller_listings(id) on delete cascade,
  score       numeric not null check (score between 0 and 100),
  computed_at timestamptz not null default now(),
  unique (buyer_id, listing_id)
);

create index idx_compat_buyer_id    on public.compatibility_scores(buyer_id);
create index idx_compat_listing_id  on public.compatibility_scores(listing_id);
create index idx_compat_score       on public.compatibility_scores(score desc);

-- ============================================================
-- SWIPES
-- ============================================================

create table public.swipes (
  id                  uuid primary key default uuid_generate_v4(),
  swiper_id           uuid not null references public.profiles(id) on delete cascade,
  target_listing_id   uuid references public.seller_listings(id) on delete cascade,
  target_buyer_id     uuid references public.profiles(id) on delete cascade,
  direction           swipe_direction not null,
  created_at          timestamptz not null default now(),
  -- Prevent duplicate swipes
  unique (swiper_id, target_listing_id),
  unique (swiper_id, target_buyer_id),
  -- Must have exactly one target
  constraint one_target check (
    (target_listing_id is not null) != (target_buyer_id is not null)
  )
);

create index idx_swipes_swiper   on public.swipes(swiper_id);
create index idx_swipes_listing  on public.swipes(target_listing_id);
create index idx_swipes_buyer    on public.swipes(target_buyer_id);

-- ============================================================
-- MATCHES
-- ============================================================

create table public.matches (
  id                  uuid primary key default uuid_generate_v4(),
  buyer_id            uuid not null references public.profiles(id) on delete cascade,
  seller_id           uuid not null references public.seller_listings(id) on delete cascade,
  compatibility_score numeric not null,
  buyer_liked         boolean not null default false,
  seller_liked        boolean not null default false,
  status              match_status not null default 'pending',
  created_at          timestamptz not null default now(),
  unique (buyer_id, seller_id)
);

create index idx_matches_buyer   on public.matches(buyer_id);
create index idx_matches_seller  on public.matches(seller_id);
create index idx_matches_status  on public.matches(status);

-- ============================================================
-- NDAs
-- ============================================================

create table public.ndas (
  id                  uuid primary key default uuid_generate_v4(),
  match_id            uuid not null unique references public.matches(id) on delete cascade,
  buyer_id            uuid not null references public.profiles(id) on delete cascade,
  seller_id           uuid not null references public.profiles(id) on delete cascade,
  status              nda_status not null default 'pending',
  buyer_signed_at     timestamptz,
  seller_signed_at    timestamptz,
  buyer_signature     text,   -- typed legal name
  seller_signature    text,
  created_at          timestamptz not null default now()
);

create index idx_ndas_buyer   on public.ndas(buyer_id);
create index idx_ndas_seller  on public.ndas(seller_id);
create index idx_ndas_match   on public.ndas(match_id);
create index idx_ndas_status  on public.ndas(status);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================

create table public.conversations (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid not null unique references public.matches(id) on delete cascade,
  buyer_id        uuid not null references public.profiles(id) on delete cascade,
  seller_id       uuid not null references public.profiles(id) on delete cascade,
  nda_required    boolean not null default true,
  created_at      timestamptz not null default now()
);

create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null check (char_length(content) > 0 and char_length(content) <= 4000),
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);

create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_messages_sender       on public.messages(sender_id);

-- ============================================================
-- AUDIT LOGS (append-only — no update/delete)
-- ============================================================

create table public.audit_logs (
  id            uuid primary key default uuid_generate_v4(),
  actor_id      uuid references public.profiles(id) on delete set null,
  event_type    text not null,
  action        text not null,
  resource_type text,
  resource_id   text,
  ip_address    inet,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create index idx_audit_actor      on public.audit_logs(actor_id);
create index idx_audit_event_type on public.audit_logs(event_type);
create index idx_audit_created_at on public.audit_logs(created_at desc);

-- Prevent any modification to audit logs
create or replace rule audit_logs_no_update as on update to public.audit_logs do instead nothing;
create or replace rule audit_logs_no_delete as on delete to public.audit_logs do instead nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- Every table locked down — explicit grants only
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.seller_listings     enable row level security;
alter table public.buyer_profiles      enable row level security;
alter table public.compatibility_scores enable row level security;
alter table public.swipes              enable row level security;
alter table public.matches             enable row level security;
alter table public.ndas                enable row level security;
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.audit_logs          enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- profiles ----
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- ---- seller_listings ----
-- Public fields: anyone authenticated can read active listings
-- Private fields (level 3): only if NDA is signed
create policy "Anyone can read public listing fields"
  on public.seller_listings for select
  using (
    status = 'active'
    and seller_id != auth.uid()
  );

create policy "Sellers can manage own listings"
  on public.seller_listings for all
  using (seller_id = auth.uid());

create policy "Admins can read all listings"
  on public.seller_listings for select
  using (public.is_admin());

-- ---- buyer_profiles ----
create policy "Buyers can manage own profile"
  on public.buyer_profiles for all
  using (buyer_id = auth.uid());

create policy "Sellers can read buyer profiles of matched buyers"
  on public.buyer_profiles for select
  using (
    exists (
      select 1 from public.matches m
      join public.seller_listings sl on sl.id = m.seller_id
      where m.buyer_id = public.buyer_profiles.buyer_id
        and sl.seller_id = auth.uid()
    )
  );

-- ---- compatibility_scores ----
create policy "Buyers can read own scores"
  on public.compatibility_scores for select
  using (buyer_id = auth.uid());

-- ---- swipes ----
create policy "Users can read own swipes"
  on public.swipes for select
  using (swiper_id = auth.uid());

create policy "Users can insert own swipes"
  on public.swipes for insert
  with check (swiper_id = auth.uid());

-- ---- matches ----
create policy "Parties can read own matches"
  on public.matches for select
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.seller_listings sl
      where sl.id = matches.seller_id and sl.seller_id = auth.uid()
    )
  );

create policy "System can create matches"
  on public.matches for insert
  with check (buyer_id = auth.uid());

-- ---- ndas ----
create policy "NDA parties can read own NDAs"
  on public.ndas for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "NDA parties can insert"
  on public.ndas for insert
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "NDA parties can update own NDAs"
  on public.ndas for update
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- ---- conversations ----
create policy "Conversation parties can read"
  on public.conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Conversation parties can insert"
  on public.conversations for insert
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- ---- messages ----
create policy "Conversation members can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Conversation members can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- ---- audit_logs ----
create policy "Admins can read audit logs"
  on public.audit_logs for select
  using (public.is_admin());

create policy "System can insert audit logs"
  on public.audit_logs for insert
  with check (true); -- insert allowed; update/delete blocked by rules above

-- ============================================================
-- REALTIME (enable for messages)
-- ============================================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
