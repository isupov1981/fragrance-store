import { describe, expect, it } from "vitest";
import {
  canMutateResource,
  requireAdminRole,
  requireResourceMutation,
} from "@/lib/auth/rbac";
import type { AdminSession } from "@/lib/auth/session";

function session(role: "ADMIN" | "EDITOR"): AdminSession {
  return { sub: "a@b.c", role, name: "Tester" };
}

describe("admin RBAC", () => {
  it("lets editors mutate catalogue resources only", () => {
    expect(canMutateResource("EDITOR", "products")).toBe(true);
    expect(canMutateResource("EDITOR", "content")).toBe(true);
    expect(canMutateResource("EDITOR", "orders")).toBe(false);
    expect(canMutateResource("EDITOR", "customers")).toBe(false);
    expect(canMutateResource("EDITOR", "shipping")).toBe(false);
    expect(canMutateResource("ADMIN", "orders")).toBe(true);
  });

  it("requires ADMIN for settings-style operations", () => {
    expect(requireAdminRole(null).ok).toBe(false);
    expect(requireAdminRole(session("EDITOR")).ok).toBe(false);
    expect(requireAdminRole(session("ADMIN")).ok).toBe(true);
  });

  it("blocks editor order mutations", () => {
    const denied = requireResourceMutation(session("EDITOR"), "orders");
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.status).toBe(403);
    expect(requireResourceMutation(session("EDITOR"), "products").ok).toBe(true);
  });
});
