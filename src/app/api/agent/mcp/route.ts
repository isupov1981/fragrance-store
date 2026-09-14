import { NextResponse } from "next/server";

import { agentTokenConfigured } from "@/lib/agent/auth";
import { assertAgentRequest, agentTools, dispatchAgentTool, jsonAgentError } from "@/lib/agent/tools";

export const runtime = "nodejs";

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: { name?: string; arguments?: unknown };
};

function rpcResult(id: JsonRpc["id"], result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(id: JsonRpc["id"], code: number, message: string, status = 200) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let id: JsonRpc["id"] = null;
  try {
    assertAgentRequest(request);
    const message = (await request.json()) as JsonRpc;
    id = message.id ?? null;

    if (message.method === "initialize") {
      return rpcResult(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "prive-atelier", version: "0.1.0" },
      });
    }

    if (message.method === "notifications/initialized" || message.method === "initialized") {
      return new NextResponse(null, { status: 204 });
    }

    if (message.method === "tools/list" || message.method === "list_tools") {
      return rpcResult(id, {
        tools: agentTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      });
    }

    if (message.method === "tools/call" || message.method === "call_tool") {
      const name = message.params?.name;
      if (!name) return rpcError(id, -32602, "Missing tool name");
      const result = await dispatchAgentTool(name, message.params?.arguments ?? {});
      return rpcResult(id, {
        content: [{ type: "text", text: JSON.stringify(result) }],
      });
    }

    if (message.method === "ping") {
      return rpcResult(id, {});
    }

    return rpcError(id, -32601, `Unknown method: ${message.method ?? "none"}`);
  } catch (error) {
    const body = jsonAgentError(error);
    if (body.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return rpcError(id, -32000, body.error ?? "Agent request failed");
  }
}

export async function GET() {
  return NextResponse.json({
    transport: "json-rpc",
    auth: agentTokenConfigured() ? "configured" : "missing",
    hint: "POST JSON-RPC initialize / tools/list / tools/call, or use hermes/mcp-stdio.mjs",
  });
}
