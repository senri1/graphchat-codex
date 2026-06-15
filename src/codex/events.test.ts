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

test('normalizes structured plans, hooks, usage, warnings, and compaction notifications', () => {
  let events = applyCodexEventNotification([], 'turn/plan/updated', {
    turnId: 'turn-1',
    explanation: 'Working through the implementation.',
    plan: [
      { step: 'Inspect', status: 'completed' },
      { step: 'Implement', status: 'inProgress' },
      { step: 'Verify', status: 'pending' },
    ],
  });
  events = applyCodexEventNotification(events, 'hook/started', {
    turnId: 'turn-1',
    run: {
      id: 'hook-1',
      eventName: 'preToolUse',
      handlerType: 'command',
      source: 'project',
      sourcePath: '/workspace/.codex/hooks.json',
      status: 'running',
      startedAt: 10,
      entries: [],
    },
  });
  events = applyCodexEventNotification(events, 'hook/completed', {
    turnId: 'turn-1',
    run: {
      id: 'hook-1',
      eventName: 'preToolUse',
      handlerType: 'command',
      source: 'project',
      sourcePath: '/workspace/.codex/hooks.json',
      status: 'completed',
      startedAt: 10,
      completedAt: 20,
      durationMs: 10,
      entries: [{ kind: 'context', text: 'Hook context' }],
    },
  });
  events = applyCodexEventNotification(events, 'thread/tokenUsage/updated', {
    turnId: 'turn-1',
    tokenUsage: {
      last: {
        inputTokens: 100,
        outputTokens: 20,
        reasoningOutputTokens: 5,
        totalTokens: 125,
      },
      total: {
        inputTokens: 300,
        outputTokens: 50,
        reasoningOutputTokens: 10,
        totalTokens: 360,
      },
      modelContextWindow: 128000,
    },
  });
  events = applyCodexEventNotification(events, 'warning', {
    threadId: 'thread-1',
    message: 'Check the workspace configuration.',
  });
  events = applyCodexEventNotification(events, 'thread/compacted', {
    turnId: 'turn-1',
  });

  assert.deepEqual(events.map((event) => event.kind), [
    'plan',
    'hook',
    'token_usage',
    'warning',
    'context_compaction',
  ]);
  assert.equal(events[0]?.subtitle, '1/3 complete');
  assert.equal(events[0]?.steps?.[1]?.status, 'in_progress');
  assert.equal(events[1]?.status, 'completed');
  assert.equal(events[1]?.detail, 'Context: Hook context');
  assert.equal(events[2]?.tokenUsage?.modelContextWindow, 128000);
  assert.equal(events[3]?.status, 'warning');
});

test('merges structured and textual plan updates without duplicating the row', () => {
  let events = applyCodexEventNotification([], 'turn/plan/updated', {
    turnId: 'turn-1',
    plan: [{ step: 'Inspect', status: 'inProgress' }],
  });
  events = applyCodexEventNotification(events, 'item/started', {
    startedAtMs: 10,
    item: { type: 'plan', id: 'plan-item', text: '' },
  });
  events = applyCodexEventNotification(events, 'item/plan/delta', {
    itemId: 'plan-item',
    delta: '1. Inspect',
  });
  events = applyCodexEventNotification(events, 'item/completed', {
    completedAtMs: 20,
    item: { type: 'plan', id: 'plan-item', text: '1. Inspect' },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.id, 'turn-plan:turn-1');
  assert.equal(events[0]?.detail, '1. Inspect');
  assert.equal(events[0]?.steps?.[0]?.step, 'Inspect');
  assert.equal(events[0]?.status, 'completed');
});

test('records interactive terminal input on its command event', () => {
  let events = applyCodexEventNotification([], 'item/started', {
    item: {
      type: 'commandExecution',
      id: 'cmd-1',
      command: 'npm init',
      status: 'inProgress',
    },
  });
  events = applyCodexEventNotification(events, 'item/commandExecution/terminalInteraction', {
    itemId: 'cmd-1',
    stdin: 'yes\n',
  });

  assert.deepEqual(events[0]?.terminalInput, ['yes\n']);
});

test('closes live-only activity when the turn completes', () => {
  let events = applyCodexEventNotification([], 'turn/diff/updated', {
    turnId: 'turn-1',
    diff: 'diff --git a/a.ts b/a.ts',
  });
  events = applyCodexEventNotification(events, 'turn/completed', {
    turn: {
      id: 'turn-1',
      status: 'completed',
      completedAt: 100,
    },
  });

  assert.equal(events[0]?.status, 'completed');
  assert.equal(events[0]?.completedAtMs, 100000);
});
