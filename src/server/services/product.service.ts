import { createClient } from "@/lib/supabase/client";
import { toDisplayProduct, type DbProduct, type DisplayProduct } from "@/lib/products";

const supabase = createClient();

export const ProductService = {
  async getActive(): Promise<DisplayProduct[]> {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, weight_kg, status, images")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error.message);
      throw new Error(error.message);
    }

    return ((data ?? []) as DbProduct[]).map((p) => toDisplayProduct(p, "SmartLogix Marketplace"));
  },
};
