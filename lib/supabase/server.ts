import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabaseEnv } from "@/lib/env";

/**
 * Server-side Supabase client. Reads + writes the session cookie on every
 * request. Use in Server Components, Server Actions, and Route Handlers.
 *
 * The client uses the anon key — RLS still applies. For trusted bypass,
 * use `lib/supabase/service.ts`.
 */
export async function createClient() {
  const env = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies. The middleware refreshes
            // the session on every request, so missing setAll here is fine.
          }
        },
      },
    },
  );
}
