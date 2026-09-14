import { NextResponse } from "next/server";
import { z } from "zod";

import { agentTokenConfigured } from "@/lib/agent/auth";
import { assertAgentRequest, agentTools, dispatchAgentTool, jsonAgentError } from "@/lib/agent/tools";

export const runtime = "nodejs";

const bodySchema = z.object({
  tool: z.string().min(1),
  arguments: z.unknown().optional(),
});

export async function GET() {
  return NextResponse.json({
    tools: agentTools,
    auth: agentTokenConfigured() ? "configured" : "missing",
  });
}

export async function POST(request: Request) {
  try {
    assertAgentRequest(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Expected { tool, arguments }" }, { status: 400 });
    }
    const result = await dispatchAgentTool(parsed.data.tool, parsed.data.arguments ?? {});
    return NextResponse.json({ tool: parsed.data.tool, result });
  } catch (error) {
    const body = jsonAgentError(error);
    return NextResponse.json(
      { error: body.error, ...(body.issues ? { issues: body.issues } : {}) },
      { status: body.status },
    );
  }
}
