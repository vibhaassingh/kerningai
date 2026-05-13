# Phase 1 setup guide

Everything an operator needs to take the Phase 1 scaffolding from clone to
working sign-in. This guide assumes macOS with Node 20.x + pnpm 10.

> Run all commands from the project root. The path has a space, so quote
> it: `cd "/Users/vibhaassingh/Kerning Ai"`.

## Order of operations

1. Install dependencies
2. Create Supabase Pro projects (staging + production)
3. Create a Google Cloud OAuth client
4. Wire env vars (local + Vercel)
5. Run migrations + seed
6. Verify sign-in flows

---

## 1. Install dependencies

```bash
pnpm install
```

Dependencies added by Phase 1: `@supabase/supabase-js`, `@supabase/ssr`,
and `supabase` (CLI, devDep). Verify the CLI:

```bash
./node_modules/.bin/supabase --version    # 2.98.x
```

---

## 2. Supabase projects

### 2a. Local

```bash
./node_modules/.bin/supabase start
```

This boots Postgres + Studio + Inbucket + the GoTrue auth server on
ports 54321–54329. The first run prints local credentials — copy them
into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
```

To apply migrations + seed:

```bash
./node_modules/.bin/supabase db reset
```

Seed sign-in: any of the 10 seeded users with password
`KerningSeed!2026` — e.g. `super.admin@kerning.ooo`,
`owner@meridian.example.com`, `operator@northline.example.com`.

### 2b. Staging + production

In the Supabase dashboard:

1. Create project **kerning-ai-staging** in EU (Frankfurt).
2. Create project **kerning-ai-production** in EU (Frankfurt).

For each, copy the API URL + anon key + service-role key into Vercel
env vars (see step 4).

Link this repo to each remote project (one at a time):

```bash
./node_modules/.bin/supabase link --project-ref <project-ref>
./node_modules/.bin/supabase db push
```

Verify:

```bash
./node_modules/.bin/supabase migration list
```

---

## 3. Google OAuth client

1. In Google Cloud Console, create a project named **kerning-ai-oauth**.
2. Configure the OAuth consent screen as **External**, app name
   **Kerning AI**. Add `kerningai.eu` as an authorized domain.
3. Create credentials → OAuth 2.0 Client ID, type **Web application**.
4. Authorized redirect URIs — add **all three**, one per env:
   - `http://127.0.0.1:54321/auth/v1/callback`
     (local Supabase)
   - `https://<staging-project-ref>.supabase.co/auth/v1/callback`
   - `https://<production-project-ref>.supabase.co/auth/v1/callback`
5. In each Supabase project's dashboard:
   **Authentication → Providers → Google** → paste client ID + secret →
   set redirect URL to `https://<project-ref>.supabase.co/auth/v1/callback`.

Also set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in Vercel env so the
server actions know Google is enabled.

---

## 4. Wire env vars

### 4a. Locally

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY from `supabase start` output.
# Fill in GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET from Google Cloud.
```

### 4b. Vercel

```bash
# Preview env
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add GOOGLE_CLIENT_ID preview
vercel env add GOOGLE_CLIENT_SECRET preview
vercel env add APP_ENV preview          # value: staging
vercel env add ALLOWED_REDIRECT_HOSTS preview

# Production env — same keys with production values
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add APP_ENV production       # value: production
vercel env add ALLOWED_REDIRECT_HOSTS production
```

Verify:

```bash
vercel env ls
```

`SUPABASE_SERVICE_ROLE_KEY` is encrypted; never commit it. It must not
appear in any `NEXT_PUBLIC_*` variable.

---

## 5. Run migrations

The four migrations + the core seed (production-safe):

```
0001_init.sql            core identity, tenancy, audit, security tables
0002_rbac.sql            roles + permissions + role_permissions
0003_seed_rbac.sql       seed the role catalogue + grant matrix
0004_storage.sql         storage buckets + RLS policies
0009_seed_core.sql       internal Kerning org (production-safe)
```

Dev-only seed (10 users + 3 clients) lives in `supabase/seed.sql` and
runs **only** on `supabase db reset` locally.

To deploy:

```bash
./node_modules/.bin/supabase link --project-ref <staging-ref>
./node_modules/.bin/supabase db push

./node_modules/.bin/supabase link --project-ref <production-ref>
./node_modules/.bin/supabase db push
```

After production migration, create the first super-admin by:

1. In Supabase dashboard → Authentication → Users → invite
   `super.admin@kerning.ooo` (or whichever email you use).
2. Run this in the SQL Editor:

   ```sql
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

---

## 6. Verify

```bash
pnpm dev
```

Open <http://localhost:3000/login> and try:

- [ ] Sign in with `owner@meridian.example.com` / `KerningSeed!2026`.
- [ ] You land on `/portal/dashboard`.
- [ ] Visit `/portal/settings/security` — change password, link Google.
- [ ] Sign out via the account menu.
- [ ] Sign in as `super.admin@kerning.ooo` — you land on
      `/admin/command-center`.
- [ ] Visit `/admin/settings/security` — same surface.
- [ ] Try `/forgot-password` — submits without error (check Inbucket
      at <http://127.0.0.1:54324> for the local email).

Type-check + build before deploy:

```bash
pnpm typecheck
pnpm build
```

---

## Branch protection (recommended before Phase 2)

```bash
brew install gh           # if not installed
gh auth login
gh repo edit --enable-merge-commit=false --enable-squash-merge=true \
  --enable-auto-merge=true
# Configure branch protection in the GitHub UI for `main`:
#   - require pull request review
#   - require status checks to pass
#   - disallow force pushes
```

---

## What Phase 1 leaves for Phase 2

- Real Command Center metrics
- Client management UI
- Sales CRM + lead inbox
- CMS for new website content
- Storage upload UI for documents/contracts
- Audit-log explorer page
- Rate limiting via Upstash
- Sentry / error tracking
- Custom email domain switch (`hello@kerningai.eu`)
