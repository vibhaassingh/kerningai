# Operator bootstrap — production state as of 2026-05-15

What's actually deployed, with live IDs/URLs/regions. Use this as the
source of truth; the broader `docs/deployment.md` describes the generic
flow but uses placeholder values.

---

## Production environment

| | Value |
|---|---|
| Live URL (canonical) | https://ai.kerning.ooo |
| Aliases | https://kerningai.eu · https://kerningai.in · https://kerningai.us |
| Vercel project | `kerningai` (under team `kerning-ooo`) |
| Latest production deployment | `kerningai-jqhyauu4t-kerning-ooo.vercel.app` (auto-aliased) |
| Vercel envs (production) | 12 |
| Vercel envs (preview) | 9 |

## Supabase

| | Staging | Production |
|---|---|---|
| Project ref | `jofqeeecusayiuzlvnvf` | `memmprzccuruxkrnjnwb` |
| Region | South Asia (Mumbai) — `ap-south-1` | South Asia (Mumbai) — `ap-south-1` |
| Plan | Pro | Pro |
| URL | `https://jofqeeecusayiuzlvnvf.supabase.co` | `https://memmprzccuruxkrnjnwb.supabase.co` |
| Compute | Micro (1 GB / 2-core ARM) | Micro (1 GB / 2-core ARM) |
| Migrations applied | 21 of 21 | 21 of 21 |
| Saurabh seed | yes — 4 canvases / 117 nodes / 130 edges | yes |
| Google provider | enabled | enabled |
| `site_url` | `https://ai.kerning.ooo` | `https://ai.kerning.ooo` |
| `uri_allow_list` | full set | full set |

## Google OAuth client

| | Value |
|---|---|
| GCP project | `kerning-maps` |
| Client name | `Kerning AI Portal` |
| Client ID | `72971418128-2pcpe8hmqmjhcmhg9k9mongg3n7jibdk.apps.googleusercontent.com` |
| Authorized JS origins | `https://ai.kerning.ooo`, `https://kerningai.eu`, `http://localhost:3000` |
| Authorized redirect URIs | 6 entries: 3 Supabase callbacks + 3 Next `/auth/callback` |
| Consent screen | "Testing" mode — internal kerning.ooo users only until verified |

## Production super-admin

| | Value |
|---|---|
| Email | `vibhaas.singh@kerning.ooo` |
| Auth user ID | `79f26bbe-3afa-4f8c-b4b8-2daad05e6cba` |
| Org | Kerning AI internal (`00000000-0000-0000-0000-000000000001`) |
| Role | `super_admin` |
| Email verified | yes (auto-confirmed via Admin API) |
| Password | set during admin-API user creation; reset via Supabase Studio if forgotten |

## Resend

| | Value |
|---|---|
| Verified domain | `noreply.kerningai.eu` |
| Domain ID | `1951069d-26a9-40a3-ade7-2f70ee84312a` |
| Region | Tokyo — `ap-northeast-1` |
| DKIM | verified |
| SPF (TXT + MX) | verified |
| `RESEND_FROM_EMAIL` | `Kerning AI <hello@noreply.kerningai.eu>` |

DNS records on `kerningai.eu` (Vercel-managed):
- TXT `resend._domainkey.noreply` → DKIM public key
- TXT `send.noreply` → `v=spf1 include:amazonses.com ~all`
- MX  `send.noreply` → `feedback-smtp.ap-northeast-1.amazonses.com` priority 10

## GitHub

| | Value |
|---|---|
| Repo | `vibhaassingh/kerningai` |
| Default branch | `main` |
| Branch protection on `main` | enforce_admins, no force-push, no deletions, PR required (0 approvers) |
| Active feature branch | `phase-1/foundation` (currently 4 commits ahead of main) |
| Open PR | #1 (https://github.com/vibhaassingh/kerningai/pull/1) |
| CI workflow | `.github/workflows/ci.yml` — typecheck + lint + test + build on PR + push to main |

## Vercel envs (production)

```
NEXT_PUBLIC_SUPABASE_URL          = https://memmprzccuruxkrnjnwb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ... (prod anon JWT)
SUPABASE_SERVICE_ROLE_KEY         = eyJ... (prod service-role JWT, sensitive)
GOOGLE_CLIENT_ID                  = 72971418128-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET              = GOCSPX-... (sensitive)
APP_ENV                           = production
ALLOWED_REDIRECT_HOSTS            = kerningai.eu,kerningai.in,kerningai.us,kerningai.vercel.app
CRON_SECRET                       = (32-byte random hex, sensitive)
NEXT_PUBLIC_SITE_URL              = https://kerningai.eu
RESEND_API_KEY                    = re_... (10 days old, pre-existing)
RESEND_FROM_EMAIL                 = Kerning AI <hello@noreply.kerningai.eu>
CONTACT_TO_EMAIL                  = (pre-existing)
```

## Vercel envs (preview)

Same shape, with **staging** Supabase URL/keys and `APP_ENV=staging`:

```
NEXT_PUBLIC_SUPABASE_URL          = https://jofqeeecusayiuzlvnvf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ... (staging anon JWT)
SUPABASE_SERVICE_ROLE_KEY         = eyJ... (staging service-role JWT, sensitive)
GOOGLE_CLIENT_ID                  = (same client across envs)
GOOGLE_CLIENT_SECRET              = (same)
APP_ENV                           = staging
ALLOWED_REDIRECT_HOSTS            = (same)
CRON_SECRET                       = (same hex string)
NEXT_PUBLIC_SITE_URL              = https://staging-kerningai.vercel.app
RESEND_FROM_EMAIL                 = (same)
```

