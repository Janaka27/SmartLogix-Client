export interface TrackingOrder {
  id: string;
  status: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryAddress: string;
  deliveryCity: string | null;
  totalAmount: number;
  etaMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingWarehouse {
  id: string;
  name: string;
  city: string | null;
  latitude: number;
  longitude: number;
}

export interface TrackingAssignment {
  id: string;
  status: string;
  departedAt: string | null;
  deliveredAt: string | null;
}

export interface TrackingDrone {
  droneCode: string;
  model: string | null;
  speedKmh: number;
  batteryCapacityPct: number;
  status: string;
}

export interface TrackingData {
  order: TrackingOrder;
  warehouse: TrackingWarehouse;
  distanceKm: number;
  assignment: TrackingAssignment | null;
  drone: TrackingDrone | null;
}

export const TrackingService = {
  async getByOrderId(orderId: string): Promise<TrackingData> {
    const response = await fetch(`/api/orders/${orderId}/tracking`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "Could not find that order");
    }
    return response.json();
  },
};
