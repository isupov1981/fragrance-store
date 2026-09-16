type AuditLevel = "info" | "warn" | "error";

type AuditEvent = {
  event: string;
  level?: AuditLevel;
  outcome?: "success" | "failure" | "blocked";
  /** Non-PII context only — never pass emails, tokens, or payment payloads. */
  meta?: Record<string, string | number | boolean | null | undefined>;
};

/**
 * Structured security observability without PII.
 * Uses a single JSON line so Hostinger / container logs stay greppable.
 */
export function auditLog(input: AuditEvent) {
  const payload = {
    type: "security_audit",
    ts: new Date().toISOString(),
    level: input.level ?? "info",
    event: input.event,
    outcome: input.outcome,
    ...(input.meta ? { meta: sanitizeMeta(input.meta) } : {}),
  };
  const line = JSON.stringify(payload);
  if (input.level === "error") console.error(line);
  else if (input.level === "warn") console.warn(line);
  else console.info(line);
}

function sanitizeMeta(meta: NonNullable<AuditEvent["meta"]>) {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue;
    const lowered = key.toLowerCase();
    if (
      lowered.includes("email") ||
      lowered.includes("token") ||
      lowered.includes("secret") ||
      lowered.includes("password") ||
      lowered.includes("authorization")
    ) {
      continue;
    }
    out[key] = value;
  }
  return out;
}
