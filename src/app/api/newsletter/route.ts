import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderMailer } from "@/lib/email/mailer";
import {
  enforceRateLimit,
  rateLimitPolicies,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

const schema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, rateLimitPolicies.newsletter);
  if (!limited.ok) return rateLimitResponse(limited.result);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  await getOrderMailer()
    .sendEnquiry({
      name: "Newsletter",
      email: parsed.data.email,
      subject: "Newsletter",
      message: `${parsed.data.email} asked to receive atelier notes.`,
    })
    .catch(console.error);

  return NextResponse.json({ ok: true }, { status: 201 });
}
