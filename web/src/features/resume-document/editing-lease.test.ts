import { expect, it } from 'vitest';
import { createEditingLease } from './editing-lease';

it('keeps the lock until in-flight account mutations finish after navigation', async () => {
  const { lease, stop, waitForRelease } = createEditingLease();
  const finishSave = lease.beginMutation();
  expect(finishSave).toBeDefined();

  let released = false;
  let flushed = false;
  lease.onRelease(() => { flushed = true; });
  const release = waitForRelease().then(() => { released = true; });
  stop();
  expect(flushed).toBe(true);
  await Promise.resolve();
  expect(lease.isActive()).toBe(false);
  expect(lease.beginMutation()).toBeUndefined();
  expect(released).toBe(false);

  finishSave?.();
  await release;
  expect(released).toBe(true);
});
