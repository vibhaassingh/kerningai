import { signOut } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";

/**
 * Renders nothing — immediately invokes the signOut Server Action which
 * redirects to /login. Useful as a target for "Sign out" links across
 * the app so the destination is consistent.
 */
export default async function LogoutPage() {
  await signOut();
  return null;
}
