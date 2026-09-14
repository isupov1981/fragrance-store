import { afterEach, describe, expect, it } from "vitest";
import { agentTokenConfigured, requireAgentToken } from "@/lib/agent/auth";

const original = process.env.HERMES_AGENT_TOKEN;

afterEach(() => {
  process.env.HERMES_AGENT_TOKEN = original;
});

function request(authorization?: string) {
  return new Request("http://localhost/api/agent", {
    headers: authorization ? { authorization } : undefined,
  });
}

describe("requireAgentToken", () => {
  it("rejects missing or short tokens", () => {
    process.env.HERMES_AGENT_TOKEN = "short";
    expect(agentTokenConfigured()).toBe(false);
    process.env.HERMES_AGENT_TOKEN = "a-sufficiently-long-agent-token";
    expect(agentTokenConfigured()).toBe(true);
    expect(requireAgentToken(request())).toBe(false);
    expect(requireAgentToken(request("Bearer wrong-token-value-here"))).toBe(false);
    expect(requireAgentToken(request("Bearer a-sufficiently-long-agent-token"))).toBe(true);
  });
});
