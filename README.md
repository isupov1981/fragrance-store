# Privé Atelier fragrance store

Independent fragrance commerce application inspired by the information
architecture and premium shopping experience described in the Almaycasa
technical brief. All included branding, copy and demo catalogue data are
original placeholders.

## Stack

- Next.js App Router, React, TypeScript and Tailwind CSS
- PostgreSQL and Prisma
- Zustand cart persisted to `localStorage`
- Stripe provider with signed webhook handling
- JWT-protected custom administration area
- S3-compatible object storage (MinIO, R2, AWS) with a local disk fallback
- Vitest, Playwright, ESLint and Lighthouse budgets

## Local setup (MinIO connected to admin uploads)

1. Copy `.env.example` to `.env` (MinIO `S3_*` values are already filled for local Docker).
2. Start PostgreSQL **and MinIO**:

   ```bash
   docker compose up -d
   ```

   Images come from `quay.io/minio/*` (Docker Hub pulls for `minio/minio` often fail).
   MinIO API: `http://127.0.0.1:9000` · Console: `http://localhost:9001`
   (`fragrance` / `fragrancesecret`). The `minio-init` service creates the
   `fragrance-media` bucket with public read.

3. Install and prepare the project:

   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

4. Open `/admin` → **Товары** → **Загрузка изображений**. Uploads should return a
   URL like `http://127.0.0.1:9000/fragrance-media/products/...`. Confirm storage
   with `GET /api/health` (`"storage":"s3"`).

5. Smoke the running app:

   ```bash
   npm run smoke
   ```

Storefront: `http://localhost:3000` (`/en`, `/he`). Admin: `/admin`
(`admin@example.com` / `AtelierAdmin2026!` from `.env.example` until you rotate it).

Without `S3_BUCKET` + keys, uploads fall back to `uploads/` and `/api/media/...`.

## Product import

CSV accepts these columns:

```text
sku,name,slug,brand,category,description,variantName,price,stock,imageUrl,status,featured
```

CSV prices are decimal ILS major units (for example `32.00` for ₪32); the importer
converts them to integer agorot for storage. USD/EUR at checkout are converted from
ILS and rounded to whole currency units. Always use the admin preview before
applying an import. SKU and slug are stable upsert keys.

## Production deploy (real domain)

**Hostinger Business + Neon:** step-by-step for `parfums.cloud` is in
[`docs/hostinger-deploy.md`](docs/hostinger-deploy.md) (env template:
[`.env.hostinger.example`](.env.hostinger.example)).

Provision first, then point DNS/TLS at the app.

### 1. Managed PostgreSQL

- Create a Postgres instance with automated backups.
- Set `DATABASE_URL` to the provider connection string (SSL as required).

### 2. Object storage (`S3_*`)

Use managed S3, Cloudflare R2, or a hardened MinIO. Example:

```text
S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com
S3_REGION=eu-central-1
S3_BUCKET=your-prod-bucket
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://cdn.your-domain.com
S3_FORCE_PATH_STYLE=false
```

Add the public hostname to `next.config.mjs` image `remotePatterns` via
`S3_PUBLIC_BASE_URL` (already read at build/runtime for patterns).

### 3. Secrets and site URL

```text
AUTH_SECRET=<random ≥32 chars>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ADMIN_EMAIL=...
ADMIN_PASSWORD=<rotated>
```

### 4. Stripe webhook

1. Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
2. In Stripe Dashboard → Webhooks, add endpoint:
   `https://your-domain.com/api/webhooks/stripe`
3. Subscribe at least to `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`.

### 5. SMTP

```text
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=orders@your-domain.com
ORDER_ADMIN_EMAIL=ops@your-domain.com
```

Leave `SMTP_HOST` empty only if you intentionally want the noop mailer.

### 6. Migrate, start, smoke

```bash
npm run db:deploy
npm run build
npm run start
npm run smoke
npm run test:lighthouse
```

Self-host with Docker:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Then run `npx prisma migrate deploy` against production `DATABASE_URL`.

## Hermes Agent (Telegram)

The storefront reads **ACTIVE** products from Postgres. A Bearer-token Agent API lets
[Nous Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
create drafts, upload photos, publish on command, and send a daily briefing.

1. Set `HERMES_AGENT_TOKEN` (24+ random characters).
2. Follow [hermes/README.md](hermes/README.md) to connect Telegram + MCP.
3. Products stay `DRAFT` until you say «опубликуй» in Telegram.

`GET /api/health` reports `"hermesAgent":"configured"` when the token is set.

## Production checklist

- Managed PostgreSQL + backups; `prisma migrate deploy` (`npm run db:deploy`).
- Random `AUTH_SECRET`; rotated admin password; object storage for uploads.
- Stripe live keys + webhook URL `/api/webhooks/stripe`.
- SMTP + domain authentication; optional GA4 / Meta Pixel IDs.
- `NEXT_PUBLIC_SITE_URL`, DNS, SSL; then `npm run smoke`.
- Checkout totals and stock stay server-authoritative.

## Commands

- `npm run lint` — lint source and tests
- `npm run typecheck` — TypeScript validation
- `npm test` — unit tests
- `npm run test:e2e` — browser tests
- `npm run test:lighthouse` — Lighthouse budgets against a running server
- `npm run smoke` — HTTP checks for locale home, sitemap, robots and `/api/health`
- `npm run db:deploy` — apply Prisma migrations (`migrate deploy`)
- `npm run build` — production build
