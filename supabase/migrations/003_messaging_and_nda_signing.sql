-- ============================================================
-- Messaging (read receipts) + NDA e-sign fields
-- Run via: supabase db push
-- ============================================================

-- ---- ndas: e-sign fields ----
-- initials captured alongside the typed full-legal-name signature, and the
-- template version that was actually agreed to (so a later edit to the NDA
-- boilerplate never changes what a past signature legally represents).
alter table public.ndas add column if not exists buyer_initials  text;
alter table public.ndas add column if not exists seller_initials text;
alter table public.ndas add column if not exists template_version text;

-- ---- conversations: allow the upsert-on-first-message race to resolve ----
-- getOrCreateConversation checks for an existing row before inserting, but
-- two concurrent "first message" sends (one from each party) could both
-- miss and then race on the same upsert; the loser needs an UPDATE policy
-- to resolve via ON CONFLICT DO UPDATE instead of erroring.
create policy "Conversation parties can update"
  on public.conversations for update
  using (buyer_id = auth.uid() or seller_id = auth.uid())
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- ---- messages: read receipts ----
-- There was previously no UPDATE policy on public.messages at all, so a
-- recipient could never mark a message read (same class of bug fixed for
-- public.matches in migration 002). Only the recipient (not the sender) of
-- a message, and only a member of its conversation, may update it.
create policy "Recipients can mark messages read"
  on public.messages for update
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  )
  with check (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- The policy above only limits WHICH ROWS may be updated, not which
-- COLUMNS — a raw API call could otherwise rewrite a message's content
-- after the fact. Lock every column except read_at once a message exists.
create or replace function public.messages_lock_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if new.content <> old.content
     or new.sender_id <> old.sender_id
     or new.conversation_id <> old.conversation_id
     or new.created_at <> old.created_at then
    raise exception 'messages: only read_at may be updated after creation';
  end if;
  return new;
end;
$$;

create trigger messages_lock_immutable_fields
  before update on public.messages
  for each row execute function public.messages_lock_immutable_fields();
