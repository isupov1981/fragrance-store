# Архитектура — The Perfume Room

Документ описывает текущую архитектуру интернет-магазина ароматов **The Perfume Room** (`the-perfume-room-store`): слои приложения, потоки данных, интеграции и границы ответственности.

## 1. Обзор

| Слой | Технологии |
|------|------------|
| UI / SSR | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 |
| Состояние клиента | Zustand (корзина → `localStorage`) |
| API | Route Handlers в `src/app/api/**` |
| БД | PostgreSQL + Prisma |
| Платежи | Grow (основной), Stripe (опционально), demo-режим |
| Файлы | S3-совместимое хранилище (MinIO / R2 / AWS) или локальный диск |
| Почта | Nodemailer (SMTP) или noop |
| Авторизация админки | JWT в httpOnly cookie (`jose`) |
| Агент | Hermes (Telegram) → Bearer API / MCP |

Витрина трёхъязычная: **en** / **ru** (LTR) и **he** (RTL). Покупка включается флагом `NEXT_PUBLIC_ORDERS_ENABLED=true`; иначе каталог доступен, а checkout отключён.

Бесплатная доставка от **₪499** (`FREE_SHIPPING_ILS_CENTS` в `src/lib/currency.ts`), при условии невскрытой фирменной упаковки.

