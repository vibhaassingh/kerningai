# Auth

Supabase Auth (GoTrue) under the hood, wrapped in Server Actions for
every flow. Email + password is primary; Google OAuth is the optional
secondary identity that users can link from settings.

## Routes

| Route | Purpose |
|---|---|
| `/login` | Email + password + (optional) Google sign-in |
| `/forgot-password` | Request a password reset email |
| `/reset-password` | Land here from the reset email; set new password |
| `/invite/[token]` | Land here from an invite email |
| `/accept-invite` | Set password + finalise membership |
| `/verify-email` | Confirm email after sign-up (Supabase template) |
| `/auth/callback` | OAuth callback for Google |
| `/logout` | Sign out + clear session cookie |

## Server Actions

In `lib/auth/actions.ts`:

- `signInWithPassword(prev, formData)` — primary login. Routes to
  `/admin` for internal staff, `/portal` for client members,
  `/accept-invite` if no active membership.
- `signInWithGoogle(returnTo)` — returns a Supabase `linkIdentity`-
  flavoured OAuth URL.
- `requestPasswordReset(prev, formData)` — sends the reset email.
  Always returns OK so we don't leak which emails exist.
- `resetPassword(prev, formData)` — runs after the reset link puts the
  user in a temporary recovery session.
- `changePassword(prev, formData)` — re-auths with the current
  password, then updates.
- `linkGoogleStart(returnTo)` / `linkGoogleComplete(code, state)` /
  `unlinkGoogle()` — connected-accounts management.
- `listConnectedAccounts()` — read for the security settings page.

Every action writes a `security_events` row via
`lib/audit/with-audit.ts#recordSecurityEvent`. `unlinkGoogle` refuses
when it would leave the user with no sign-in method.

## Helpers

`lib/auth/require.ts`:

- `requireUser()` — Server Component-friendly redirect-on-no-session.
- `requireOrg(orgId)` — verifies the current user is a member of `orgId`,
  with an internal-staff cross-org bypass (super_admin et al. operate
  across client orgs).
- `requirePermission(perm, orgId)` — checks the SQL function
  `app.has_permission(perm, org_id)` AND that the user belongs to the
  org. Throws `UnauthorizedError`.
- `hasPermissionAny(perm)` — global check (any of the user's
  memberships grants the permission). Used for surface-gating.

## Cookie + session model

- Supabase session lives in HTTP-only cookies, refreshed by root
  `middleware.ts` on every matching request.
- `app.current_user_id()` (SQL) returns `auth.uid()` — Supabase's
  asymmetric-JWT-aware accessor. RLS policies anchor on this.
- `lib/supabase/{client,server,service,middleware}.ts` are the only
  places that construct Supabase clients. `service.ts` is marked
  `import "server-only"` — it owns the service-role key.

## Tenant isolation

Three layers:

1. Server-side `requirePermission` / `requireOrg` checks at the top of
   every Server Action.
2. RLS policies on every tenant-owned table (`app.is_member_of`,
   `app.is_super_admin`, `app.is_internal_staff`, `app.has_permission`).
3. UI gating via `PermissionGate` / `hasPermissionAny`.

Layers 1 + 2 are load-bearing; layer 3 is convenience only.

## Connected Accounts

`/admin/settings/security` and `/portal/settings/security` render the
`ConnectedAccountsCard` server component. It calls
`listConnectedAccounts()` to read the current set of identities and
renders `ConnectedAccountsActions` (client) for the link/unlink flow.

`unlinkGoogle()` refuses when the user has no password set, returning
a typed error the form surfaces inline. The reverse is also safe — if
Google is the only sign-in method, the password "remove" path is
disabled (Phase 5b).

## Rate limiting

`lib/auth/rate-limit.ts` is a Phase 1 stub. When `UPSTASH_REDIS_REST_URL`
+ `UPSTASH_REDIS_REST_TOKEN` are set in env, Phase 5b swaps in
`@upstash/ratelimit` to gate `/login`, `/forgot-password`, and
`/accept-invite` at 5 attempts / 15 min / IP.

## Audit logging

Every consequential action — auth events, RBAC changes, agent
approvals — writes both:

- A `security_events` row (auth-specific, append-only)
- An `audit_logs` row (cross-cutting, with `before` + `after` JSONB)

The `withAudit(ctx, fn)` wrapper in `lib/audit/with-audit.ts` makes
this a one-liner for Server Actions.
