import { expireStaleReservations } from "@/lib/inventory/service";
import { safeEqualString } from "@/lib/security/timing-safe";

export const runtime = "nodejs";

function authorized(request: Request) {
  const expected =
    process.env.CRON_SECRET?.trim() ||
    process.env.HERMES_AGENT_TOKEN?.trim() ||
    "";
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return Boolean(expected && provided && safeEqualString(expected, provided));
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const released = await expireStaleReservations();
  return Response.json({ released });
}