## 2. Высокоуровневая схема

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Клиенты                                 │
│  Браузер (витрина /admin)     Telegram (Hermes Agent)           │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────┐   ┌─────────────────────────────┐
│  Next.js (proxy + App Router) │   │  /api/agent (+ /mcp,/upload)│
│  /[lang]/*  /admin/*          │   │  Bearer HERMES_AGENT_TOKEN  │
└───────────────┬───────────────┘   └──────────────┬──────────────┘
                │                                  │
                ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/lib/*  — доменная логика (catalog, checkout, payments…)    │
└───────────────┬─────────────────────────────────────────────────┘
                │
        ┌───────┼───────────┬──────────────┬──────────────┐
        ▼       ▼           ▼              ▼              ▼
   PostgreSQL  S3/local   Grow/Stripe   SMTP          Webhooks
   (Prisma)    (media)    (checkout)   (orders)    /api/webhooks/*
```

## 3. Структура репозитория

```text
src/
  app/
    [lang]/          # витрина с префиксом локали
    admin/           # JWT-админка (login + protected sections)
    api/             # HTTP API (checkout, webhooks, admin, agent…)
    sitemap.ts, robots.ts
  components/        # UI по доменам (home, product, cart, checkout…)
  lib/               # серверная/общая доменная логика
  proxy.ts           # локаль + защита /admin и /api/admin
prisma/              # schema, migrations, seed
hermes/              # конфиг/скилл внешнего Telegram-агента
docs/                # деплой и архитектура
scripts/             # build, db, import, smoke, lighthouse
tests/               # vitest unit (+ playwright e2e)
```

Правило слоёв:

- **Pages / layouts** — композиция UI и загрузка данных.
- **Route handlers** — HTTP-контракт, валидация входа, статусы ответа.
- **`src/lib/*`** — бизнес-правила, провайдеры, доступ к БД/хранилищу.
- **Components** — представление; клиентский стейт только там, где нужно (корзина, формы).

## 4. Витрина и маршрутизация

### Локализация

- URL: `/{lang}/…` где `lang ∈ {en, he, ru}`.
- `src/proxy.ts` (Next.js proxy):
  - редирект без локали с учётом cookie / `Accept-Language`;
  - выставляет cookie `fragrance_locale` и заголовок `x-locale`;
  - для `/admin` и `/api/admin` проверяет JWT-сессию.

### Основные страницы

| Путь | Назначение |
|------|------------|
| `/[lang]` | Главная |
| `/[lang]/products`, `/products/[slug]` | Каталог и карточка |
| `/[lang]/brands` | Brands A–Z (из БД) |
| `/[lang]/collections`, `/collections/[slug]` | Коллекции / категории / merchandising |
| `/[lang]/cart` | Корзина |
| `/[lang]/checkout` (+ success/cancel) | Оформление |
| `/[lang]/account` | Поиск заказа |
| `/[lang]/(content)/*` | About, FAQ, contact, shipping, refund |

Навигация **Categories** использует merchandising-теги (`back-in-stock`, `testers-refills`, `additional-products`) через `ProductCategory`, отдельно от ольфакторного семейства (`woody` / `floral` / …).

SEO: `sitemap.ts`, `robots.ts`, JSON-LD товаров (`src/lib/seo`).

## 5. Доменные модули (`src/lib`)

| Модуль | Ответственность |
|--------|-----------------|
| `catalog`, `catalog/*`, `db/products` | Чтение ACTIVE-каталога, browse/slug, brands, merchandising |
| `cart/*` | Типы корзины + Zustand store |
| `checkout/*` | Схема, серверный расчёт цен, сохранение заказа |
| `payments/*` | Выбор провайдера (grow → stripe → demo), Grow/Stripe адаптеры |
| `commerce` | Feature-flag заказов |
| `currency` | Конвертация ILS → USD/EUR (цены в БД — агороты) |
| `auth/*` | JWT admin session |
| `admin/*` | Локаль и i18n админки |
| `storage/*` | Upload: S3 или local + `/api/media` |
| `email/*` | Письма о заказах |
| `import/*` | CSV upsert продуктов |
| `agent/*` | Auth, tools, schema, daily reports |
| `validation/*` | Zod-схемы заказов и связанных сущностей |
| `env` | Парсинг ключевых server env через Zod |

## 6. Модель данных (Prisma)

Ключевые сущности:

```text
Brand ──< Product >── ProductVariant
              │
              ├── ProductImage
              └── ProductCategory >── Category (дерево parent/children)

Customer ──< Order >── OrderItem
              │
              └── ShippingMethod

AdminUser, ContentPage, WebhookEvent
```

- **Product.status**: `DRAFT` | `ACTIVE` | `ARCHIVED` — витрина показывает только `ACTIVE`.
- **Цены**: integer minor units (агороты для ILS).
- **Order**: идемпотентность через уникальный `idempotencyKey`; `paymentReference` уникален для провайдера.
- **WebhookEvent**: дедупликация обработанных событий провайдера.

Подключение: `DATABASE_URL` (+ опционально `DATABASE_URL_UNPOOLED` для Neon/direct).

## 7. Потоки

### 7.1 Корзина → checkout

```text
Клиент (Zustand / localStorage)
        │  POST /api/checkout  (items + customer + idempotencyKey)
        ▼
Валидация (Zod) → серверный priceCheckoutItems (цены/сток из БД)
        │
        ▼
saveOrder (PENDING) → getPaymentProvider().createSession()
        │
        ├─ Grow / Stripe → redirectUrl на платёжную страницу
        └─ demo → сразу success URL, paid=true
        │
        ▼
Webhook /api/webhooks/{grow|stripe} → статус PAID (+ почта)
```

Инварианты:

- итоги и остатки **авторитетны на сервере**, не из клиента;
- повтор с тем же `idempotencyKey` возвращает существующий заказ;
- при `ordersEnabled === false` → `503`.

### 7.2 Админка

```text
/admin/login → POST /api/admin/auth/login → JWT cookie
/admin/(protected)/[section] → CRUD через /api/admin/[resource]
CSV: preview / import / export
Uploads: /api/admin/uploads → storeImage (S3 | local)
```

Роли: `ADMIN` | `EDITOR`. Публичные пути: `/admin/login`, `/api/admin/auth/login`.

### 7.3 Медиа

1. Если заданы `S3_*` → объект в bucket, публичный URL.
2. Иначе → `uploads/` и раздача через `/api/media/[...key]`.

### 7.4 Hermes Agent

Внешний процесс Hermes в Telegram (отдельный **профиль** `the-perfume-room`, не default FA) вызывает:

- `POST/GET /api/agent` — операции над черновиками/публикацией;
- `/api/agent/mcp` — MCP-инструменты (serverInfo: `the-perfume-room`);
- `/api/agent/upload` — фото.

Авторизация: `Authorization: Bearer ${HERMES_AGENT_TOKEN}`. Продукты создаются как `DRAFT` до явной публикации. Скилл и gateway: см. [`hermes/README.md`](../hermes/README.md).

## 8. Платежи

| Провайдер | Когда | Webhook |
|-----------|--------|---------|
| **Grow** | `GROW_USER_ID` + `GROW_PAGE_CODE` (+ secret) | `/api/webhooks/grow` |
| **Stripe** | `STRIPE_SECRET_KEY` (+ publishable + webhook secret) | `/api/webhooks/stripe` |
| **demo** | ничего из live не настроено | нет (оплата симулируется) |

Приоритет выбора: Grow → Stripe → demo (`src/lib/payments/provider.ts`).

## 9. Инфраструктура

**Локально** (`docker compose`): PostgreSQL + MinIO (+ init bucket).

**Прод** (типично Hostinger + Neon + S3/R2): см. [hostinger-deploy.md](./hostinger-deploy.md). Самохостинг: `docker-compose.prod.yml`.

Критичные env (неполный список):

- `DATABASE_URL`, `AUTH_SECRET` (≥32)
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ORDERS_ENABLED`
- `S3_*` или локальный fallback
- `GROW_*` / `STRIPE_*`
- `SMTP_*`, `EMAIL_FROM`, `ORDER_ADMIN_EMAIL`
- `HERMES_AGENT_TOKEN`

Проверки: `GET /api/health`, `npm run smoke`, Lighthouse budgets.

## 10. Тестирование и качество

| Команда | Что проверяет |
|---------|----------------|
| `npm test` | Unit (Vitest): webhooks, commerce, i18n, storage, agent… |
| `npm run test:e2e` | Playwright |
| `npm run lint` / `typecheck` | ESLint, `tsc` |
| `npm run test:lighthouse` | Бюджеты производительности |
| `npm run smoke` | HTTP: локали, sitemap, robots, health |

## 11. Границы и расширения

**Уже заложено:** трёхъязычная витрина (en/he/ru), Brands A–Z и Categories merchandising, серверный checkout, два платёжных провайдера, админка, CSV-импорт, object storage, Telegram-оператор через Hermes (`the-perfume-room`).

**Не усложнять без нужды:** клиентская «истина» по ценам/остаткам; прямой доступ к Prisma из компонентов UI; обход JWT для admin API; публикация товаров без явного статуса `ACTIVE`.

При изменении контрактов API или схемы Prisma обновляйте этот файл вместе с миграцией/деплой-докой.
