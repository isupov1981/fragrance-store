import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrderMailer } from "@/lib/email/mailer";
import { subscribeToNewsletter } from "@/lib/newsletter/subscribers";
import { locales } from "@/lib/i18n/config";
import {
  enforceRateLimit,
  rateLimitPolicies,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.email(),
  locale: z.enum(locales).optional(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, rateLimitPolicies.newsletter);
  if (!limited.ok) return rateLimitResponse(limited.result);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    await subscribeToNewsletter(parsed.data);
  } catch (error) {
    console.error("Newsletter subscribe failed", error);
    return NextResponse.json({ error: "Unable to subscribe" }, { status: 503 });
  }

  await getOrderMailer()
    .sendEnquiry({
      name: "Newsletter",
      email: parsed.data.email,
      subject: "Newsletter",
      message: `${parsed.data.email} subscribed to atelier notes.`,
    })
    .catch(console.error);

  return NextResponse.json({ ok: true }, { status: 201 });
}
