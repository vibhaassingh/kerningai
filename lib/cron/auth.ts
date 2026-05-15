import "server-only";

import { env } from "@/lib/env";

/**
 * Cron handlers must verify the `Authorization: Bearer <CRON_SECRET>`
 * header before running. Vercel sets the env automatically on cron-
 * triggered invocations and includes a header that matches.
 *
 * Returns true if the request is authorised.
 */
export function isAuthorisedCron(request: Request): boolean {
  if (!env.CRON_SECRET) return false;
  const header = request.headers.get("authorization");
  if (!header) return false;
  return header === `Bearer ${env.CRON_SECRET}`;
}
