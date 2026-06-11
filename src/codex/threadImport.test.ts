import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChatNode } from '../model/chat';
import { mergeCodexThreadIntoChat, type CodexThreadDetail } from './threadImport.ts';

function turn(id: string, user: string, assistant: string) {
  return {
    id,
    status: 'completed',
    items: [
      { type: 'userMessage', content: [{ type: 'text', text: user }] },
      { type: 'agentMessage', text: assistant, phase: 'final_answer' },
    ],
  };
}

function thread(args: {
  id: string;
  turns: ReturnType<typeof turn>[];
  forkedFromId?: string;
}): CodexThreadDetail {
  return {
    id: args.id,
    cwd: '/workspace',
    ...(args.forkedFromId ? { forkedFromId: args.forkedFromId } : {}),
    turns: args.turns,
  };
}

function assistantForTurn(nodes: ChatNode[], turnId: string) {
  return nodes.find(
    (node): node is Extract<ChatNode, { kind: 'text' }> =>
      node.kind === 'text' && node.author === 'assistant' && node.codexRef?.turnId === turnId,
  );
}

test('refresh is idempotent, adds only new turns, and preserves local graph content and layout', () => {
  const initial = mergeCodexThreadIntoChat(
    null,
    thread({
      id: 'thread-1',
      turns: [turn('turn-a', 'A?', 'A.'), turn('turn-b', 'B?', 'B.')],
    }),
    'chat-1',
  );
  const moved = assistantForTurn(initial.state.nodes, 'turn-a');
  assert.ok(moved);
  moved.rect = { x: 900, y: 700, w: 640, h: 300 };
  const localDocument: ChatNode = {
    kind: 'text',
    id: 'local-document',
    title: 'Notes',
    parentId: null,
    rect: { x: 40, y: 40, w: 300, h: 200 },
    author: 'user',
    content: 'Keep this GraphChat-only document.',
    documentNode: true,
    isEditNode: true,
  };
  initial.state.nodes.push(localDocument);

  const refreshed = mergeCodexThreadIntoChat(
    initial.state,
    thread({
      id: 'thread-1',
      turns: [
        turn('turn-a', 'A?', 'A.'),
        turn('turn-b', 'B?', 'B.'),
        turn('turn-c', 'C?', 'C.'),
      ],
    }),
    'chat-1',
  );
  const repeated = mergeCodexThreadIntoChat(
    refreshed.state,
    thread({
      id: 'thread-1',
      turns: [
        turn('turn-a', 'A?', 'A.'),
        turn('turn-b', 'B?', 'B.'),
        turn('turn-c', 'C?', 'C.'),
      ],
    }),
    'chat-1',
  );

  assert.equal(refreshed.addedTurnCount, 1);
  assert.equal(repeated.addedTurnCount, 0);
  assert.equal(repeated.state.nodes.length, 7);
  assert.deepEqual(assistantForTurn(repeated.state.nodes, 'turn-a')?.rect, {
    x: 900,
    y: 700,
    w: 640,
    h: 300,
  });
  assert.equal(
    repeated.state.nodes.find((node) => node.id === 'local-document')?.kind,
    'text',
  );
});

test('importing a fork reuses shared turn IDs and adds only the fork-specific tail', () => {
  const main = mergeCodexThreadIntoChat(
    null,
    thread({
      id: 'thread-1',
      turns: [turn('turn-a', 'A?', 'A.'), turn('turn-b', 'B?', 'B.')],
    }),
    'chat-1',
  );
  const fork = mergeCodexThreadIntoChat(
    main.state,
    thread({
      id: 'thread-2',
      forkedFromId: 'thread-1',
      turns: [
        turn('turn-a', 'A?', 'A.'),
        turn('turn-b', 'B?', 'B.'),
        turn('turn-c', 'Alternative C?', 'Alternative C.'),
      ],
    }),
    'chat-1',
  );

  assert.equal(fork.state.nodes.length, 6);
  assert.equal(fork.addedTurnCount, 1);
  assert.equal(assistantForTurn(fork.state.nodes, 'turn-a')?.codexRef?.threadId, 'thread-1');
  assert.equal(assistantForTurn(fork.state.nodes, 'turn-b')?.codexRef?.threadId, 'thread-1');
  assert.equal(assistantForTurn(fork.state.nodes, 'turn-c')?.codexRef?.threadId, 'thread-2');
  assert.equal(assistantForTurn(fork.state.nodes, 'turn-c')?.codexRef?.forkedFromThreadId, 'thread-1');
});
