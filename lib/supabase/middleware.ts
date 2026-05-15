import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { maybeSupabaseEnv } from "@/lib/env";

/**
 * Refreshes the Supabase session cookie on every request. Called from
 * the root `middleware.ts`. Also returns the resolved Supabase response
 * so the caller can chain redirects/headers.
 *
 * When Supabase env isn't configured (e.g. local dev before the project
 * is provisioned), this gracefully returns the pass-through response —
 * the middleware then falls back to denying access to gated routes.
 */
export async function updateSession(request: NextRequest) {
  const supabaseEnv = maybeSupabaseEnv();
  if (!supabaseEnv) {
    return {
      response: NextResponse.next({ request }),
      user: null,
      supabaseConfigured: false as const,
    };
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: don't run code between createServerClient() and
  // supabase.auth.getUser(). It refreshes the session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    response: supabaseResponse,
    user,
    supabaseConfigured: true as const,
  };
}
