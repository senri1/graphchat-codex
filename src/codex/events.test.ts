import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCodexEventNotification,
  codexEventFromThreadItem,
  codexEventsFromThreadItems,
} from './events.ts';

test('normalizes command and file-change items into portable events', () => {
  const command = codexEventFromThreadItem({
    type: 'commandExecution',
    id: 'cmd-1',
    command: 'npm test',
    cwd: '/workspace',
    status: 'completed',
    aggregatedOutput: '12 passing',
    exitCode: 0,
    durationMs: 250,
  });
  const fileChange = codexEventFromThreadItem({
    type: 'fileChange',
    id: 'patch-1',
    status: 'completed',
    changes: [{ path: 'src/App.tsx', kind: { type: 'update' }, diff: '@@ changed' }],
  });

  assert.deepEqual(command, {
    id: 'cmd-1',
    kind: 'command',
    title: 'Ran npm test',
    status: 'completed',
    command: 'npm test',
    cwd: '/workspace',
    detail: '12 passing',
    exitCode: 0,
    durationMs: 250,
  });
  assert.equal(fileChange?.title, 'Changed 1 file');
  assert.deepEqual(fileChange?.files, [{ path: 'src/App.tsx', kind: 'update', diff: '@@ changed' }]);
});

test('ignores conversational items already rendered elsewhere', () => {
  assert.equal(codexEventFromThreadItem({ type: 'userMessage', id: 'u-1' }), null);
  assert.equal(codexEventFromThreadItem({ type: 'agentMessage', id: 'a-1', text: 'Hello' }), null);
  assert.equal(codexEventFromThreadItem({ type: 'reasoning', id: 'r-1', summary: ['Thinking'] }), null);
});

test('updates a streaming event through started, delta, and completed notifications', () => {
  let events = applyCodexEventNotification([], 'item/started', {
    startedAtMs: 10,
    item: {
      type: 'commandExecution',
      id: 'cmd-1',
      command: 'npm test',
      cwd: '/workspace',
      status: 'inProgress',
      aggregatedOutput: null,
    },
  });
  events = applyCodexEventNotification(events, 'item/commandExecution/outputDelta', {
    itemId: 'cmd-1',
    delta: 'first\n',
  });
  events = applyCodexEventNotification(events, 'item/commandExecution/outputDelta', {
    itemId: 'cmd-1',
    delta: 'second\n',
  });
  events = applyCodexEventNotification(events, 'item/completed', {
    completedAtMs: 20,
    item: {
      type: 'commandExecution',
      id: 'cmd-1',
      command: 'npm test',
      cwd: '/workspace',
      status: 'completed',
      aggregatedOutput: 'first\nsecond\n',
      exitCode: 0,
    },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.status, 'completed');
  assert.equal(events[0]?.detail, 'first\nsecond\n');
  assert.equal(events[0]?.startedAtMs, 10);
  assert.equal(events[0]?.completedAtMs, 20);
});

test('extracts all non-conversational items from imported turns in order', () => {
  const events = codexEventsFromThreadItems([
    { type: 'userMessage', id: 'user' },
    { type: 'plan', id: 'plan', text: '1. Inspect\n2. Edit' },
    { type: 'webSearch', id: 'search', query: 'Codex App Server', action: null },
    { type: 'contextCompaction', id: 'compact' },
    { type: 'agentMessage', id: 'assistant', text: 'Done' },
  ]);

  assert.deepEqual(events?.map((event) => event.kind), ['plan', 'web_search', 'context_compaction']);
});
