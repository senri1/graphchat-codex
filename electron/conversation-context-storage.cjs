const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const CONTEXT_DIRNAME = 'conversation-context';
const CONTEXT_VERSION = 1;

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

function encodeSegment(value, fallback) {
  const raw = asTrimmedString(value);
  return encodeURIComponent(raw || fallback).replace(/\*/g, '%2A');
}

function contentHash(content) {
  return crypto.createHash('sha256').update(String(content ?? ''), 'utf8').digest('hex');
}

async function readTextOrNull(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return null;
    throw error;
  }
}

async function readJsonOrNull(filePath) {
  const text = await readTextOrNull(filePath);
  if (text == null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeFileAtomic(filePath, data, options = {}) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await fs.writeFile(tmpPath, data, options);
    await fs.rename(tmpPath, filePath);
  } catch (error) {
    await fs.rm(tmpPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function writeTextIfChanged(filePath, content) {
  const next = String(content ?? '');
  const current = await readTextOrNull(filePath);
  if (current === next) return false;
  await writeFileAtomic(filePath, next, { encoding: 'utf8' });
  return true;
}

async function writeJsonIfChanged(filePath, value) {
  return writeTextIfChanged(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeRect(rect) {
  const raw = rect && typeof rect === 'object' ? rect : {};
  const number = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return {
    x: number(raw.x),
    y: number(raw.y),
    w: number(raw.w),
    h: number(raw.h),
  };
}

function normalizeCodexRef(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const threadId = asTrimmedString(raw.threadId);
  const turnId = asTrimmedString(raw.turnId);
  const cwd = asTrimmedString(raw.cwd);
  if (!threadId || !turnId || !cwd) return undefined;
  const model = asTrimmedString(raw.model);
  const effort = asTrimmedString(raw.effort);
  const forkedFromThreadId = asTrimmedString(raw.forkedFromThreadId);
  const forkedFromTurnId = asTrimmedString(raw.forkedFromTurnId);
  return {
    threadId,
    turnId,
    cwd,
    ...(model ? { model } : {}),
    ...(effort ? { effort } : {}),
    ...(forkedFromThreadId ? { forkedFromThreadId } : {}),
    ...(forkedFromTurnId ? { forkedFromTurnId } : {}),
  };
}

function normalizeAttachments(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') return null;
      const kind = asTrimmedString(attachment.kind);
      if (!kind) return null;
      const name = asTrimmedString(attachment.name);
      const mimeType = asTrimmedString(attachment.mimeType);
      const storageKey = asTrimmedString(attachment.storageKey);
      return {
        kind,
        ...(name ? { name } : {}),
        ...(mimeType ? { mimeType } : {}),
        ...(storageKey ? { storageKey } : {}),
      };
    })
    .filter(Boolean);
}

function cleanPreview(text, limit = 240) {
  const compact = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (compact.length <= limit) return compact;
  return `${compact.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
}

function markdownCell(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function chatPreview(nodes) {
  const preferred =
    nodes.find(
      (node) =>
        node?.kind === 'text' &&
        node?.author === 'user' &&
        !node?.isEditNode &&
        asTrimmedString(node.content),
    ) ??
    nodes.find((node) => node?.kind === 'text' && node?.author === 'user' && asTrimmedString(node.content)) ??
    nodes.find((node) => node?.kind === 'text' && asTrimmedString(node.content)) ??
    null;
  return preferred ? cleanPreview(preferred.content) : '';
}

function buildChildrenByParent(nodes) {
  const children = new Map();
  for (const node of nodes) {
    const parentId = asTrimmedString(node?.parentId);
    if (!parentId) continue;
    const current = children.get(parentId) ?? [];
    current.push(asTrimmedString(node?.id));
    children.set(parentId, current);
  }
  return children;
}

function buildTurnDates(meta) {
  const out = new Map();
  const turns = Array.isArray(meta?.turns) ? meta.turns : [];
  for (const turn of turns) {
    const createdAt = Number(turn?.createdAt);
    if (!Number.isFinite(createdAt) || createdAt <= 0) continue;
    const userNodeId = asTrimmedString(turn?.userNodeId);
    const assistantNodeId = asTrimmedString(turn?.assistantNodeId);
    if (userNodeId) out.set(userNodeId, createdAt);
    if (assistantNodeId) out.set(assistantNodeId, createdAt);
  }
  return out;
}

function buildTurnNodeIds(meta) {
  const out = new Set();
  const turns = Array.isArray(meta?.turns) ? meta.turns : [];
  for (const turn of turns) {
    const userNodeId = asTrimmedString(turn?.userNodeId);
    const assistantNodeId = asTrimmedString(turn?.assistantNodeId);
    if (userNodeId) out.add(userNodeId);
    if (assistantNodeId) out.add(assistantNodeId);
  }
  return out;
}

function contextAgentsMarkdown() {
  return `# Conversation Context

This directory is maintained by GraphChat Codex.

## How to search

- Start with \`INDEX.md\` to find likely chats.
- Search full node text with \`rg -n "query" chats/*/nodes\`.
- Read a chat's \`README.md\` for its preview and basic statistics.
- Read \`graph.json\` only when parent/child relationships, branches, or Codex checkpoints matter.

## Editing rules

- Files under \`nodes/documents/\` are user-authored Markdown documents and may be edited.
- Files under \`nodes/conversation/\` are immutable conversation messages. Do not edit them.
- Do not edit \`graph.json\`, \`README.md\`, or \`INDEX.md\`; GraphChat regenerates them.
- When citing context, include the chat id and node id or the node file path.
`;
}

function chatReadmeMarkdown(chat, nodes, preview, graph) {
  const textCount = graph.nodes.filter((node) => node?.kind === 'text').length;
  const documentCount = graph.nodes.filter((node) => node?.kind === 'text' && Boolean(node?.editable)).length;
  const conversationCount = textCount - documentCount;
  const rootCount = graph.roots.length;
  const folderPath = Array.isArray(chat.folderPath) ? chat.folderPath.map(asTrimmedString).filter(Boolean) : [];

  return `# ${asTrimmedString(chat.chatName) || 'Untitled chat'}

- Chat id: \`${asTrimmedString(chat.chatId)}\`
- Workspace folder: ${folderPath.length ? folderPath.map((part) => `\`${part}\``).join(' / ') : '(root)'}
- Working folder: \`${asTrimmedString(chat.cwd)}\`
- Nodes: ${nodes.length} total, ${documentCount} editable documents, ${conversationCount} conversation messages
- Graph roots: ${rootCount}

## Preview

${preview || '_No text content yet._'}

## Files

- \`graph.json\`: graph topology, node metadata, and Codex checkpoints
- \`nodes/documents/\`: editable Markdown nodes
- \`nodes/conversation/\`: immutable user and assistant messages
`;
}

function indexMarkdown(entries) {
  const sorted = entries.slice().sort((a, b) => {
    const left = asTrimmedString(a.chatName).toLocaleLowerCase();
    const right = asTrimmedString(b.chatName).toLocaleLowerCase();
    return left.localeCompare(right) || asTrimmedString(a.chatId).localeCompare(asTrimmedString(b.chatId));
  });

  const lines = [
    '# Conversation Context',
    '',
    'Search this index by topic, then inspect the matching chat README or search its node Markdown files.',
    '',
    '| Chat | Folder | Preview |',
    '| --- | --- | --- |',
  ];
  for (const entry of sorted) {
    const chatDir = `chats/${encodeSegment(entry.chatId, 'chat')}`;
    const label = markdownCell(entry.chatName) || markdownCell(entry.chatId);
    const folder = markdownCell((entry.folderPath ?? []).join(' / ')) || '(root)';
    const preview = markdownCell(entry.preview) || 'No text content yet.';
    lines.push(`| [${label}](${chatDir}/README.md) | ${folder} | ${preview} |`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function makeWritable(filePath) {
  await fs.chmod(filePath, 0o644).catch(() => {});
}

async function makeReadOnly(filePath) {
  await fs.chmod(filePath, 0o444).catch(() => {});
}

async function removeStaleMarkdownFiles(directory, expectedNames) {
  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return;
    throw error;
  }
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile() || !entry.name.endsWith('.md') || expectedNames.has(entry.name)) return;
      await fs.rm(path.join(directory, entry.name), { force: true });
    }),
  );
}

