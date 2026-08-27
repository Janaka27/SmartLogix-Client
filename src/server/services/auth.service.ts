import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export const AuthService = {
  async login(email: string, password: string, options?: { rememberMe?: boolean }) {
    const client = options?.rememberMe === false ? createClient({ rememberMe: false }) : supabase;
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Error logging in:", error.message);
      throw new Error(error.message);
    }
    return data;
  },

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      console.error("Error signing up:", error.message);
      throw new Error(error.message);
    }
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
      throw new Error(error.message);
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error.message);
      throw new Error(error.message);
    }
    return data.session;
  },

  async getUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // No active session is a normal, expected state — not a failure.
      if (error.name === "AuthSessionMissingError") return null;
      console.error("Error getting user:", error.message);
      throw new Error(error.message);
    }
    return data.user;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
