-- Add management training field to seller listings
-- This allows sellers to indicate openness to hiring a manager
-- who could potentially buy the firm over 12-24 months

alter table public.seller_listings
  add column if not exists management_training boolean not null default false;