async function preserveConflict(chatDir, nodeId, appContent) {
  const conflictDir = path.join(chatDir, 'conflicts');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${encodeSegment(nodeId, 'node')}-graphchat-${stamp}.md`;
  await writeFileAtomic(path.join(conflictDir, fileName), String(appContent ?? ''), { encoding: 'utf8' });
  return `conflicts/${fileName}`;
}

async function syncChat(contextRoot, chat) {
  const chatId = asTrimmedString(chat?.chatId);
  const cwd = asTrimmedString(chat?.cwd);
  if (!chatId || !cwd) throw new Error('Conversation context sync requires chatId and cwd.');

  const nodes = Array.isArray(chat?.nodes) ? chat.nodes : [];
  const meta = chat?.meta && typeof chat.meta === 'object' ? chat.meta : {};
  const chatDirName = encodeSegment(chatId, 'chat');
  const chatDir = path.join(contextRoot, 'chats', chatDirName);
  const documentsDir = path.join(chatDir, 'nodes', 'documents');
  const conversationDir = path.join(chatDir, 'nodes', 'conversation');
  await fs.mkdir(documentsDir, { recursive: true });
  await fs.mkdir(conversationDir, { recursive: true });

  const priorGraph = await readJsonOrNull(path.join(chatDir, 'graph.json'));
  const priorHashes = new Map();
  if (Array.isArray(priorGraph?.nodes)) {
    for (const node of priorGraph.nodes) {
      const nodeId = asTrimmedString(node?.id);
      const hash = asTrimmedString(node?.contentHash);
      if (nodeId && hash) priorHashes.set(nodeId, hash);
    }
  }

  const childrenByParent = buildChildrenByParent(nodes);
  const turnDates = buildTurnDates(meta);
  const turnNodeIds = buildTurnNodeIds(meta);
  const legacyChat = meta?.legacyImport?.source === 'graphchatv1';
  const graphNodes = [];
  const updates = [];
  const conflicts = [];
  const expectedDocumentFiles = new Set();
  const expectedConversationFiles = new Set();

  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    const nodeId = asTrimmedString(node.id);
    if (!nodeId) continue;
    const kind = asTrimmedString(node.kind) || 'unknown';
    const parentId = asTrimmedString(node.parentId) || null;
    const common = {
      id: nodeId,
      kind,
      title: asTrimmedString(node.title),
      parentId,
      children: childrenByParent.get(nodeId) ?? [],
      rect: normalizeRect(node.rect),
      ...(turnDates.has(nodeId) ? { createdAt: new Date(turnDates.get(nodeId)).toISOString() } : {}),
    };

    if (kind !== 'text') {
      graphNodes.push({
        ...common,
        ...(kind === 'pdf'
          ? {
              fileName: asTrimmedString(node.fileName) || null,
              pageCount: Number.isFinite(Number(node.pageCount)) ? Number(node.pageCount) : 0,
              storageKey: asTrimmedString(node.storageKey) || null,
            }
          : {}),
        ...(kind === 'ink' ? { attachments: normalizeAttachments(node.attachments) } : {}),
      });
      continue;
    }

    const editable =
      Boolean(node.documentNode) ||
      (!legacyChat && Boolean(node.isEditNode) && !turnNodeIds.has(nodeId));
    const fileName = `${encodeSegment(nodeId, 'node')}.md`;
    const relativePath = `nodes/${editable ? 'documents' : 'conversation'}/${fileName}`;
    const filePath = path.join(chatDir, ...relativePath.split('/'));
    const appContent = typeof node.content === 'string' ? node.content : String(node.content ?? '');
    const appHash = contentHash(appContent);
    const priorHash = priorHashes.get(nodeId) ?? '';
    const diskContent = await readTextOrNull(filePath);
    const diskHash = diskContent == null ? '' : contentHash(diskContent);
    let finalContent = appContent;
    let finalHash = appHash;

    if (editable && diskContent != null && diskHash !== appHash) {
      const diskChanged = Boolean(priorHash) && diskHash !== priorHash;
      const appChanged = !priorHash || appHash !== priorHash;
      if (diskChanged && !appChanged) {
        finalContent = diskContent;
        finalHash = diskHash;
        updates.push({ chatId, nodeId, content: diskContent });
      } else if (diskChanged && appChanged) {
        const conflictPath = await preserveConflict(chatDir, nodeId, appContent);
        finalContent = diskContent;
        finalHash = diskHash;
        updates.push({ chatId, nodeId, content: diskContent });
        conflicts.push({ chatId, nodeId, preservedGraphChatCopy: conflictPath });
      } else {
        await makeWritable(filePath);
        await writeTextIfChanged(filePath, appContent);
      }
    } else if (diskContent == null || diskHash !== appHash) {
      await makeWritable(filePath);
      await writeTextIfChanged(filePath, appContent);
    }

    if (editable) {
      expectedDocumentFiles.add(fileName);
      await makeWritable(filePath);
    } else {
      expectedConversationFiles.add(fileName);
      await makeReadOnly(filePath);
    }

    graphNodes.push({
      ...common,
      author: node.author === 'user' ? 'user' : 'assistant',
      editable,
      contentFile: relativePath,
      contentHash: finalHash,
      textFormat: node.textFormat === 'latex' ? 'latex' : 'markdown',
      generating: Boolean(node.isGenerating),
      modelId: asTrimmedString(node.modelId) || null,
      attachments: normalizeAttachments(node.attachments),
      ...(normalizeCodexRef(node.codexRef) ? { codexRef: normalizeCodexRef(node.codexRef) } : {}),
    });
  }

  await removeStaleMarkdownFiles(documentsDir, expectedDocumentFiles);
  await removeStaleMarkdownFiles(conversationDir, expectedConversationFiles);

  const nodeIds = new Set(graphNodes.map((node) => node.id));
  const roots = graphNodes.filter((node) => !node.parentId || !nodeIds.has(node.parentId)).map((node) => node.id);
  const preview = chatPreview(
    nodes.map((node) => {
      const update = updates.find((item) => item.nodeId === asTrimmedString(node?.id));
      return update ? { ...node, content: update.content } : node;
    }),
  );
  const graph = {
    version: CONTEXT_VERSION,
    chat: {
      id: chatId,
      name: asTrimmedString(chat.chatName) || 'Untitled chat',
      folderPath: Array.isArray(chat.folderPath) ? chat.folderPath.map(asTrimmedString).filter(Boolean) : [],
      cwd,
    },
    roots,
    nodes: graphNodes,
  };

  await writeJsonIfChanged(path.join(chatDir, 'graph.json'), graph);
  await writeTextIfChanged(path.join(chatDir, 'README.md'), chatReadmeMarkdown(chat, nodes, preview, graph));

  return {
    entry: {
      chatId,
      chatName: asTrimmedString(chat.chatName) || 'Untitled chat',
      folderPath: Array.isArray(chat.folderPath) ? chat.folderPath.map(asTrimmedString).filter(Boolean) : [],
      preview,
    },
    updates,
    conflicts,
  };
}

async function pruneStaleChatDirectories(contextRoot, activeChatIds) {
  const chatsDir = path.join(contextRoot, 'chats');
  let entries = [];
  try {
    entries = await fs.readdir(chatsDir, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return;
    throw error;
  }
  const activeDirs = new Set(Array.from(activeChatIds, (chatId) => encodeSegment(chatId, 'chat')));
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory() || activeDirs.has(entry.name)) return;
      const graph = await readJsonOrNull(path.join(chatsDir, entry.name, 'graph.json'));
      if (Number(graph?.version) !== CONTEXT_VERSION || !asTrimmedString(graph?.chat?.id)) return;
      await fs.rm(path.join(chatsDir, entry.name), { recursive: true, force: true });
    }),
  );
}

async function syncConversationContext(request) {
  const chats = Array.isArray(request?.chats) ? request.chats : [];
  const groups = new Map();
  for (const chat of chats) {
    const cwdRaw = asTrimmedString(chat?.cwd);
    if (!cwdRaw || !path.isAbsolute(cwdRaw)) continue;
    const cwd = path.resolve(cwdRaw);
    const group = groups.get(cwd) ?? [];
    group.push({ ...chat, cwd });
    groups.set(cwd, group);
  }

  const updates = [];
  const conflicts = [];
  const roots = [];
  for (const [cwd, group] of groups.entries()) {
    const contextRoot = path.join(cwd, CONTEXT_DIRNAME);
    await fs.mkdir(path.join(contextRoot, 'chats'), { recursive: true });
    await writeTextIfChanged(path.join(contextRoot, 'AGENTS.md'), contextAgentsMarkdown());

    const entries = [];
    for (const chat of group) {
      const result = await syncChat(contextRoot, chat);
      entries.push(result.entry);
      updates.push(...result.updates);
      conflicts.push(...result.conflicts);
    }
    await pruneStaleChatDirectories(contextRoot, new Set(group.map((chat) => asTrimmedString(chat.chatId)).filter(Boolean)));
    await writeTextIfChanged(path.join(contextRoot, 'INDEX.md'), indexMarkdown(entries));
    roots.push(contextRoot);
  }

  return { updates, conflicts, roots };
}

module.exports = {
  CONTEXT_DIRNAME,
  contentHash,
  indexMarkdown,
  syncConversationContext,
};
