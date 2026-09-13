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
- Vitest, Playwright, ESLint and GitHub Actions

## Local setup

1. Copy `.env.example` to `.env` and replace the development secrets.
2. Start PostgreSQL with `docker compose up -d`.
3. Install and prepare the project:

   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

The storefront is available at `http://localhost:3000` and the administration
area at `/admin`. If payment credentials are omitted, checkout runs in a clearly
labelled demonstration mode and does not charge a card.

## Product import

CSV accepts these columns:

```text
sku,name,slug,brand,category,description,variantName,price,stock,imageUrl,status,featured
```

CSV prices are decimal major units (for example `168.00`); the importer converts
them to integer minor units for storage. Always use
the admin preview before applying an import. SKU and slug are stable upsert keys.

## Production checklist

- Use managed PostgreSQL with backups and run `prisma migrate deploy`.
- Set a random `AUTH_SECRET`, rotate the bootstrap admin password and configure
  object storage for uploads.
- Configure Stripe production keys and register `/api/webhooks/stripe`.
- Set SMTP, sender/domain authentication, GA4 and Meta Pixel IDs.
- Set `NEXT_PUBLIC_SITE_URL`, domain and SSL, then run the Playwright smoke suite.
- Keep checkout totals and stock authoritative on the server; never trust prices
  submitted by a browser.

## Commands

- `npm run lint` — lint source and tests
- `npm run typecheck` — TypeScript validation
- `npm test` — unit tests
- `npm run test:e2e` — browser tests
- `npm run build` — production build
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
