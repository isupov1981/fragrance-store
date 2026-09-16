/** Public liveness — no configuration fingerprinting. */
export async function GET() {
  return Response.json({ ok: true });
}

export const runtime = "nodejs";
