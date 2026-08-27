import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface ProfileInput {
  fullName: string;
  email: string;
  phone: string;
}

export const ProfileService = {
  // Buyers get their `profiles` row created lazily on first sign-in, since
  // Supabase auth has no "on signup" hook wired up in this project yet.
  async ensureProfile(user: User) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) return;

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      role: "buyer",
      full_name: user.user_metadata?.full_name ?? null,
      email: user.email ?? null,
    });

    if (error) {
      console.error("Error creating profile:", error.message);
      throw new Error(error.message);
    }
  },

  async getMyProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error.message);
      throw new Error(error.message);
    }
    return data;
  },

  async updateMyProfile(userId: string, updates: ProfileInput) {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: updates.fullName,
        email: updates.email,
        phone: updates.phone,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error.message);
      throw new Error(error.message);
    }
  },
};
