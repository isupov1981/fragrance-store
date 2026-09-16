#!/usr/bin/env node
/**
 * Stdio MCP adapter for Nous Hermes Agent.
 * Forwards tools/list and tools/call to the store Agent API.
 *
 * Env:
 *   FRAGRANCE_API_URL   default http://localhost:3000
 *   HERMES_AGENT_TOKEN  Bearer token (min 24 chars)
 */
import { stdin, stdout } from "node:process";

const API = (process.env.FRAGRANCE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const TOKEN = process.env.HERMES_AGENT_TOKEN || "";

function writeMessage(message) {
  const json = JSON.stringify(message);
  const payload = Buffer.from(json, "utf8");
  stdout.write(`Content-Length: ${payload.length}\r\n\r\n`);
  stdout.write(payload);
}

async function api(path, body) {
  const response = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text || response.statusText };
  }
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

async function handle(message) {
  const id = message.id ?? null;
  if (message.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "the-perfume-room", version: "0.1.0" },
      },
    };
  }
  if (message.method === "notifications/initialized") {
    return null;
  }
  if (message.method === "tools/list") {
    const data = await api("/api/agent");
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: (data.tools ?? []).map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      },
    };
  }
  if (message.method === "tools/call") {
    const name = message.params?.name;
    const result = await api("/api/agent", {
      tool: name,
      arguments: message.params?.arguments ?? {},
    });
    return {
      jsonrpc: "2.0",
      id,
      result: { content: [{ type: "text", text: JSON.stringify(result.result ?? result) }] },
    };
  }
  if (message.method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }
  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Unknown method: ${message.method}` },
  };
}

let buffer = Buffer.alloc(0);

stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  void drain();
});

async function drain() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;
    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const match = /Content-Length:\s*(\d+)/i.exec(header);
    if (!match) {
      buffer = buffer.subarray(headerEnd + 4);
      continue;
    }
    const length = Number(match[1]);
    const start = headerEnd + 4;
    if (buffer.length < start + length) return;
    const body = buffer.subarray(start, start + length).toString("utf8");
    buffer = buffer.subarray(start + length);
    let message;
    try {
      message = JSON.parse(body);
    } catch {
      continue;
    }
    try {
      const reply = await handle(message);
      if (reply) writeMessage(reply);
    } catch (error) {
      writeMessage({
        jsonrpc: "2.0",
        id: message.id ?? null,
        error: { code: -32000, message: error instanceof Error ? error.message : "Agent error" },
      });
    }
  }
}

stdin.resume();
