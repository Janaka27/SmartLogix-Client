-- SmartLogix / DroneLogix — initial schema
-- Two Next.js sites (buyer Marketplace + Seller/Admin Portal) sharing this one Supabase project.
-- Source: Claude.pdf ("DroneLogix — Two-Site Drone Delivery Marketplace" structure guide).

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

create type user_role as enum ('buyer', 'seller', 'admin');
create type seller_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type product_status as enum ('draft', 'active', 'out_of_stock', 'suspended');
create type drone_status as enum ('available', 'in_flight', 'charging', 'maintenance');
create type order_status as enum (
  'pending', 'processing', 'allocated', 'in_flight', 'delivered', 'cancelled', 'rejected'
);
create type delivery_feasibility as enum ('drone_deliverable', 'needs_split', 'rejected');
create type assignment_status as enum ('scheduled', 'in_flight', 'delivered', 'cancelled');

-- ============================================================================
-- 2. PROFILES  (extends auth.users; role drives RLS on both sites)
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'buyer',
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seller-specific fields, kept off `profiles` so buyer rows stay lean.
create table seller_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  store_name text not null,
  description text,
  status seller_status not null default 'pending',
  payout_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 3. WAREHOUSES  (also doubles as charging-station node when charging_station = true)
-- ============================================================================

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_seller_facing boolean not null default true,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  capacity int,
  drone_dock_count int not null default 0,
  charging_station boolean not null default false,
  created_at timestamptz not null default now()
);

-- Candidate flight corridors between warehouses/charging stations.
-- Doubles as: (a) Dijkstra edge set for route optimization, (b) Prim's MST
-- candidate edge set for the Network Analysis Dashboard (is_built = MST result).
create table network_edges (
  id uuid primary key default gen_random_uuid(),
  warehouse_a_id uuid not null references warehouses (id) on delete cascade,
  warehouse_b_id uuid not null references warehouses (id) on delete cascade,
  distance_km numeric not null check (distance_km > 0),
  build_cost numeric not null check (build_cost >= 0),
  no_fly_zone_penalty numeric not null default 0,
  is_built boolean not null default false,
  created_at timestamptz not null default now(),
  constraint network_edges_no_self_loop check (warehouse_a_id <> warehouse_b_id),
  constraint network_edges_unique_pair unique (warehouse_a_id, warehouse_b_id)
);

-- ============================================================================
-- 4. DRONES  (fleet; replaces the original single-constraint `vehicles` table)
-- ============================================================================

