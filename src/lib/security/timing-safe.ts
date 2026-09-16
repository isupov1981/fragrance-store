import { timingSafeEqual } from "node:crypto";

/** Constant-time string equality; returns false when lengths differ. */
export function safeEqualString(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(a.length ? a : Buffer.from("x"), a.length ? a : Buffer.from("x"));
    return false;
  }
  return timingSafeEqual(a, b);
}
