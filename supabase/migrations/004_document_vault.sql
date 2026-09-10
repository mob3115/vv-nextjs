-- ============================================================
-- Document Vault — real documents, gated by match/NDA status
-- Run via: supabase db push
-- ============================================================

-- ---- documents metadata ----
-- Actual file bytes live in the private 'vault-documents' Storage bucket
-- below; this table is the authorization + listing layer. RLS here is the
-- real gate — a buyer can only ever see rows their relationship with this
-- seller entitles them to, mirroring the matches/seller_listings join
-- pattern already used elsewhere in this schema.
create table public.documents (
  id          uuid primary key default uuid_generate_v4(),
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  file_name   text not null,
  file_path   text not null unique, -- storage object path
  file_size   bigint not null check (file_size >= 0),
  mime_type   text not null,
  tier        text not null default 'post-nda' check (tier in ('pre-nda', 'post-nda')),
  created_at  timestamptz not null default now()
);

create index idx_documents_seller on public.documents(seller_id);

alter table public.documents enable row level security;

create policy "Sellers can manage own documents"
  on public.documents for all
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

-- Pre-NDA ("teaser") documents are visible to any buyer with a mutual
-- match on this seller's listing — no NDA required yet.
create policy "Matched buyers can read pre-nda documents"
  on public.documents for select
  using (
    tier = 'pre-nda'
    and exists (
      select 1 from public.matches m
      join public.seller_listings sl on sl.id = m.seller_id
      where sl.seller_id = public.documents.seller_id
        and m.buyer_id = auth.uid()
        and m.status = 'mutual'
    )
  );

-- Post-NDA documents require a signed NDA between this buyer and seller.
create policy "NDA-signed buyers can read post-nda documents"
  on public.documents for select
  using (
    tier = 'post-nda'
    and exists (
      select 1 from public.ndas n
      where n.seller_id = public.documents.seller_id
        and n.buyer_id = auth.uid()
        and n.status = 'signed'
    )
  );

-- ---- Storage bucket ----
-- Private bucket — no storage.objects policies at all. Every read/write
-- goes through server actions using the service-role client, which only
-- ever acts after independently checking the documents table above (or,
-- for uploads, that the caller owns the target seller_id). This avoids
-- needing to duplicate the access rules above in storage.objects RLS.
insert into storage.buckets (id, name, public)
values ('vault-documents', 'vault-documents', false)
on conflict (id) do nothing;
