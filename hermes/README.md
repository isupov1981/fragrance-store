# Hermes Agent — Telegram operator

Hermes is a **separate process** ([Nous Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)).
The store exposes a Bearer-token Agent API; Hermes talks to it over MCP/HTTP and
chats with you in Telegram.

## 1. Store env

Add to `.env` (see `.env.example`):

```bash
HERMES_AGENT_TOKEN="generate-a-long-random-token-24-chars-min"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Confirm `GET /api/health` shows `"hermesAgent":"configured"`.

## 2. Install Hermes and Telegram

Follow the official Hermes install, then create a bot with [@BotFather](https://t.me/BotFather).
Set in `~/.hermes/.env`:

```bash
TELEGRAM_BOT_TOKEN="…"
TELEGRAM_ALLOWED_USERS="your-numeric-telegram-user-id"
TELEGRAM_HOME_CHANNEL="your-numeric-telegram-user-id"
HERMES_AGENT_TOKEN="same-as-store"
FRAGRANCE_API_URL="http://localhost:3000"
```

Copy [config.example.yaml](config.example.yaml) into `~/.hermes/config.yaml` (merge with your
existing model/provider block). Copy [SKILL.md](SKILL.md) into a Hermes skills folder
(for example `~/.hermes/skills/prive-atelier/SKILL.md`).

## 3. Start

```bash
# store
npm run dev

# Hermes gateway (Telegram + cron)
hermes gateway
```

In Telegram, `/sethome` on your DM with the bot.

## 4. Daily report cron

After the gateway is up:

```bash
hermes cron create "0 9 * * *" --name "atelier-daily" --deliver telegram --tz Asia/Jerusalem \
  "Call get_daily_report and get_recommendations for PRIVÉ ATELIER. Write a short Hebrew+English briefing: 24h orders, ₪ revenue, drafts to publish, low stock, one next action."
```

See [cron.example.json](cron.example.json).

## 5. Example messages

- «Добавь Filippo Sorcinelli X, 1/3/5/10 мл, вот фото»
- «Опубликуй X»
- «Что по заказам за сутки?»
- «Что посоветуешь?»

Products stay **draft** until you explicitly publish. Live pages only show `ACTIVE`
rows from Postgres.
