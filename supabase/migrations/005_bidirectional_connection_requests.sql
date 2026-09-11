-- ============================================================
-- Bidirectional connection requests: a seller's "like" on a buyer now
-- creates a visible pending match, symmetric with a buyer's like.
-- Run via: supabase db push
-- ============================================================

-- The existing insert policy ("System can create matches", migration 001)
-- only allows a match row to be inserted when buyer_id = auth.uid() — i.e.
-- only a buyer session could ever create a match row. That was fine while
-- a seller's "like" only ever updated an *existing* row (see recordSwipe's
-- seller branch, src/lib/actions/marketplace.ts), but now a seller can be
-- the first party to like, which means the insert happens from the
-- seller's own session instead. Postgres OR's multiple permissive policies
-- for the same command together, so this adds the seller-initiated case
-- alongside the existing buyer-initiated one rather than replacing it.
create policy "Sellers can create pending matches"
  on public.matches for insert
  with check (
    exists (
      select 1 from public.seller_listings sl
      where sl.id = matches.seller_id and sl.seller_id = auth.uid()
    )
  );
