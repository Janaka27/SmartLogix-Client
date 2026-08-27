-- Payments — one row per Stripe PaymentIntent, tied to an order.
-- Written only by the server (create-intent route, using the buyer's session) and the
-- Stripe webhook (using the service-role key, since webhook delivery has no Supabase
-- session to authenticate as). Status here is the source of truth for whether an order
-- has actually been paid — never trust a client-reported "payment succeeded".

create type payment_status as enum (
  'requires_payment_method', 'processing', 'succeeded', 'failed', 'canceled'
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  stripe_payment_intent_id text not null unique,
  amount numeric not null check (amount >= 0),
  currency text not null default 'usd',
  status payment_status not null default 'requires_payment_method',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_id_idx on payments (order_id);
-- No separate index on stripe_payment_intent_id: the `unique` constraint above already
-- backs one.

create trigger set_updated_at before update on payments
  for each row execute function set_updated_at();

alter table payments enable row level security;

-- Buyers can read payment status for their own orders; all writes are server-side
-- (service role bypasses RLS entirely, so there is deliberately no insert/update policy).
create policy "payments_select_own_or_admin" on payments
  for select to authenticated
  using (
    exists (
      select 1 from orders o
      where o.id = payments.order_id
        and (o.buyer_id = (select auth.uid()) or private.is_admin())
    )
  );
