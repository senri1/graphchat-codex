import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChatNode } from '../model/chat';
import {
  buildLegacyHistory,
  hasUserPrefaceContext,
  isClaudeCodeHistoryInjectionEndpoint,
  isLegacyContinuationNode,
} from './legacyHistory.ts';

function textNode(args: {
  id: string;
  parentId?: string | null;
  author: 'user' | 'assistant';
  content: string;
  modelId?: string;
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
    ...(args.modelId ? { modelId: args.modelId } : {}),
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

test('detects contextual replies with one or multiple selected contexts', () => {
  const oneContext = textNode({
    id: 'u1',
    author: 'user',
    content: 'Explain this',
    userPreface: { contexts: ['Selected passage'] },
  });
  const multipleContexts = textNode({
    id: 'u2',
    author: 'user',
    content: 'Compare these',
    userPreface: { contexts: ['First passage', '  ', 'Second passage'] },
  });
  const replyContext = textNode({
    id: 'u3',
    author: 'user',
    content: 'Why?',
    userPreface: { replyTo: 'Quoted passage' },
  });
  const emptyContext = textNode({
    id: 'u4',
    author: 'user',
    content: 'Standalone note',
    userPreface: { contexts: ['  '] },
  });

  assert.equal(hasUserPrefaceContext(oneContext), true);
  assert.equal(hasUserPrefaceContext(multipleContexts), true);
  assert.equal(hasUserPrefaceContext(replyContext), true);
  assert.equal(hasUserPrefaceContext(emptyContext), false);
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

test('allows completed user and assistant nodes as legacy continuation points', () => {
  const user = textNode({ id: 'u1', author: 'user', content: 'Legacy note' });
  const assistant = textNode({ id: 'a1', parentId: 'u1', author: 'assistant', content: 'Legacy answer' });

  assert.equal(isLegacyContinuationNode(user), true);
  assert.equal(isLegacyContinuationNode(assistant), true);
});

test('allows a non-empty stopped assistant response as a legacy continuation point', () => {
  const user = textNode({ id: 'u1', author: 'user', content: 'Convert the delimiters' });
  const assistant = textNode({
    id: 'a1',
    parentId: 'u1',
    author: 'assistant',
    content: 'I converted the first section.',
  });
  assistant.llmError = 'Canceled';

  assert.equal(isLegacyContinuationNode(assistant), true);
  assert.deepEqual(buildLegacyHistory([user, assistant], assistant.id), [
    { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Convert the delimiters' }] },
    {
      type: 'message',
      role: 'assistant',
      content: [{ type: 'output_text', text: 'I converted the first section.' }],
    },
  ]);
});

test('allows completed or stopped Claude Code responses to seed another runtime history', () => {
  const completed = textNode({
    id: 'a1',
    author: 'assistant',
    content: 'Completed Claude response',
    modelId: 'claude-code:claude-fable-5:xhigh',
  });
  const stopped = textNode({
    id: 'a2',
    author: 'assistant',
    content: 'Partial Claude response',
    modelId: 'claude-code:claude-fable-5:max',
  });
  stopped.llmError = 'Canceled';

  assert.equal(isClaudeCodeHistoryInjectionEndpoint(completed), true);
  assert.equal(isClaudeCodeHistoryInjectionEndpoint(stopped), true);
});

test('does not treat active, failed, or non-Claude responses as Claude history endpoints', () => {
  const active = textNode({
    id: 'a1',
    author: 'assistant',
    content: 'Still working',
    modelId: 'claude-code:claude-fable-5:xhigh',
  });
  active.isGenerating = true;
  const failed = textNode({
    id: 'a2',
    author: 'assistant',
    content: 'Claude failed',
    modelId: 'claude-code:claude-fable-5:xhigh',
  });
  failed.llmError = 'process exited with code 1';
  const codex = textNode({
    id: 'a3',
    author: 'assistant',
    content: 'Codex response',
    modelId: 'codex:gpt-5.4:xhigh',
  });

  assert.equal(isClaudeCodeHistoryInjectionEndpoint(active), false);
  assert.equal(isClaudeCodeHistoryInjectionEndpoint(failed), false);
  assert.equal(isClaudeCodeHistoryInjectionEndpoint(codex), false);
});

test('does not allow incomplete, empty, or failed nodes as legacy continuation points', () => {
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
  const empty = textNode({ id: 'u2', author: 'user', content: '  ' });
  const draft = textNode({ id: 'u3', author: 'user', content: 'Unsent draft' });
  draft.conversationDraft = true;

  assert.equal(isLegacyContinuationNode(failed), false);
  assert.equal(isLegacyContinuationNode(empty), false);
  assert.equal(isLegacyContinuationNode(draft), false);
  assert.throws(() => buildLegacyHistory(nodes, failed.id), /failed assistant response/);
});
