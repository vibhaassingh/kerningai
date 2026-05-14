# Kerning AI

Operational intelligence for industries that build with their hands —
public marketing site + multi-surface portal system.

Live: <https://kerningai.vercel.app>

## What's in here

- **Public marketing site** — Next.js 16 / App Router / Tailwind v4,
  Resend-wired contact form, MDX insights.
- **Discovery engine** — anonymous prospects fill a service-keyed
  questionnaire at `/discovery/[serviceSlug]` → submission lands in
  the admin inbox + auto-creates a sales lead.
- **Solution blueprints** — admin generates a complexity-scored
  blueprint with modules / phases / risks / integrations / checklist
  from a submission. Approval makes it client-visible.
- **Admin Portal** (`/admin/*`) — Command Center, clients,
  sales CRM, discovery submissions, blueprints, security + audit.
- **Client Portal** (`/portal/*`) — role-personalized dashboard,
  live operations ticker, agent inbox + action ledger, predictive
  maintenance, energy, compliance, decision intelligence,
  ontology explorer, onboarding, reports, documents, support,
  team, billing, integrations, security settings.

## Stack

- **Next.js 16** (App Router, RSC, Server Actions)
- **Supabase Pro** — Postgres + Auth + Storage + RLS + Realtime
- **Vercel** — single-project deploy with preview branches + cron
- **Resend** — transactional + product email
- **TypeScript strict**, Tailwind v4, Framer Motion, Vitest

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm db:start             # local Supabase via Docker
pnpm db:reset             # apply migrations + seed
pnpm dev                  # http://localhost:3000
```

Sign in with any seed user (`super.admin@kerning.ooo`,
`owner@meridian.example.com`, etc.) using password `KerningSeed!2026`.

Anonymous discovery: <http://localhost:3000/start>.

## Documentation

- [Deployment guide](docs/deployment.md) — Supabase + Vercel + Google
  OAuth from scratch
- [Auth model](docs/auth.md) — flows, helpers, RLS layers
- [RBAC](docs/rbac.md) — 27 roles, 44 permissions, grant matrix
- [Operations](docs/operations.md) — cron, webhooks, Sentry, incidents
- [Setup quickstart](docs/setup.md) — minimal "get running" path

## Project layout

```
app/
├── (marketing)/            public site
├── (auth)/                 login, forgot, reset, invite, verify
├── (discovery)/            /start, /discovery/[serviceSlug], /discovery/complete
├── admin/                  internal portal
├── portal/                 client portal
├── api/
│   ├── contact/            marketing contact form (also writes leads)
│   ├── auth/callback/      OAuth callback
│   ├── webhooks/[connector]/[clientId]/   HMAC-verified inbound
│   ├── cron/               Vercel-cron-targeted handlers
│   └── agents/run/[templateSlug]/         triggered agent runner
├── setup-pending/          fallback when Supabase env missing
└── layout.tsx              root + Analytics + GA

components/
├── chrome/                 Nav, Footer, PortalBrand, SidebarNav, TopBar
├── primitives/             LiquidPill, LiquidGlassTile, Eyebrow, …
├── auth/                   LoginForm, ConnectedAccountsCard, …
├── admin/                  AdminShell, ClientTabs, DataTable, …
├── portal/                 ClientShell, RecommendationCard,
│                           HealthBandBadge, AgentDecisionForm, ModuleStub, SignalRow
├── discovery/              QuestionnaireStepper, QuestionRenderer
└── …

lib/
├── supabase/{client,server,service,middleware}.ts
├── auth/{actions,require,redirects,rate-limit}.ts
├── audit/with-audit.ts
├── rbac/{permissions,roles,labels}.ts
├── tenancy/current-org.ts
├── admin/{clients,leads,blueprints,…}.ts
├── portal/{maintenance,agents,energy,compliance,
│           decision-intelligence,live-ops,team}.ts
├── blueprint/{generate,scoring}.ts
├── discovery/{templates,actions}.ts
├── integrations/hmac.ts
├── cron/auth.ts
├── observability/sentry.ts
└── env.ts                  Zod-validated, lazy Supabase resolution

supabase/
├── config.toml
├── migrations/0001…0017_*.sql
└── seed.sql                local dev seed (3 clients, 9 sites, 10+ users,
                            assets, agent recommendations, audits, metrics)

docs/                       deployment, auth, rbac, operations, setup
tests/unit/                 Vitest unit tests (auth redirects, rbac, roles)
vercel.json                 cron schedule
```

## Migrations

```
0001_init                        identity, tenancy, audit, security
0002_rbac                        roles + permissions tables
0003_seed_rbac                   the canonical 27-role / 44-perm matrix
0004_storage                     7 buckets + per-org RLS
0005_fix_current_user_id         auth.uid() wrapper for asymmetric JWTs
0006_invite_helpers              invite acceptance helpers
0007_public_permission_wrappers  PostgREST-callable permission RPCs
0008_crm                         leads, deals, pipeline, contact submissions
0009_seed_core                   internal Kerning org (production-safe)
0010_questionnaires              discovery engine schema
0011_seed_questionnaire_templates  2 published templates seeded
0012_blueprints                  blueprints + modules/phases/risks/integrations/checklist
0013_assets                      assets + equipment_health_scores
0014_agents                      agent_templates / runs / recommendations / actions
0015_energy                      utility meters, readings, tariff windows, anomalies
0016_compliance                  audits, findings, corrective actions, temp logs, incidents
0017_decision_intelligence       business_metrics + metric_snapshots
```

## Scripts

```bash
pnpm dev                  # next dev
pnpm build                # production build
pnpm typecheck            # tsc --noEmit
pnpm lint                 # eslint
pnpm test                 # Vitest unit tests
pnpm test:watch           # Vitest in watch
pnpm test:coverage        # Vitest with coverage
pnpm db:start / db:stop   # local Supabase
pnpm db:reset             # re-apply migrations + seed
pnpm db:migrate <name>    # generate a new migration
pnpm db:push              # push migrations to linked remote
pnpm db:diff              # diff vs current schema
pnpm db:types             # regenerate TypeScript DB types
```

## Branches

- `main` — production
- `phase-1/foundation` — current development branch (everything past
  the marketing site)

## Contributing

Open a PR from a feature branch into `phase-1/foundation`. CI runs
typecheck + tests. After phase ships, `phase-1/foundation` merges to
`main`.

## Authors

Built by Vibhaas Singh and team at Kerning AI.
