import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EditableNodeRecoveryBuffer,
  type EditableNodeRecoveryDraft,
} from './editableNodeRecoveryBuffer.ts';

type ScheduledTimer = { callback: () => void; delayMs: number; canceled: boolean };

function createHarness() {
  const timers: ScheduledTimer[] = [];
  const flushed: EditableNodeRecoveryDraft[][] = [];
  let now = 100;
  const buffer = new EditableNodeRecoveryBuffer({
    delayMs: 750,
    onFlush: (drafts) => flushed.push(drafts),
    now: () => now++,
    setTimer: (callback, delayMs) => {
      const timer = { callback, delayMs, canceled: false };
      timers.push(timer);
      return timer as unknown as ReturnType<typeof globalThis.setTimeout>;
    },
    clearTimer: (handle) => {
      (handle as unknown as ScheduledTimer).canceled = true;
    },
  });
  return { buffer, flushed, timers };
}

test('debounces repeated edits and flushes only the latest draft', () => {
  const { buffer, flushed, timers } = createHarness();

  buffer.schedule('chat-1', 'node-1', 'a');
  buffer.schedule('chat-1', 'node-1', 'ab');

  assert.equal(timers.length, 2);
  assert.equal(timers[0]?.canceled, true);
  assert.equal(timers[1]?.delayMs, 750);

  timers[1]?.callback();
  assert.deepEqual(
    flushed.map((batch) => batch.map(({ chatId, nodeId, content }) => ({ chatId, nodeId, content }))),
    [[{ chatId: 'chat-1', nodeId: 'node-1', content: 'ab' }]],
  );
});

test('explicit flush preserves all pending nodes in one batch', () => {
  const { buffer, flushed } = createHarness();

  buffer.schedule('chat-1', 'node-1', 'first');
  buffer.schedule('chat-1', 'node-2', 'second');
  buffer.flush();

  assert.equal(flushed.length, 1);
  assert.deepEqual(
    flushed[0]?.map(({ nodeId, content }) => ({ nodeId, content })),
    [
      { nodeId: 'node-2', content: 'second' },
      { nodeId: 'node-1', content: 'first' },
    ],
  );
});

test('discard prevents a canceled edit from being recovered later', () => {
  const { buffer, flushed, timers } = createHarness();

  buffer.schedule('chat-1', 'node-1', 'discard me');
  buffer.discard('chat-1', 'node-1');

  assert.equal(timers[0]?.canceled, true);
  buffer.flush();
  assert.deepEqual(flushed, []);
});

test('discardMatching removes drafts already covered by durable state', () => {
  const { buffer, flushed } = createHarness();

  buffer.schedule('chat-1', 'node-1', 'saved');
  buffer.schedule('chat-1', 'node-2', 'unsaved');
  buffer.discardMatching((draft) => draft.content === 'saved');
  buffer.flush();

  assert.deepEqual(flushed[0]?.map(({ nodeId, content }) => ({ nodeId, content })), [
    { nodeId: 'node-2', content: 'unsaved' },
  ]);
});
