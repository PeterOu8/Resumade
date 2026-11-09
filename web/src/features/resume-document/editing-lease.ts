export type EditingLease = {
  id: number;
  isActive: () => boolean;
  beginMutation: () => (() => void) | undefined;
  onRelease: (flush: () => void) => () => void;
};

let nextLeaseId = 0;

export function createEditingLease() {
  let active = true;
  let release!: () => void;
  const untilReleased = new Promise<void>((resolve) => { release = resolve; });
  const pending = new Set<Promise<void>>();
  const flushes = new Set<() => void>();

  const lease: EditingLease = {
    id: ++nextLeaseId,
    isActive: () => active,
    onRelease(flush) {
      if (active) flushes.add(flush);
      return () => { flushes.delete(flush); };
    },
    beginMutation() {
      if (!active) return;
      let finish!: () => void;
      const operation = new Promise<void>((resolve) => { finish = resolve; });
      pending.add(operation);
      return () => {
        pending.delete(operation);
        finish();
      };
    },
  };
  return {
    lease,
    stop() {
      if (!active) return;
      active = false;
      try {
        for (const flush of flushes) flush();
      } finally {
        flushes.clear();
        release();
      }
    },
    async waitForRelease() {
      await untilReleased;
      await Promise.allSettled(pending);
    },
  };
}
