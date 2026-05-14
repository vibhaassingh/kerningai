# Operations

Background jobs, observability, incident response.

## Cron jobs (`vercel.json`)

| Path | Schedule | What |
|---|---|---|
| `/api/cron/stale-invites` | `0 3 * * *` (daily 03:00 UTC) | Marks expired pending invites |
| `/api/cron/expire-recommendations` | `0 * * * *` (hourly) | Expires pending agent recommendations past `expires_at`, records auto-rejection in the action ledger |
| `/api/cron/client-health` | `0 5 * * *` (daily 05:00 UTC) | Recomputes `client_settings.health_score` from pending approvals, open corrective actions, healthy-asset percentage |
| `/api/agents/run/maintenance_forecast` | `0 */6 * * *` | Triggered run for the maintenance-forecast agent template across every client with `predictive_maintenance` module enabled |
| `/api/agents/run/energy_optimization` | `30 */4 * * *` | Same for energy |
| `/api/agents/run/cold_chain_monitor` | `*/30 * * * *` | Same for cold-chain — most frequent because deviations are time-sensitive |

Each handler verifies `Authorization: Bearer <CRON_SECRET>` via
`lib/cron/auth.ts#isAuthorisedCron`. Vercel sets the env automatically
on cron-triggered invocations.

## Webhooks

Endpoint: `POST /api/webhooks/[connector]/[clientId]`.

Each `(connector, clientId)` pair has a shared HMAC secret stored in
`client_settings.metadata.webhook_secrets[connector]`. Senders include
the signature in `x-kai-signature` (hex SHA-256). Verified events
write to `audit_logs` and (Phase 4d) trigger downstream processing.

GET on the same path is a health check.

## Observability

`lib/observability/sentry.ts` is a stub. Once `SENTRY_DSN` is set in
env, swap the implementation to the real `@sentry/nextjs` SDK without
touching call sites:

```ts
import { captureException, captureMessage, withSentry } from "@/lib/observability/sentry";

await withSentry("blueprint.generate", async () => {
  // …
});
```

Until then, errors fall back to `console.error`.

## Incident response

1. Check `vercel logs --prod` for the relevant request.
2. Cross-reference with `audit_logs` (every consequential action
   writes one) via the Supabase SQL editor.
3. For agent decisions, the `agent_actions` ledger is append-only —
   review there in addition to `audit_logs`.
4. Auth events: `security_events` table.

For data corruption, the playbook is forward-fix migration; never edit
production rows directly except via service-role action wrappers that
write audit logs.

## Backups

Supabase Pro provides automated backups. For staging + production:

- Default retention: 7 days
- Recommended: bump to 30 days in **Project Settings → Database**

## Health checks

- `/api/webhooks/<connector>/<clientId>` (GET) — receiver health
- (Phase 5b) `/admin/system-health` — full dashboard

## Adding a cron job

1. Add a route handler under `app/api/cron/<task>/route.ts` — must
   call `isAuthorisedCron(req)` first.
2. Add the schedule to `vercel.json` `crons[]`.
3. Push to `main`. Vercel arms the cron on next deploy.
