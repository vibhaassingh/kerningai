import { NextResponse, type NextRequest } from "next/server";

import { recordSecurityEvent } from "@/lib/audit/with-audit";
import { safeRedirectTarget } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { SUPABASE_CONFIGURED } from "@/lib/env";

/**
 * OAuth + email-link callback. Supabase appends a `code` query param
 * after PKCE redirect; exchange it for a session, mirror Google identity
 * into `connected_accounts`, then bounce to the requested `next` path.
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.redirect(new URL("/setup-pending", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectTarget(searchParams.get("next"));
  const errorParam = searchParams.get("error_description") ?? searchParams.get("error");

  if (errorParam) {
    const url = new URL("/login", origin);
    url.searchParams.set("oauthError", errorParam);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set("oauthError", error.message);
    return NextResponse.redirect(url);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mirror Google identity into our `connected_accounts` view + record
  // a security event. We don't fail the redirect if either step errors —
  // those are observability concerns, not auth-correctness concerns.
  if (user) {
    try {
      const google = user.identities?.find((i) => i.provider === "google");
      if (google) {
        const service = createServiceClient();
        await service
          .from("connected_accounts")
          .upsert(
            {
              user_id: user.id,
              provider: "google",
              provider_user_id: google.id,
              email:
                (google.identity_data?.email as string | undefined) ??
                user.email ??
                null,
            },
            { onConflict: "user_id,provider" },
          );

        // Distinguish "linked from settings" vs "signed in fresh". If the
        // only sign-in event in the last minute is a 'login_succeeded',
        // assume sign-in. Otherwise treat as link event.
        await recordSecurityEvent({
          userId: user.id,
          kind: searchParams.get("link") === "1" ? "google_linked" : "login_succeeded",
          ip:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            request.headers.get("x-real-ip"),
          userAgent: request.headers.get("user-agent"),
        });
      }
    } catch (err) {
      console.error("[auth/callback] post-exchange housekeeping failed", err);
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
