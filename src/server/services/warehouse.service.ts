import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export const WarehousService = {
  async getAll() {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching warehouses:", error.message);
      throw new Error(error.message);
    }

    return data ?? [];
  },
};