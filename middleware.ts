import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root middleware: refreshes the Supabase session cookie on every
 * matching request, then gates `/admin/*` and `/portal/*` for
 * authenticated users.
 *
 * Fine-grained role + permission checks happen inside the layouts and
 * Server Actions; this middleware only handles the cheap auth-or-not
 * decision.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, user, supabaseConfigured } = await updateSession(request);

  const isAuthedRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/portal");

  if (isAuthedRoute) {
    if (!supabaseConfigured) {
      // Without Supabase, nothing in admin/portal can work. Send the user
      // to a setup-pending page so they don't see a half-broken UI.
      const setupUrl = new URL("/setup-pending", request.url);
      return NextResponse.redirect(setupUrl);
    }
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Already signed in? Bounce away from auth screens.
  const isAuthFormRoute =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  if (isAuthFormRoute && user) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return response;
}

export const config = {
  /**
   * Matches everything except static assets, image optimization, favicons,
   * and the public OG image route. Keep this list narrow — middleware runs
   * on every request that matches.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|opengraph-image|robots.txt|sitemap.xml|brand/|videos/|images/|fonts/).*)",
  ],
};