---

## Quick-fire ops recipes

### Re-deploy production manually

```bash
cd "/Users/vibhaassingh/Kerning Ai"
vercel deploy --prod --yes
```

### Push a new SQL migration to remote

```bash
# Generate a new migration file in supabase/migrations/, then:
export SUPABASE_ACCESS_TOKEN=<your PAT from supabase.com/dashboard/account/tokens>

./node_modules/.bin/supabase link --project-ref jofqeeecusayiuzlvnvf
./node_modules/.bin/supabase db push --linked

./node_modules/.bin/supabase link --project-ref memmprzccuruxkrnjnwb
./node_modules/.bin/supabase db push --linked
```

### Reset a user's password (no email flow)

```bash
PROD_SERVICE=$(vercel env pull /tmp/.env --environment=production --yes >/dev/null && grep SUPABASE_SERVICE_ROLE_KEY /tmp/.env | cut -d= -f2- | tr -d '"')
USER_ID="79f26bbe-3afa-4f8c-b4b8-2daad05e6cba"   # vibhaas.singh@kerning.ooo

curl -X PUT "https://memmprzccuruxkrnjnwb.supabase.co/auth/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $PROD_SERVICE" \
  -H "apikey: $PROD_SERVICE" \
  -H "Content-Type: application/json" \
  -d '{"password":"NewPasswordHere"}'

rm -f /tmp/.env
```

### Add a new internal staff member

1. From Supabase Studio (production) → Authentication → Users → Invite user
2. After they accept, run via `https://api.supabase.com/v1/projects/memmprzccuruxkrnjnwb/database/query`:

```sql
INSERT INTO public.organization_memberships
  (user_id, organization_id, role_slug, status, accepted_at)
SELECT u.id, '00000000-0000-0000-0000-000000000001', 'super_admin', 'active', now()
FROM auth.users u WHERE u.email = 'newadmin@kerning.ooo';
```

### Rotate the Supabase access token

The bootstrap CLI work used a PAT named `kerning-ai-cli-2026-05-15`
(30-day expiry). To rotate:

1. Visit https://supabase.com/dashboard/account/tokens
2. Click `…` next to `kerning-ai-cli-2026-05-15` → Revoke
3. Generate a new token if you'll keep doing CLI work
4. The deployed app does NOT use this token — it's only for CLI

### Trigger a cron handler manually (smoke test)

```bash
CRON=$(vercel env pull /tmp/.env --environment=production --yes >/dev/null && grep CRON_SECRET /tmp/.env | cut -d= -f2- | tr -d '"')
curl -i -H "Authorization: Bearer $CRON" https://ai.kerning.ooo/api/cron/stale-invites
rm -f /tmp/.env
```

### Add Sentry (when ready to actually use it)

The SDK + `instrumentation.ts` + `sentry.{server,edge}.config.ts` are
already in place. To turn it on:

1. Sign up at https://sentry.io and create a Next.js project
2. Set Vercel envs:
   - `SENTRY_DSN` (production + preview)
   - `NEXT_PUBLIC_SENTRY_DSN` (same value)
   - `SENTRY_ORG` + `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` (build-time, for source-map upload)
3. Redeploy. `lib/observability/sentry.ts` will start forwarding to Sentry alongside the structured-console fallback.

### Add Upstash rate-limiting (when ready)

The wrapper at `lib/auth/rate-limit.ts` is real. To turn it on:

1. Sign up at https://upstash.com/ → create a Redis database (region near Mumbai for low latency)
2. Set Vercel envs:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN` (sensitive)
3. Redeploy. Login + invite endpoints will start rate-limiting per-IP automatically.

### Verify a Resend email send

```bash
RESEND=$(vercel env pull /tmp/.env --environment=production --yes >/dev/null && grep RESEND_API_KEY /tmp/.env | cut -d= -f2- | tr -d '"')
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND" \
  -H "Content-Type: application/json" \
  -d '{"from":"Kerning AI <hello@noreply.kerningai.eu>","to":"vibhaas.singh@kerning.ooo","subject":"Bootstrap test","text":"This is the verified noreply.kerningai.eu sender working."}'
rm -f /tmp/.env
```

---

## Known gaps (intentional)

These are documented but not yet shipped:

- **Sentry DSN** not provisioned — wrapper falls back to console.error
- **Upstash Redis** not provisioned — rate-limit always allows
- **OAuth consent verification** — Google client is in "Testing" mode; external Gmail users (non-`*@kerning.ooo`) will hit a Google verification warning. Publish + verify the consent screen for public sign-up
- **MFA** — not built; `security_events.kind` enum reserves the slots
- **Vercel cron jobs** — scheduled in `vercel.json`, will auto-fire; the `/api/cron/*` handlers are real but the agent inference pipeline isn't (Phase 4d-late)
- **CMS surface** — `/admin/cms` is `disabled: true`; dual-mode CMS is Phase 2

See `docs/deployment.md` for the generic flow and the implementation plans in `/Users/vibhaassingh/.claude/plans/` for the full roadmap.
