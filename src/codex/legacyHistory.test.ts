import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChatNode } from '../model/chat';
import { buildLegacyHistory, isLegacyAssistantContinuationNode } from './legacyHistory.ts';

function textNode(args: {
  id: string;
  parentId?: string | null;
  author: 'user' | 'assistant';
  content: string;
  userPreface?: { replyTo?: string; contexts?: string[] };
}): Extract<ChatNode, { kind: 'text' }> {
  return {
    kind: 'text',
    id: args.id,
    title: args.author === 'user' ? 'User' : 'Assistant',
    parentId: args.parentId ?? null,
    rect: { x: 0, y: 0, w: 100, h: 100 },
    author: args.author,
    content: args.content,
    ...(args.userPreface ? { userPreface: args.userPreface } : {}),
  };
}

test('builds only the selected root-to-node branch', () => {
  const nodes = [
    textNode({ id: 'u1', author: 'user', content: 'Question' }),
    textNode({ id: 'a1', parentId: 'u1', author: 'assistant', content: 'Answer one' }),
    textNode({ id: 'a2', parentId: 'u1', author: 'assistant', content: 'Sibling answer' }),
  ];

  assert.deepEqual(buildLegacyHistory(nodes, 'a1'), [
    { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Question' }] },
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Answer one' }] },
  ]);
});

test('merges consecutive nodes with the same role without changing the graph', () => {
  const nodes = [
    textNode({ id: 'u1', author: 'user', content: 'First' }),
    textNode({ id: 'u2', parentId: 'u1', author: 'user', content: 'Second' }),
    textNode({ id: 'a1', parentId: 'u2', author: 'assistant', content: 'Reply' }),
  ];

  assert.equal(buildLegacyHistory(nodes, 'a1')[0]?.content[0]?.text, 'First\n\nSecond');
  assert.equal(nodes[1]?.parentId, 'u1');
});

test('includes the user preface that formed part of the original prompt', () => {
  const nodes = [
    textNode({
      id: 'u1',
      author: 'user',
      content: 'Main question',
      userPreface: { replyTo: 'Quoted passage', contexts: ['Context A', 'Context B'] },
    }),
  ];

  assert.equal(
    buildLegacyHistory(nodes, 'u1')[0]?.content[0]?.text,
    [
      'Selected context to reply to:\nQuoted passage',
      'Additional context 1:\nContext A\n\nAdditional context 2:\nContext B',
      'Main question',
    ].join('\n\n'),
  );
});

test('skips non-text and empty nodes', () => {
  const nodes: ChatNode[] = [
    {
      kind: 'pdf',
      id: 'pdf',
      title: 'PDF',
      parentId: null,
      rect: { x: 0, y: 0, w: 100, h: 100 },
      fileName: 'notes.pdf',
      pageCount: 1,
      status: 'ready',
      error: null,
    },
    textNode({ id: 'u1', parentId: 'pdf', author: 'user', content: '  ' }),
    textNode({ id: 'a1', parentId: 'u1', author: 'assistant', content: 'Visible' }),
  ];

  assert.deepEqual(buildLegacyHistory(nodes, 'a1'), [
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Visible' }] },
  ]);
});

test('rejects broken or cyclic ancestry', () => {
  assert.throws(
    () => buildLegacyHistory([textNode({ id: 'u1', parentId: 'missing', author: 'user', content: 'Hi' })], 'u1'),
    /missing node/,
  );

  const cycle = [
    textNode({ id: 'u1', parentId: 'a1', author: 'user', content: 'Hi' }),
    textNode({ id: 'a1', parentId: 'u1', author: 'assistant', content: 'Hello' }),
  ];
  assert.throws(() => buildLegacyHistory(cycle, 'a1'), /parent cycle/);
});

test('does not allow failed assistant responses as legacy continuation points', () => {
  const failed = textNode({
    id: 'a1',
    parentId: 'u1',
    author: 'assistant',
    content: 'Error: unsupported model',
  });
  failed.llmError = 'unsupported model';
  const nodes = [
    textNode({ id: 'u1', author: 'user', content: 'Hello' }),
    failed,
  ];

  assert.equal(isLegacyAssistantContinuationNode(failed), false);
  assert.throws(() => buildLegacyHistory(nodes, failed.id), /failed assistant response/);
});
