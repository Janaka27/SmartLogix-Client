-- Fix: "infinite recursion detected in policy for relation orders"
--
-- orders_select_buyer_seller_admin (on orders) queried order_items directly,
-- and order_items_select_via_order (on order_items) queries orders directly.
-- Each triggers the other's RLS policy during query-plan expansion, looping
-- forever. Break the cycle with a SECURITY DEFINER helper: it queries
-- order_items/products with the function owner's privileges, bypassing RLS
-- on those tables entirely, so it can no longer re-trigger orders' policy.

create function private.is_seller_for_order(target_order_id uuid) returns boolean as $$
  select exists (
    select 1
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = target_order_id
      and p.seller_id = (select auth.uid())
  );
$$ language sql stable security definer set search_path = '';

grant execute on function private.is_seller_for_order(uuid) to authenticated;

drop policy "orders_select_buyer_seller_admin" on orders;

create policy "orders_select_buyer_seller_admin" on orders
  for select to authenticated
  using (
    buyer_id = (select auth.uid())
    or private.is_admin()
    or private.is_seller_for_order(id)
  );
