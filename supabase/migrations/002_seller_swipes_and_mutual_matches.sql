-- ============================================================
-- Seller-side matching: allow matches to become mutual
-- Run via: supabase db push
-- ============================================================

-- There was previously no UPDATE policy on public.matches at all, so a
-- match could never be flipped from 'pending' to 'mutual' — not even
-- after fixing the application code that failed to save seller swipes.
--
-- Mirrors the existing "Parties can read own matches" policy: a buyer
-- is a party via matches.buyer_id, a seller is a party via the listing
-- that matches.seller_id points to.
create policy "Parties can update own matches"
  on public.matches for update
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.seller_listings sl
      where sl.id = matches.seller_id and sl.seller_id = auth.uid()
    )
  )
  with check (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.seller_listings sl
      where sl.id = matches.seller_id and sl.seller_id = auth.uid()
    )
  );
