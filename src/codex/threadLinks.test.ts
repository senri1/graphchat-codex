import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChatNode } from '../model/chat';
import {
  hasCodexThreadLink,
  normalizeCodexThreadLinks,
  upsertCodexThreadLink,
} from './threadLinks.ts';

function assistantNode(args: {
  id: string;
  threadId: string;
  turnId: string;
  cwd?: string;
  forkedFromThreadId?: string;
  forkedFromTurnId?: string;
}): ChatNode {
  return {
    kind: 'text',
    id: args.id,
    title: 'Codex',
    parentId: null,
    rect: { x: 0, y: 0, w: 100, h: 100 },
    author: 'assistant',
    content: 'Response',
    codexRef: {
      threadId: args.threadId,
      turnId: args.turnId,
      cwd: args.cwd ?? '/workspace',
      ...(args.forkedFromThreadId ? { forkedFromThreadId: args.forkedFromThreadId } : {}),
      ...(args.forkedFromTurnId ? { forkedFromTurnId: args.forkedFromTurnId } : {}),
    },
  };
}

test('upgrades singular imported metadata and discovers every node-backed fork', () => {
  const links = normalizeCodexThreadLinks({
    workingFolder: '/workspace',
    legacyImportedThreadId: 'thread-1',
    legacyImportedUpdatedAt: 123,
    nodes: [
      assistantNode({ id: 'a1', threadId: 'thread-1', turnId: 'turn-a' }),
      assistantNode({
        id: 'a2',
        threadId: 'thread-2',
        turnId: 'turn-b',
        forkedFromThreadId: 'thread-1',
        forkedFromTurnId: 'turn-a',
      }),
    ],
  });

  assert.deepEqual(links, {
    'thread-1': {
      threadId: 'thread-1',
      cwd: '/workspace',
      origin: 'imported',
      lastSeenUpdatedAt: 123,
    },
    'thread-2': {
      threadId: 'thread-2',
      cwd: '/workspace',
      origin: 'forked',
      forkedFromThreadId: 'thread-1',
      forkedFromTurnId: 'turn-a',
    },
  });
});

test('normalization preserves valid saved links and repairs missing links from checkpoints', () => {
  const links = normalizeCodexThreadLinks({
    rawLinks: {
      'thread-1': {
        threadId: 'thread-1',
        cwd: '/workspace',
        origin: 'created',
        lastSeenUpdatedAt: 200,
      },
      broken: { threadId: 'broken', origin: 'created' },
    },
    nodes: [
      assistantNode({ id: 'a1', threadId: 'thread-1', turnId: 'turn-a' }),
      assistantNode({ id: 'a2', threadId: 'thread-2', turnId: 'turn-b' }),
    ],
  });

  assert.equal(links['thread-1']?.origin, 'created');
  assert.equal(links['thread-1']?.lastSeenUpdatedAt, 200);
  assert.equal(links['thread-2']?.origin, 'created');
  assert.equal(links.broken, undefined);
});

test('upserting a refreshed fork keeps ancestry and the newest observed timestamp', () => {
  const initial = upsertCodexThreadLink({}, {
    threadId: 'thread-2',
    cwd: '/workspace',
    origin: 'forked',
    forkedFromThreadId: 'thread-1',
    forkedFromTurnId: 'turn-a',
    lastSeenUpdatedAt: 100,
  });
  const refreshed = upsertCodexThreadLink(initial, {
    threadId: 'thread-2',
    cwd: '/workspace',
    origin: 'imported',
    lastSeenUpdatedAt: 250,
  });

  assert.deepEqual(refreshed['thread-2'], {
    threadId: 'thread-2',
    cwd: '/workspace',
    origin: 'forked',
    forkedFromThreadId: 'thread-1',
    forkedFromTurnId: 'turn-a',
    lastSeenUpdatedAt: 250,
  });
  assert.equal(hasCodexThreadLink(refreshed, 'thread-2'), true);
  assert.equal(hasCodexThreadLink(refreshed, 'missing'), false);
});
