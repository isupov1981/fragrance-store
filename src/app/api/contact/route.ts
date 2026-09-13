import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderMailer } from "@/lib/email/mailer";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(4000),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid enquiry" }, { status: 400 });
  }

  await getOrderMailer().sendEnquiry(parsed.data).catch(console.error);
  return NextResponse.json({ ok: true }, { status: 201 });
}
