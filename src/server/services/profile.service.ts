import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface ProfileInput {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
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
      .select("full_name, email, phone, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error.message);
      throw new Error(error.message);
    }
    return data;
  },

  // Email is intentionally left out here — it's the login credential, so
  // changing it goes through Supabase auth's own confirmation flow, not a
  // plain profile update. The preferences form keeps the field read-only.
  async updateMyProfile(userId: string, updates: ProfileInput) {
    const payload: Record<string, unknown> = {
      full_name: updates.fullName,
      phone: updates.phone,
    };
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error.message);
      throw new Error(error.message);
    }
  },
};
