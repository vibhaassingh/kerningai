# Deployment guide

End-to-end checklist for taking the codebase from a fresh clone to a
running production environment on Vercel + Supabase Pro.

## Pre-flight

- macOS, Linux, or WSL2
- Node 20.x (`node -v` shows 20.x)
- pnpm 10.x (`corepack enable pnpm` if needed)
- Docker (for local Supabase via the Supabase CLI)
- A GitHub account with push access to this repo
- A Vercel account with ownership of the `kerning-ooo` team
- A Supabase Pro account (one organisation; two projects: staging + prod)
- A Google Cloud account for the OAuth client
- A Resend account (already provisioned for the marketing site)

## 1. Local

```bash
git clone <repo>
cd "Kerning Ai"
pnpm install
cp .env.example .env.local
```

Boot local Supabase + apply all migrations + seed:

```bash
pnpm db:start          # boots Postgres / Auth / Storage in Docker
pnpm db:reset          # applies migrations + seed.sql
```

`pnpm db:start` prints local credentials. Paste into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
```

Then:

```bash
pnpm dev               # http://localhost:3000
```

Sign in with any seed user (`super.admin@kerning.ooo`,
`owner@meridian.example.com`, etc.) using password `KerningSeed!2026`.

## 2. Supabase staging + production

In the Supabase dashboard, create two projects:

- **kerning-ai-staging** in EU (Frankfurt)
- **kerning-ai-production** in EU (Frankfurt)

Link this repo to each, push migrations:

```bash
pnpm dlx supabase link --project-ref <staging-ref>
pnpm dlx supabase db push

pnpm dlx supabase link --project-ref <prod-ref>
pnpm dlx supabase db push
```

For production, do **not** run `supabase db reset` — it would wipe data.
`db push` only applies new migrations.

Enable the Google OAuth provider on each Supabase project under
**Authentication → Providers → Google**. Use the credentials from step 4.

## 3. Storage buckets

Already created by migration `0004_storage.sql`. Verify in the Supabase
dashboard under **Storage**:

- `cms-media` (public read)
- `questionnaire-uploads`, `client-documents`, `compliance-evidence`,
  `reports`, `contracts`, `support-attachments` (private)

## 4. Google OAuth

In Google Cloud Console:

1. Create project **kerning-ai-oauth**.
2. Configure OAuth consent screen → External, app name **Kerning AI**.
3. Create credentials → OAuth 2.0 Client ID, type **Web application**.
4. Add authorized redirect URIs:
   - `http://127.0.0.1:54321/auth/v1/callback`
   - `https://<staging-ref>.supabase.co/auth/v1/callback`
   - `https://<prod-ref>.supabase.co/auth/v1/callback`
5. Copy client ID + secret into Vercel env (next step).

## 5. Vercel env

```bash
# Preview env (branches + PRs)
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add GOOGLE_CLIENT_ID preview
vercel env add GOOGLE_CLIENT_SECRET preview
vercel env add APP_ENV preview      # value: staging
vercel env add ALLOWED_REDIRECT_HOSTS preview
vercel env add CRON_SECRET preview  # any 32+ char random string

# Production env (main only)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add APP_ENV production
vercel env add ALLOWED_REDIRECT_HOSTS production
vercel env add CRON_SECRET production
```

Verify:

```bash
vercel env ls
```

## 6. First super-admin in production

After production migration, in the Supabase dashboard SQL editor:

```sql
-- 1. Invite yourself via Authentication → Users → invite by email.
-- 2. Then attach a super_admin membership:
INSERT INTO public.organization_memberships
  (user_id, organization_id, role_slug, status, accepted_at)
SELECT u.id,
       '00000000-0000-0000-0000-000000000001',
       'super_admin',
       'active',
       now()
FROM auth.users u
WHERE u.email = 'super.admin@kerning.ooo';
```

## 7. Deploy

```bash
git push origin main          # triggers Vercel production build
```

Vercel runs:

```
pnpm install --frozen-lockfile
pnpm build
```

Cron jobs declared in `vercel.json` are armed automatically once the
deploy lands.

## 8. Verify production

- Sign in at `https://<your-domain>/login`
- Visit `/admin/command-center` — metrics should populate
- Visit `/admin/system-health` once Phase 5b ships for live checks
- `vercel logs --prod` to tail server logs

## Rollback

```bash
vercel rollback
```

For database rollbacks:

```bash
pnpm dlx supabase db rollback   # applies down migrations
```

> Use rollback sparingly in production — Supabase migrations don't
> have automatic down scripts. Prefer forward-fix migrations.
