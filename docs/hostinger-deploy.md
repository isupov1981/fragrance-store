# Deploy to Hostinger Business (`parfums.cloud`)

You chose **Business Web Hosting** with **Node.js Web Apps** and **Neon Postgres**.  
Single shared hosting (FTP + PHP + MySQL only) cannot run this stack.

Hostinger runs Next.js in **standalone server mode**: it wraps `next.config` with `output: "standalone"` and starts `.next/standalone` (not a full `node_modules` tree). This repo already exports a config **object** (required) and copies the Prisma query engine into that standalone output during `npm run build`.

| Item | Value |
|------|--------|
| Domain | **https://parfums.cloud** |
| GitHub | `https://github.com/isupov1981/fragrance-store` (branch `main`) |
| Env template | [`.env.hostinger.example`](../.env.hostinger.example) |
| Node | **20** or **22** (see `.node-version`) |

---

## Phase 1 — Neon (do this before or right after the Business upgrade)

### 1. Create PostgreSQL on Neon

1. [neon.tech](https://neon.tech) → new project (region close to the UK if possible).
2. Copy **two** connection strings (`sslmode=require` on both):

   | Variable | Which Neon string |
   |----------|-------------------|
   | `DATABASE_URL` | **Pooled** (hostname contains `-pooler`) |
   | `DATABASE_URL_UNPOOLED` | **Direct** (no `-pooler`) — Prisma migrations need this |

3. Never commit these URLs.

### 2. Bootstrap the database from your PC

Create `.env.production` (gitignored):

```env
DATABASE_URL="postgresql://…-pooler…/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://…/neondb?sslmode=require"
ADMIN_EMAIL="admin@parfums.cloud"
ADMIN_PASSWORD="your-strong-admin-password"
```

Then:

```bash
npm ci
npm run db:bootstrap:prod
```

This runs `prisma migrate deploy` and seeds the admin + catalogue.  
Re-run when migrations change. Skip seed on repeat if data already exists (omit `ADMIN_PASSWORD`).

---

## Phase 2 — Node.js Web App in hPanel (after Business upgrade)

### 3. Create the app

1. hPanel → **Websites** → **Add Website** → **Node.js Apps** → **Import Git Repository**.
2. Connect GitHub → repo **`isupov1981/fragrance-store`**, branch **`main`**.
3. Framework / application type: **Next.js** (`next`).

   | Field | Value |
   |-------|--------|
   | Install | `npm ci` |
   | Build | `npm run build` |
   | Start | leave blank, or `npm run start -- -p $PORT` |
   | Output directory | `.next` |
   | Entry file | leave blank (Hostinger starts the standalone server) |
   | Node version | **20** or **22** |

   `npm run build` already runs `prisma generate`, `next build --webpack`, and copies Prisma into `.next/standalone`.  
   Webpack is required: Hostinger’s shared glibc is older than Next 16’s native SWC (`GLIBC_2.29`), and Turbopack cannot fall back to WASM.  
   To also migrate on every deploy, set `HOSTINGER_MIGRATE_ON_BUILD=true` in env (still keep `DATABASE_URL_UNPOOLED`).

4. **Environment variables** — paste from [`.env.hostinger.example`](../.env.hostinger.example). Minimum:

   - `DATABASE_URL` (pooled)
   - `DATABASE_URL_UNPOOLED` (direct)
   - `AUTH_SECRET` (32+ random characters)
   - `NEXT_PUBLIC_SITE_URL=https://parfums.cloud` (or the `*.hostingersite.com` preview until DNS is attached)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_STORE_CURRENCY=ILS`

5. Deploy / rebuild. Open the preview URL → `/en` and `/api/health`.  
   Expect `database: "configured"` and `databaseReachable: true`. `storage` will be `"local"` until R2/S3 is set.

   **Browse-only:** leave `NEXT_PUBLIC_ORDERS_ENABLED` unset or `false` so cart/checkout stay hidden. Set `true` and rebuild when purchasing should reopen. After each `git push` to `main`, confirm hPanel shows a fresh deploy (Redeploy if the site still serves the previous build).

### 4. Object storage (recommended)

On Business Node hosting, **local `uploads/` is wiped on redeploy**. Configure **Cloudflare R2** (or another S3 API) and all `S3_*` vars. After deploy, `/api/health` should show `"storage":"s3"`.

---

## Phase 3 — Domain and SSL

### 5. Attach `parfums.cloud`

1. hPanel → Node app → **Domains** → add **parfums.cloud** and **www.parfums.cloud**.
2. DNS:

   | Type | Name | Target |
   |------|------|--------|
   | A | `@` | IP Hostinger shows for this Node app |
   | A | `www` | same |

3. Enable **SSL**. If you first deployed with a preview URL, set `NEXT_PUBLIC_SITE_URL=https://parfums.cloud` and rebuild.

### 6. Payments (when going live)

Preferred: **Grow Light API** after an Israeli business (osek) is registered.

- Webhook: `https://parfums.cloud/api/webhooks/grow`
- Set `GROW_USER_ID`, `GROW_PAGE_CODE`, `GROW_WEBHOOK_SECRET` in hPanel and rebuild.
- Checkout stays in **demo** until those variables are set.
- Stripe remains an optional fallback (`/api/webhooks/stripe`) if a non-IL Stripe entity exists.

Without a payment provider, `/api/health` shows `"payments":"demo"`.

### 7. Hermes agent (optional)

- Set `HERMES_AGENT_TOKEN` (24+ chars).
- Point Hermes at `https://parfums.cloud/api/agent`.
- `/api/health` → `hermesAgent: "configured"`.

---

## Verify production

```bash
NEXT_PUBLIC_SITE_URL=https://parfums.cloud npm run smoke
```

Manual: `/en`, `/he`, `/admin`, checkout country default Israel / ILS.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Build: `Environment variable not found: DATABASE_URL` | Unlikely now (`npm run build` uses a placeholder for generate). Still set real URLs for **runtime**. |
| Build: `Environment variable not found: DATABASE_URL_UNPOOLED` | Add the direct Neon URI, or omit it — build falls back to `DATABASE_URL`. |
| `Prisma Client could not locate the Query Engine` | Standalone copy failed; check build logs for `Copied node_modules/.prisma`. |
| Catalogue is the hardcoded demo | Neon unreachable or migrations not applied: `npm run db:bootstrap:prod`. Check `/api/health` `databaseReachable`. |
| Migrate fails through PgBouncer | `DATABASE_URL_UNPOOLED` still has `-pooler`. |
| Uploads disappear after redeploy | No S3/R2. |
| Images broken | `S3_PUBLIC_BASE_URL` wrong (also used for `next/image` remote patterns). |

Do **not** paste production passwords into chat — set them only in hPanel and local `.env.production`.
