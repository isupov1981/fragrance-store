# Hermes Agent — Telegram operator for The Perfume Room

Hermes is a **separate process** ([Nous Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)).
The store exposes a Bearer-token Agent API; Hermes talks to it over MCP/HTTP and
chats with you in Telegram.

Use a dedicated Hermes **profile** named **`the-perfume-room`** so this bot does not
share sessions, skills, or Telegram credentials with other Hermes agents on the same host.

Production MCP: `https://parfums.cloud/api/agent/mcp`  
Local MCP: `http://localhost:3000/api/agent/mcp` (or stdio via [mcp-stdio.mjs](mcp-stdio.mjs))

## 1. Store env

Add to `.env` (see `.env.example`):

```bash
HERMES_AGENT_TOKEN="generate-a-long-random-token-24-chars-min"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Confirm `GET /api/health` shows `"hermesAgent":"configured"` and `"service":"the-perfume-room"`.

## 2. Install Hermes and Telegram

Follow the official Hermes install, then create a bot with [@BotFather](https://t.me/BotFather).

Create (or rename to) the store profile:

```bash
hermes profile create the-perfume-room
# or, if renaming an old profile:
# hermes profile rename <old-name> the-perfume-room
```

Set secrets in the **profile** env (`~/.hermes/profiles/the-perfume-room/.env`):

```bash
TELEGRAM_BOT_TOKEN="…"
TELEGRAM_ALLOWED_USERS="your-numeric-telegram-user-id"
TELEGRAM_HOME_CHANNEL="your-numeric-telegram-user-id"
HERMES_AGENT_TOKEN="same-as-store"
FRAGRANCE_API_URL="https://parfums.cloud"
```

Merge [config.example.yaml](config.example.yaml) into the profile `config.yaml`
(HTTP MCP against `/api/agent/mcp` with the same Bearer token is preferred in production).

Copy [SKILL.md](SKILL.md) into the profile skills folder:

```text
~/.hermes/profiles/the-perfume-room/skills/the-perfume-room/SKILL.md
```

(also fine under `~/.hermes/skills/the-perfume-room/SKILL.md` for shared skills).

## 3. Start

```bash
# store (local)
npm run dev

# Hermes gateway for this shop only
hermes -p the-perfume-room gateway
# or: systemctl --user enable --now hermes-gateway-the-perfume-room.service
```

In Telegram, `/sethome` on your DM with the bot.

## 4. Daily report cron

After the gateway is up:

```bash
hermes -p the-perfume-room cron create "0 9 * * *" --name "perfume-room-daily" --deliver telegram --tz Asia/Jerusalem \
  "Call get_daily_report and get_recommendations for The Perfume Room. Write a short Hebrew+English briefing: 24h orders, ₪ revenue, drafts to publish, low stock, one next action."
```

See [cron.example.json](cron.example.json).

## 5. Example messages

- «Добавь Filippo Sorcinelli X, 1/3/5/10 мл, вот фото»
- «Опубликуй X»
- «Повесь в Back In Stock / Testers»
- «Что по заказам за сутки?»
- «Что посоветуешь?»

Products stay **draft** until you explicitly publish. Live pages only show `ACTIVE`
rows from Postgres. Merchandising tags for the Categories menu:
`back-in-stock`, `testers-refills`, `additional-products`.
