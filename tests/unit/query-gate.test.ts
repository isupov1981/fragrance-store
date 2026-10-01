import { afterEach, describe, expect, it, vi } from "vitest";

import { createQueryGate } from "@/lib/db/query-gate";

describe("createQueryGate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("disconnects only after the idle window with no queries in flight", async () => {
    vi.useFakeTimers();
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const gate = createQueryGate({ idleMs: 20_000, disconnect });

    await gate.begin();
    gate.end();
    await vi.advanceTimersByTimeAsync(19_999);
    expect(disconnect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("waits out a query that starts before the idle timer fires", async () => {
    vi.useFakeTimers();
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const gate = createQueryGate({ idleMs: 20_000, disconnect });

    await gate.begin();
    gate.end();
    await vi.advanceTimersByTimeAsync(10_000);
    await gate.begin();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(disconnect).not.toHaveBeenCalled();
    gate.end();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("lets the next query wait until disconnect finishes", async () => {
    vi.useFakeTimers();
    let release: (() => void) | undefined;
    const disconnect = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const gate = createQueryGate({ idleMs: 1_000, disconnect });

    await gate.begin();
    gate.end();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(disconnect).toHaveBeenCalledOnce();

    let started = false;
    const pending = gate.begin().then(() => {
      started = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(started).toBe(false);
    release?.();
    await pending;
    expect(started).toBe(true);
    gate.end();
  });
});
