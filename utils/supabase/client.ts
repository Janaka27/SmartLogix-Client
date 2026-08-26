import { createBrowserClient } from "@supabase/ssr";

// @supabase/ssr persists the session in a cookie with a 400-day maxAge by
// default (the max Chrome allows) — effectively always "remembered". When the
// user unchecks "Remember me" at sign-in, we shorten that to a same-day
// session instead, via a one-off (non-singleton) client so the option isn't
// silently ignored by an already-cached default client elsewhere on the page.
const SHORT_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export function createClient(options?: { rememberMe?: boolean }) {
  if (options?.rememberMe === false) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookieOptions: { maxAge: SHORT_SESSION_MAX_AGE },
        isSingleton: false,
      },
    );
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
