import { expireStaleReservations } from "@/lib/inventory/service";
import { safeEqualString } from "@/lib/security/timing-safe";

export const runtime = "nodejs";

/**
 * Checkout releases expired holds itself; this job only sweeps abandoned ones.
 * Every real run wakes Neon, so sweeps are spaced hours apart — a hold left by
 * an abandoned checkout is freed by the next checkout or the next sweep.
 */
const MIN_INTERVAL_MS = 6 * 60 * 60_000;

let lastRunAt = 0;

function authorized(request: Request) {
  const expected =
    process.env.CRON_SECRET?.trim() ||
    process.env.HERMES_AGENT_TOKEN?.trim() ||
    "";
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return Boolean(expected && provided && safeEqualString(expected, provided));
}

/**
 * Calls closer than MIN_INTERVAL_MS are skipped without a query, because
 * a 5-minute cron never lets Neon scale to zero.
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = Date.now();
  if (now - lastRunAt < MIN_INTERVAL_MS) {
    return Response.json({ released: 0, skipped: true });
  }
  lastRunAt = now;
  const released = await expireStaleReservations();
  return Response.json({ released });
}
