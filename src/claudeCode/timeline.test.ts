import assert from 'node:assert/strict';
import test from 'node:test';
import { applyClaudeCodeTimelineEvent } from './timeline.ts';
import {
  portableAssistantTextFromCodexTimeline,
  thinkingSummaryFromCodexTimeline,
} from '../codex/timeline.ts';

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

test('recreates Claude Code progress narration and grouped tool summaries', () => {
  let timeline = applyClaudeCodeTimelineEvent([], {
    kind: 'assistant-progress',
    operationId: 'op-progress',
    batchId: 'batch-1',
    messageId: 'msg-1',
    text: 'Let me inspect the context first.',
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'tool-use',
    operationId: 'op-progress',
    batchId: 'batch-1',
    tool: { id: 'read-1', name: 'Read', input: { file_path: 'a.txt' } },
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'tool-use',
    operationId: 'op-progress',
    batchId: 'batch-1',
    tool: { id: 'read-2', name: 'Read', input: { file_path: 'b.txt' } },
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'tool-use',
    operationId: 'op-progress',
    batchId: 'batch-1',
    tool: { id: 'grep-1', name: 'Grep', input: { pattern: 'sequent' } },
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'tool-use',
    operationId: 'op-progress',
    batchId: 'batch-1',
    tool: { id: 'bash-1', name: 'Bash', input: { command: 'pwd' } },
  });
  for (const [toolUseId, content] of [
    ['read-1', 'contents of a'],
    ['read-2', 'contents of b'],
    ['grep-1', 'a.txt:1:sequent'],
    ['bash-1', '/tmp/project'],
  ] as const) {
    timeline = applyClaudeCodeTimelineEvent(timeline, {
      kind: 'tool-result',
      operationId: 'op-progress',
      batchId: 'batch-1',
      toolResult: { toolUseId, content, isError: false },
    });
  }
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'assistant-message',
    operationId: 'op-progress',
    text: 'Final answer.',
  });

  assert.deepEqual(timeline.map((item) => item.id), [
    'claude-code:progress:op-progress:msg-1',
    'claude-code:tool-summary:batch-1',
    'claude-code:tool:batch-1:read-1',
    'claude-code:tool:batch-1:read-2',
    'claude-code:tool:batch-1:grep-1',
    'claude-code:tool:batch-1:bash-1',
    'claude-code:assistant-message',
  ]);
  assert.equal(timeline[0]?.kind, 'agent_message');
  if (timeline[0]?.kind === 'agent_message') {
    assert.equal(timeline[0].phase, 'commentary');
  }
  assert.equal(timeline[1]?.kind, 'agent_message');
  if (timeline[1]?.kind === 'agent_message') {
    assert.equal(timeline[1].text, 'Read 2 files, searched for 1 pattern, ran 1 shell command');
    assert.equal(timeline[1].phase, 'commentary');
    assert.equal(timeline[1].status, 'completed');
  }
  assert.equal(timeline[2]?.kind, 'event');
  if (timeline[2]?.kind === 'event') {
    assert.equal(timeline[2].event.status, 'completed');
    assert.equal(timeline[2].event.detail, 'contents of a');
  }
  assert.equal(portableAssistantTextFromCodexTimeline(timeline), 'Final answer.');
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

test('maps raw Claude thinking stream blocks into reasoning timeline items', () => {
  let timeline = applyClaudeCodeTimelineEvent([], {
    kind: 'message',
    operationId: 'op-4',
    message: {
      type: 'stream_event',
      event: {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'thinking', thinking: '' },
      },
    },
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'message',
    operationId: 'op-4',
    message: {
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'thinking_delta', thinking: 'Checking context.' },
      },
    },
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'message',
    operationId: 'op-4',
    message: {
      type: 'stream_event',
      event: { type: 'content_block_stop', index: 0 },
    },
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'text-delta',
    operationId: 'op-4',
    delta: 'Final answer.',
  });

  assert.deepEqual(timeline.map((item) => item.kind), ['reasoning', 'agent_message']);
  assert.deepEqual(thinkingSummaryFromCodexTimeline(timeline), [
    { summaryIndex: 0, text: 'Checking context.', done: true },
  ]);
  assert.equal(portableAssistantTextFromCodexTimeline(timeline), 'Final answer.');
});

test('does not duplicate answer text from raw text stream events', () => {
  let timeline = applyClaudeCodeTimelineEvent([], {
    kind: 'text-delta',
    operationId: 'op-5',
    delta: 'Visible answer.',
  });
  timeline = applyClaudeCodeTimelineEvent(timeline, {
    kind: 'message',
    operationId: 'op-5',
    message: {
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        index: 1,
        delta: { type: 'text_delta', text: 'Visible answer.' },
      },
    },
  });

  assert.equal(portableAssistantTextFromCodexTimeline(timeline), 'Visible answer.');
});
