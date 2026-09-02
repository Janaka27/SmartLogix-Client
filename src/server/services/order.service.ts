import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface OrderItemInput {
  id: string; // product id
  quantity: number;
  price: number;
  weightKg: number;
  volumeCm3: number;
}

export interface PlaceOrderInput {
  buyerId: string;
  warehouseId: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPostalCode?: string | null;
  totalWeightKg: number;
  totalVolumeCm3: number;
  totalAmount: number;
  isUrgent: boolean;
  urgentFee: number;
  items: OrderItemInput[];
}

export const OrderService = {
  async placeOrder(input: PlaceOrderInput): Promise<{ id: string }> {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: input.buyerId,
        warehouse_id: input.warehouseId,
        status: "pending",
        delivery_lat: input.deliveryLat,
        delivery_lng: input.deliveryLng,
        delivery_address: input.deliveryAddress,
        delivery_city: input.deliveryCity,
        delivery_postal_code: input.deliveryPostalCode ?? null,
        total_weight_kg: input.totalWeightKg,
        total_volume_cm3: input.totalVolumeCm3,
        total_amount: input.totalAmount,
        is_urgent: input.isUrgent,
        urgent_fee: input.urgentFee,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Error placing order:", orderError.message);
      throw new Error(orderError.message);
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      input.items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        weight_kg: item.weightKg,
        volume_cm3: item.volumeCm3,
      })),
    );

    if (itemsError) {
      console.error("Error saving order items:", itemsError.message);
      throw new Error(itemsError.message);
    }

    return order;
  },
};