create table drones (
  id uuid primary key default gen_random_uuid(),
  drone_code text not null unique,
  model text,
  max_payload_kg numeric not null default 85 check (max_payload_kg > 0),
  cargo_bay_length_cm numeric not null check (cargo_bay_length_cm > 0),
  cargo_bay_width_cm numeric not null check (cargo_bay_width_cm > 0),
  cargo_bay_height_cm numeric not null check (cargo_bay_height_cm > 0),
  cargo_bay_volume_cm3 numeric generated always as
    (cargo_bay_length_cm * cargo_bay_width_cm * cargo_bay_height_cm) stored,
  max_range_km numeric not null check (max_range_km > 0),
  battery_capacity_pct numeric not null default 100 check (battery_capacity_pct between 0 and 100),
  speed_kmh numeric not null check (speed_kmh > 0),
  status drone_status not null default 'available',
  home_warehouse_id uuid references warehouses (id) on delete set null,
  current_lat numeric(9, 6),
  current_lng numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 5. PRODUCTS  (hard 85kg / cargo-bay-envelope limits enforced at insert)
-- ============================================================================

create table products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles (id) on delete cascade,
  warehouse_id uuid not null references warehouses (id) on delete restrict,
  name text not null,
  description text,
  category text,
  price numeric not null check (price >= 0),
  stock_qty int not null default 0 check (stock_qty >= 0),
  weight_kg numeric not null check (weight_kg > 0 and weight_kg <= 85),
  length_cm numeric not null check (length_cm > 0),
  width_cm numeric not null check (width_cm > 0),
  height_cm numeric not null check (height_cm > 0),
  volume_cm3 numeric generated always as (length_cm * width_cm * height_cm) stored,
  fragile boolean not null default false,
  images text[] not null default '{}',
  status product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 6. ROUTES  (persisted flight path per drone assignment: Dijkstra leg +
--    optional Simulated-Annealing multi-stop closed-loop tour)
-- ============================================================================

create table routes (
  id uuid primary key default gen_random_uuid(),
  origin_warehouse_id uuid not null references warehouses (id) on delete restrict,
  -- ordered stop list, e.g. [{"order_id": "...", "lat": ..., "lng": ..., "sequence": 1}, ...]
  stops jsonb not null default '[]',
  total_distance_km numeric not null check (total_distance_km >= 0),
  algorithm text not null default 'dijkstra',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. ORDERS  /  ORDER ITEMS
-- ============================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles (id) on delete cascade,
  warehouse_id uuid not null references warehouses (id) on delete restrict,
  status order_status not null default 'pending',
  delivery_lat numeric(9, 6) not null,
  delivery_lng numeric(9, 6) not null,
  delivery_address text not null,
  delivery_city text,
  delivery_postal_code text,
  distance_km numeric,
  eta_minutes int,
  feasibility delivery_feasibility,
  total_weight_kg numeric not null default 0,
  total_volume_cm3 numeric not null default 0,
  total_amount numeric not null default 0,
  drone_assignment_id uuid, -- FK added below, after drone_assignments exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  weight_kg numeric not null,
  volume_cm3 numeric not null,
  subtotal numeric generated always as (quantity * unit_price) stored
);

-- ============================================================================
-- 8. DRONE ASSIGNMENTS  (one assignment can batch multiple orders onto one flight)
-- ============================================================================

create table drone_assignments (
  id uuid primary key default gen_random_uuid(),
  drone_id uuid not null references drones (id) on delete restrict,
  route_id uuid references routes (id) on delete set null,
  total_weight_kg numeric not null check (total_weight_kg <= 85),
  total_volume_cm3 numeric not null,
  status assignment_status not null default 'scheduled',
  departed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table orders
  add constraint orders_drone_assignment_id_fkey
  foreign key (drone_assignment_id) references drone_assignments (id) on delete set null;

-- ============================================================================
-- 9. DECISION LOGS  (audit trail for the delivery-feasibility Decision Tree)
-- ============================================================================

create table decision_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  -- inputs: weight, volume, distance to nearest capable drone, battery/range margin, weather flag
  inputs jsonb not null,
  output delivery_feasibility not null,
  model_version text not null default 'v1',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 10. BENCHMARK LOGS  (every algorithm run, for the coursework evaluation charts)
-- ============================================================================

create table benchmark_logs (
  id uuid primary key default gen_random_uuid(),
  task_name text not null, -- e.g. 'route_optimization', 'resource_allocation', 'network_analysis',
                            -- 'decision_module', 'delivery_batching'
  algorithm text not null, -- e.g. 'dijkstra', 'constrained_knapsack', 'prims_mst',
                            -- 'decision_tree', 'simulated_annealing'
  input_params jsonb,
  result jsonb,
  execution_time_ms numeric,
  run_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 11. INDEXES
-- ============================================================================

create index products_seller_id_idx on products (seller_id);
create index products_warehouse_id_idx on products (warehouse_id);
create index products_status_idx on products (status);
create index products_category_idx on products (category);

create index drones_status_idx on drones (status);
create index drones_home_warehouse_id_idx on drones (home_warehouse_id);

create index orders_buyer_id_idx on orders (buyer_id);
create index orders_warehouse_id_idx on orders (warehouse_id);
create index orders_status_idx on orders (status);
create index orders_drone_assignment_id_idx on orders (drone_assignment_id);

create index order_items_order_id_idx on order_items (order_id);
create index order_items_product_id_idx on order_items (product_id);

create index drone_assignments_drone_id_idx on drone_assignments (drone_id);
create index drone_assignments_route_id_idx on drone_assignments (route_id);
create index routes_origin_warehouse_id_idx on routes (origin_warehouse_id);
create index network_edges_warehouse_a_id_idx on network_edges (warehouse_a_id);
create index network_edges_warehouse_b_id_idx on network_edges (warehouse_b_id);
create index benchmark_logs_task_name_idx on benchmark_logs (task_name);
create index benchmark_logs_run_by_idx on benchmark_logs (run_by);
create index decision_logs_order_id_idx on decision_logs (order_id);

-- ============================================================================
-- 12. updated_at TRIGGERS
-- ============================================================================

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger set_updated_at before update on seller_profiles
  for each row execute function set_updated_at();
create trigger set_updated_at before update on drones
  for each row execute function set_updated_at();
create trigger set_updated_at before update on products
  for each row execute function set_updated_at();
create trigger set_updated_at before update on orders
  for each row execute function set_updated_at();

-- ============================================================================
-- 13. ROW LEVEL SECURITY
-- Site A (Marketplace) = buyer role. Site B (Seller & Admin Portal) = seller/admin roles.
-- Both sites hit the same tables; RLS is what actually separates them.
--
-- Helper functions live in a `private` schema (not exposed via the Data API, so they
-- can't be called directly as rpc/is_admin) and use `set search_path = ''` so every
-- reference inside them is fully schema-qualified — this closes the search-path
-- hijacking hole that SECURITY DEFINER functions are otherwise exposed to.
-- ============================================================================

create schema if not exists private;

create function private.current_role() returns public.user_role as $$
  select role from public.profiles where id = (select auth.uid());
$$ language sql stable security definer set search_path = '';

create function private.is_admin() returns boolean as $$
  select private.current_role() = 'admin';
$$ language sql stable security definer set search_path = '';

create function private.is_seller() returns boolean as $$
  select private.current_role() = 'seller';
$$ language sql stable security definer set search_path = '';

-- These only need to run *inside* RLS policies on tables in `public`, evaluated as
-- whichever role is making the request.
grant usage on schema private to anon, authenticated;
grant execute on function private.current_role() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_seller() to anon, authenticated;

-- A buyer updating their own `profiles` row (own-row UPDATE policy below) must not be
-- able to hand themselves 'seller' or 'admin' — only an admin may change `role`.
create function prevent_role_self_escalation() returns trigger as $$
begin
  if new.role <> old.role and not private.is_admin() then
    raise exception 'Only admins can change role';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger prevent_role_self_escalation before update on profiles
  for each row execute function prevent_role_self_escalation();

-- Same problem on `seller_profiles.status`: a seller must not be able to self-approve.
create function prevent_seller_status_self_approval() returns trigger as $$
begin
  if new.status <> old.status and not private.is_admin() then
    raise exception 'Only admins can change seller status';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger prevent_seller_status_self_approval before update on seller_profiles
  for each row execute function prevent_seller_status_self_approval();

alter table profiles enable row level security;
alter table seller_profiles enable row level security;
alter table warehouses enable row level security;
alter table network_edges enable row level security;
alter table drones enable row level security;
alter table products enable row level security;
alter table routes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table drone_assignments enable row level security;
alter table decision_logs enable row level security;
alter table benchmark_logs enable row level security;

-- profiles: everyone can read/update their own row (role changes blocked by the
-- trigger above); admins read/write all.
create policy "profiles_select_own_or_admin" on profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());
create policy "profiles_update_own_or_admin" on profiles
  for update to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());
create policy "profiles_insert_own" on profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

-- seller_profiles: seller manages their own row (status changes blocked by the
-- trigger above, so approve/reject/suspend stays admin-only); admins manage all.
create policy "seller_profiles_select_own_or_admin" on seller_profiles
  for select to authenticated
  using (profile_id = (select auth.uid()) or private.is_admin());
create policy "seller_profiles_insert_own" on seller_profiles
  for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "seller_profiles_update_own_or_admin" on seller_profiles
  for update to authenticated
  using (profile_id = (select auth.uid()) or private.is_admin())
  with check (profile_id = (select auth.uid()) or private.is_admin());

-- warehouses: public read (needed for buyer-side delivery-range checks); admin write.
create policy "warehouses_select_all" on warehouses
  for select to anon, authenticated using (true);
create policy "warehouses_write_admin" on warehouses
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- network_edges, routes, drones, drone_assignments, decision_logs, benchmark_logs:
-- operational data for Site B only.
create policy "network_edges_admin_only" on network_edges
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "drones_read_seller_or_admin" on drones
  for select to authenticated using (private.is_seller() or private.is_admin());
create policy "drones_write_admin" on drones
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "routes_read_seller_or_admin" on routes
  for select to authenticated using (private.is_seller() or private.is_admin());
create policy "routes_write_admin" on routes
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "drone_assignments_read_seller_or_admin" on drone_assignments
  for select to authenticated using (private.is_seller() or private.is_admin());
create policy "drone_assignments_write_admin" on drone_assignments
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "decision_logs_read_admin" on decision_logs
  for select to authenticated using (private.is_admin());
create policy "decision_logs_insert_system" on decision_logs
  for insert to authenticated with check (private.is_admin());

create policy "benchmark_logs_admin_only" on benchmark_logs
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- products: public reads active listings; sellers manage their own; admins manage all.
create policy "products_select_active_or_owner_or_admin" on products
  for select to anon, authenticated
  using (status = 'active' or seller_id = (select auth.uid()) or private.is_admin());
create policy "products_insert_own_seller" on products
  for insert to authenticated
  with check (seller_id = (select auth.uid()) and private.is_seller());
create policy "products_update_own_or_admin" on products
  for update to authenticated
  using (seller_id = (select auth.uid()) or private.is_admin())
  with check (seller_id = (select auth.uid()) or private.is_admin());
create policy "products_delete_own_or_admin" on products
  for delete to authenticated
  using (seller_id = (select auth.uid()) or private.is_admin());

-- orders: buyers place and view their own orders; sellers see orders containing their
-- products; admins see everything. Status/assignment transitions are system- or
-- admin-driven (checkout, Decision Tree, Knapsack batching, Admin manual override),
-- so there is deliberately no buyer/seller UPDATE policy here — only admin can write.
create policy "orders_select_buyer_seller_admin" on orders
  for select to authenticated
  using (
    buyer_id = (select auth.uid())
    or private.is_admin()
    or exists (
      select 1 from order_items oi
      join products p on p.id = oi.product_id
      where oi.order_id = orders.id and p.seller_id = (select auth.uid())
    )
  );
create policy "orders_insert_own_buyer" on orders
  for insert to authenticated
  with check (buyer_id = (select auth.uid()));
create policy "orders_update_admin" on orders
  for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- order_items: visible to whoever can see the parent order; inserted only as part of
-- the buyer's own order (checkout).
create policy "order_items_select_via_order" on order_items
  for select to authenticated
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (
          o.buyer_id = (select auth.uid())
          or private.is_admin()
          or exists (
            select 1 from products p
            where p.id = order_items.product_id and p.seller_id = (select auth.uid())
          )
        )
    )
  );
create policy "order_items_insert_via_order" on order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and o.buyer_id = (select auth.uid())
    )
  );
