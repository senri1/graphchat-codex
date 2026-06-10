const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { syncConversationContext } = require('../electron/conversation-context-storage.cjs');

function chatFixture(cwd, overrides = {}) {
  return {
    chatId: 'chat-1',
    chatName: 'Ideas',
    folderPath: ['Personal'],
    cwd,
    meta: {
      turns: [
        {
          createdAt: Date.UTC(2026, 5, 10),
          userNodeId: 'user-1',
          assistantNodeId: 'assistant-1',
        },
      ],
    },
    nodes: [
      {
        kind: 'text',
        id: 'note-1',
        title: 'Note',
        parentId: null,
        rect: { x: 1, y: 2, w: 3, h: 4 },
        author: 'user',
        content: '# Editable note',
        isEditNode: true,
      },
      {
        kind: 'text',
        id: 'user-1',
        title: 'User',
        parentId: 'note-1',
        rect: { x: 2, y: 3, w: 4, h: 5 },
        author: 'user',
        content: 'Do you remember this topic?',
      },
      {
        kind: 'text',
        id: 'assistant-1',
        title: 'Assistant',
        parentId: 'user-1',
        rect: { x: 3, y: 4, w: 5, h: 6 },
        author: 'assistant',
        content: 'Yes.',
        codexRef: {
          threadId: 'thread-1',
          turnId: 'turn-1',
          cwd,
        },
      },
    ],
    ...overrides,
  };
}

test('writes editable documents, immutable conversation files, and graph indexes', async (t) => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'graphchat-context-'));
  t.after(() => fs.rm(cwd, { recursive: true, force: true }));

  const result = await syncConversationContext({ chats: [chatFixture(cwd)] });
  assert.deepEqual(result.updates, []);

  const root = path.join(cwd, 'conversation-context');
  const editable = await fs.readFile(path.join(root, 'chats', 'chat-1', 'nodes', 'documents', 'note-1.md'), 'utf8');
  const conversation = await fs.readFile(
    path.join(root, 'chats', 'chat-1', 'nodes', 'conversation', 'assistant-1.md'),
    'utf8',
  );
  const graph = JSON.parse(await fs.readFile(path.join(root, 'chats', 'chat-1', 'graph.json'), 'utf8'));
  const index = await fs.readFile(path.join(root, 'INDEX.md'), 'utf8');

  assert.equal(editable, '# Editable note');
  assert.equal(conversation, 'Yes.');
  assert.deepEqual(graph.roots, ['note-1']);
  const noteNode = graph.nodes.find((node) => node.id === 'note-1');
  assert.equal(noteNode.editable, true);
  assert.equal(noteNode.contentFile, 'nodes/documents/note-1.md');
  assert.match(index, /Ideas/);
  assert.match(index, /Do you remember this topic/);
});

test('imports external edits to document nodes without accepting conversation edits', async (t) => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'graphchat-context-'));
  t.after(() => fs.rm(cwd, { recursive: true, force: true }));
  const fixture = chatFixture(cwd);
  await syncConversationContext({ chats: [fixture] });

  const root = path.join(cwd, 'conversation-context', 'chats', 'chat-1', 'nodes');
  const documentPath = path.join(root, 'documents', 'note-1.md');
  const conversationPath = path.join(root, 'conversation', 'assistant-1.md');
  await fs.chmod(conversationPath, 0o644);
  await fs.writeFile(documentPath, '# Edited outside GraphChat', 'utf8');
  await fs.writeFile(conversationPath, 'Tampered', 'utf8');

  const result = await syncConversationContext({ chats: [fixture] });
  assert.deepEqual(result.updates, [
    {
      chatId: 'chat-1',
      nodeId: 'note-1',
      content: '# Edited outside GraphChat',
    },
  ]);
  assert.equal(await fs.readFile(conversationPath, 'utf8'), 'Yes.');
});

test('preserves both versions when GraphChat and a document file changed', async (t) => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'graphchat-context-'));
  t.after(() => fs.rm(cwd, { recursive: true, force: true }));
  const fixture = chatFixture(cwd);
  await syncConversationContext({ chats: [fixture] });

  const chatDir = path.join(cwd, 'conversation-context', 'chats', 'chat-1');
  await fs.writeFile(path.join(chatDir, 'nodes', 'documents', 'note-1.md'), '# Disk edit', 'utf8');
  fixture.nodes[0].content = '# GraphChat edit';

  const result = await syncConversationContext({ chats: [fixture] });
  assert.equal(result.updates[0].content, '# Disk edit');
  assert.equal(result.conflicts.length, 1);
  assert.equal(
    await fs.readFile(path.join(chatDir, result.conflicts[0].preservedGraphChatCopy), 'utf8'),
    '# GraphChat edit',
  );
});

test('treats legacy and recorded turn nodes as immutable conversation context', async (t) => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'graphchat-context-'));
  t.after(() => fs.rm(cwd, { recursive: true, force: true }));
  const fixture = chatFixture(cwd);
  fixture.nodes[1].isEditNode = true;
  fixture.meta.legacyImport = { source: 'graphchatv1' };

  await syncConversationContext({ chats: [fixture] });

  const chatDir = path.join(cwd, 'conversation-context', 'chats', 'chat-1');
  const graph = JSON.parse(await fs.readFile(path.join(chatDir, 'graph.json'), 'utf8'));
  assert.equal(graph.nodes.find((node) => node.id === 'user-1').editable, false);
  assert.equal(graph.nodes.find((node) => node.id === 'note-1').editable, false);
  await fs.access(path.join(chatDir, 'nodes', 'conversation', 'user-1.md'));
  await fs.access(path.join(chatDir, 'nodes', 'conversation', 'note-1.md'));
});

test('keeps chats in their own working-folder context roots', async (t) => {
  const firstCwd = await fs.mkdtemp(path.join(os.tmpdir(), 'graphchat-cwd-a-'));
  const secondCwd = await fs.mkdtemp(path.join(os.tmpdir(), 'graphchat-cwd-b-'));
  t.after(async () => {
    await Promise.all([
      fs.rm(firstCwd, { recursive: true, force: true }),
      fs.rm(secondCwd, { recursive: true, force: true }),
    ]);
  });

  const second = chatFixture(secondCwd, { chatId: 'chat-2', chatName: 'Second chat' });
  await syncConversationContext({ chats: [chatFixture(firstCwd), second] });

  await fs.access(path.join(firstCwd, 'conversation-context', 'chats', 'chat-1', 'graph.json'));
  await fs.access(path.join(secondCwd, 'conversation-context', 'chats', 'chat-2', 'graph.json'));
  assert.equal(
    await readExists(path.join(firstCwd, 'conversation-context', 'chats', 'chat-2', 'graph.json')),
    false,
  );
  assert.equal(
    await readExists(path.join(secondCwd, 'conversation-context', 'chats', 'chat-1', 'graph.json')),
    false,
  );
});

async function readExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
