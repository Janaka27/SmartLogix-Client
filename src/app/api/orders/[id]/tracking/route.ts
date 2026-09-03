import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { haversineDistanceKm } from "@/lib/geo";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // RLS (orders_select_buyer_seller_admin) already scopes this to the caller's
  // own order, but we check buyer_id explicitly so a mismatch fails loudly
  // instead of silently returning someone else's order — same convention as
  // the payments/create-intent route.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, buyer_id, warehouse_id, status, delivery_lat, delivery_lng, delivery_address, delivery_city, total_amount, distance_km, eta_minutes, drone_assignment_id, created_at, updated_at",
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order || order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: warehouse, error: warehouseError } = await supabase
    .from("warehouses")
    .select("id, name, city, latitude, longitude")
    .eq("id", order.warehouse_id)
    .single();

  if (warehouseError || !warehouse) {
    return NextResponse.json({ error: "Warehouse not found for this order" }, { status: 404 });
  }

  const origin = { lat: Number(warehouse.latitude), lng: Number(warehouse.longitude) };
  const destination = { lat: Number(order.delivery_lat), lng: Number(order.delivery_lng) };
  const distanceKm = order.distance_km ?? haversineDistanceKm(origin, destination);

  let assignment: {
    id: string;
    status: string;
    departedAt: string | null;
    deliveredAt: string | null;
  } | null = null;
  let drone: {
    droneCode: string;
    model: string | null;
    speedKmh: number;
    batteryCapacityPct: number;
    status: string;
  } | null = null;

  // Buyers can't read `drone_assignments`/`drones` under RLS (by design —
  // fleet internals stay seller/admin/warehouse-manager only), so this one
  // narrow lookup goes through the service-role client. Ownership of the
  // order was already verified above; nothing here is caller-controlled.
  if (order.drone_assignment_id) {
    const admin = createAdminClient();
    const { data: assignmentRow } = await admin
      .from("drone_assignments")
      .select("id, status, departed_at, delivered_at, drone_id")
      .eq("id", order.drone_assignment_id)
      .maybeSingle();

    if (assignmentRow) {
      assignment = {
        id: assignmentRow.id,
        status: assignmentRow.status,
        departedAt: assignmentRow.departed_at,
        deliveredAt: assignmentRow.delivered_at,
      };

      const { data: droneRow } = await admin
        .from("drones")
        .select("drone_code, model, speed_kmh, battery_capacity_pct, status")
        .eq("id", assignmentRow.drone_id)
        .maybeSingle();

      if (droneRow) {
        drone = {
          droneCode: droneRow.drone_code,
          model: droneRow.model,
          speedKmh: Number(droneRow.speed_kmh),
          batteryCapacityPct: Number(droneRow.battery_capacity_pct),
          status: droneRow.status,
        };
      }
    }
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      deliveryLat: destination.lat,
      deliveryLng: destination.lng,
      deliveryAddress: order.delivery_address,
      deliveryCity: order.delivery_city,
      totalAmount: Number(order.total_amount),
      etaMinutes: order.eta_minutes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    },
    warehouse: {
      id: warehouse.id,
      name: warehouse.name,
      city: warehouse.city,
      latitude: origin.lat,
      longitude: origin.lng,
    },
    distanceKm,
    assignment,
    drone,
  });
}
