import { timingSafeEqual } from "node:crypto";

const MIN_TOKEN_LENGTH = 24;

export function agentTokenConfigured() {
  const token = process.env.HERMES_AGENT_TOKEN?.trim();
  return Boolean(token && token.length >= MIN_TOKEN_LENGTH);
}

export function requireAgentToken(request: Request) {
  const expected = process.env.HERMES_AGENT_TOKEN?.trim();
  if (!expected || expected.length < MIN_TOKEN_LENGTH) return false;
  const header = request.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  return safeEqual(provided, expected);
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(a.length ? a : Buffer.from("x"), a.length ? a : Buffer.from("x"));
    return false;
  }
  return timingSafeEqual(a, b);
}
