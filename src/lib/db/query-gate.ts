export type QueryGate = {
  begin: () => Promise<void>;
  end: () => void;
};

/**
 * Closes the Prisma pool after a quiet period so Neon can scale to zero.
 * A live pool connection counts as activity and keeps the compute billed.
 */
export function createQueryGate(options: {
  idleMs: number;
  disconnect: () => Promise<unknown>;
}): QueryGate {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let depth = 0;
  let disconnecting: Promise<void> | undefined;

  const arm = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (depth > 0) return;
      disconnecting = Promise.resolve(options.disconnect()).then(
        () => undefined,
        () => undefined,
      );
    }, options.idleMs);
    timer.unref?.();
  };

  return {
    async begin() {
      if (timer) clearTimeout(timer);
      if (disconnecting) await disconnecting;
      depth += 1;
    },
    end() {
      depth = Math.max(0, depth - 1);
      if (depth === 0) arm();
    },
  };
}
