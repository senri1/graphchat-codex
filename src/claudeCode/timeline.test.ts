import assert from 'node:assert/strict';
import test from 'node:test';
import { applyClaudeCodeTimelineEvent } from './timeline.ts';
import { portableAssistantTextFromCodexTimeline } from '../codex/timeline.ts';

test('streams Claude Code text into an assistant timeline item', () => {
  let timeline = applyClaudeCodeTimelineEvent([], {
    kind: 'text-delta',
    delta: 'Hello',
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'text-delta',
    delta: ' world',
  });

  assert.deepEqual(timeline.map((item) => item.kind), ['agent_message']);
  assert.equal(portableAssistantTextFromCodexTimeline(timeline), 'Hello world');
});

test('maps Claude Code tool use and marks it completed when the turn completes', () => {
  let timeline = applyClaudeCodeTimelineEvent([], {
    kind: 'tool-use',
    operationId: 'op-1',
    tool: {
      id: 'tool-1',
      name: 'Read',
      input: { file_path: 'src/App.tsx' },
    },
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'turn-completed',
    operationId: 'op-1',
    status: 'completed',
    result: 'Done.',
    usage: { input_tokens: 10, output_tokens: 5 },
    costUsd: 0.0012,
  });

  assert.deepEqual(timeline.map((item) => item.id), [
    'claude-code:tool:tool-1',
    'claude-code:assistant-message',
    'claude-code:completion:op-1',
  ]);
  assert.equal(timeline[0]?.kind, 'event');
  if (timeline[0]?.kind === 'event') {
    assert.equal(timeline[0].event.kind, 'dynamic_tool');
    assert.equal(timeline[0].event.status, 'completed');
    assert.deepEqual(timeline[0].event.arguments, { file_path: 'src/App.tsx' });
  }
  assert.equal(portableAssistantTextFromCodexTimeline(timeline), 'Done.');
  assert.equal(timeline[2]?.kind, 'event');
  if (timeline[2]?.kind === 'event') {
    assert.equal(timeline[2].event.kind, 'token_usage');
    assert.equal(timeline[2].event.tokenUsage?.lastTotalTokens, 15);
  }
});

test('keeps streamed text when Claude Code result is shorter', () => {
  let timeline = applyClaudeCodeTimelineEvent([], {
    kind: 'text-delta',
    delta: 'A long streamed answer with details.',
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'turn-completed',
    operationId: 'op-2',
    status: 'completed',
    result: 'answer',
  });

  assert.equal(portableAssistantTextFromCodexTimeline(timeline), 'A long streamed answer with details.');
});

test('records permission denials and ignores unknown future event shapes', () => {
  let timeline = applyClaudeCodeTimelineEvent([], {
    kind: 'permission-denied',
    operationId: 'op-3',
    toolName: 'Write',
    message: 'Write access was denied.',
  });
  const same = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'future-event',
    payload: { changed: true },
  });

  assert.equal(same, timeline);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0]?.kind, 'event');
  if (timeline[0]?.kind === 'event') {
    assert.equal(timeline[0].event.status, 'declined');
    assert.equal(timeline[0].event.detail, 'Write access was denied.');
  }
});
