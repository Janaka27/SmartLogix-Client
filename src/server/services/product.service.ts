import { createClient } from "@/lib/supabase/client";
import { toDisplayProduct, type DbProduct, type DisplayProduct } from "@/lib/products";

const supabase = createClient();

export const ProductService = {
  async getActive(): Promise<DisplayProduct[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error.message);
      throw new Error(error.message);
    }

    return ((data ?? []) as DbProduct[]).map((p) => toDisplayProduct(p, "SmartLogix Marketplace"));
  },

  async getById(id: string): Promise<DisplayProduct | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product:", error.message);
      throw new Error(error.message);
    }
    if (!data) return null;

    return toDisplayProduct(data as DbProduct, "SmartLogix Marketplace");
  },
};
