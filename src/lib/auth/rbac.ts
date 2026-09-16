import type { AdminRole, AdminSession } from "./session";

/** Catalogue + CMS — EDITOR may create/update these. */
export const EDITOR_MUTABLE_RESOURCES = new Set([
  "products",
  "categories",
  "brands",
  "content",
] as const);

/** Financial / customer / shipping mutations require ADMIN. */
export const ADMIN_ONLY_MUTABLE_RESOURCES = new Set([
  "orders",
  "customers",
  "shipping",
] as const);

export type AdminResource =
  | "products"
  | "categories"
  | "brands"
  | "orders"
  | "customers"
  | "content"
  | "shipping";

export function canMutateResource(role: AdminRole, resource: AdminResource) {
  if (role === "ADMIN") return true;
  return EDITOR_MUTABLE_RESOURCES.has(resource as never);
}

export function requireAdminRole(session: AdminSession | null) {
  if (!session) return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  if (session.role !== "ADMIN") {
    return { ok: false as const, status: 403 as const, error: "Administrator role required" };
  }
  return { ok: true as const, session };
}

export function requireResourceMutation(
  session: AdminSession | null,
  resource: AdminResource,
) {
  if (!session) return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  if (!canMutateResource(session.role, resource)) {
    return {
      ok: false as const,
      status: 403 as const,
      error: "Administrator role required",
    };
  }
  return { ok: true as const, session };
}
