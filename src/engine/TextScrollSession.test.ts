import assert from 'node:assert/strict';
import test from 'node:test';
import { TextScrollSession } from './TextScrollSession.ts';

function createScheduler() {
  let nextId = 1;
  const callbacks = new Map<number, () => void>();
  return {
    scheduler: {
      setTimeout(callback: () => void) {
        const id = nextId++;
        callbacks.set(id, callback);
        return id;
      },
      clearTimeout(id: number) {
        callbacks.delete(id);
      },
    },
    runPending() {
      const pending = Array.from(callbacks.values());
      callbacks.clear();
      for (const callback of pending) callback();
    },
    pendingCount() {
      return callbacks.size;
    },
  };
}

test('coalesces a scroll burst and commits only the final position', () => {
  const fake = createScheduler();
  const events: string[] = [];
  const session = new TextScrollSession(
    {
      onInteractionChange: (active) => events.push(active ? 'start' : 'end'),
      onCommit: ({ nodeId, scrollTop, scrollLeft }) =>
        events.push(`commit:${nodeId}:${scrollTop}:${scrollLeft}`),
    },
    { scheduler: fake.scheduler },
  );

  session.record({ nodeId: 'n1', scrollTop: 12, scrollLeft: 0 });
  session.record({ nodeId: 'n1', scrollTop: 48, scrollLeft: 3 });

  assert.equal(fake.pendingCount(), 1);
  assert.deepEqual(events, ['start']);
  assert.deepEqual(session.getPending(), { nodeId: 'n1', scrollTop: 48, scrollLeft: 3 });

  fake.runPending();

  assert.deepEqual(events, ['start', 'commit:n1:48:3', 'end']);
  assert.equal(session.isActive(), false);
  assert.equal(session.getPending(), null);
});

test('explicit flush commits before ending the interaction and cancels the timer', () => {
  const fake = createScheduler();
  const events: string[] = [];
  const session = new TextScrollSession(
    {
      onInteractionChange: (active) => events.push(active ? 'start' : 'end'),
      onCommit: ({ scrollTop }) => events.push(`commit:${scrollTop}`),
    },
    { scheduler: fake.scheduler },
  );

  session.record({ nodeId: 'n1', scrollTop: 75, scrollLeft: 0 });
  assert.equal(session.flush(), true);

  assert.deepEqual(events, ['start', 'commit:75', 'end']);
  assert.equal(fake.pendingCount(), 0);

  fake.runPending();
  assert.deepEqual(events, ['start', 'commit:75', 'end']);
});

test('flush is harmless when no scroll is pending', () => {
  const fake = createScheduler();
  const events: string[] = [];
  const session = new TextScrollSession(
    {
      onInteractionChange: (active) => events.push(active ? 'start' : 'end'),
      onCommit: () => events.push('commit'),
    },
    { scheduler: fake.scheduler },
  );

  assert.equal(session.flush(), false);
  assert.deepEqual(events, []);
});

test('pending snapshots are normalized and defensive copies', () => {
  const fake = createScheduler();
  const committed: Array<{ scrollTop: number; scrollLeft: number }> = [];
  const session = new TextScrollSession(
    {
      onInteractionChange: () => {},
      onCommit: ({ scrollTop, scrollLeft }) => committed.push({ scrollTop, scrollLeft }),
    },
    { scheduler: fake.scheduler },
  );

  session.record({ nodeId: 'n1', scrollTop: -20, scrollLeft: Number.NaN });
  const snapshot = session.getPending();
  assert.deepEqual(snapshot, { nodeId: 'n1', scrollTop: 0, scrollLeft: 0 });

  if (snapshot) snapshot.scrollTop = 999;
  assert.deepEqual(session.getPending(), { nodeId: 'n1', scrollTop: 0, scrollLeft: 0 });

  session.flush();
  assert.deepEqual(committed, [{ scrollTop: 0, scrollLeft: 0 }]);
});
