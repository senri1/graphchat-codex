#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const DEFAULT_CHAT_ID = 'chat_186774a9-e037-480d-a8a0-0f4e24b9f154';
const IMPORT_FOLDER_NAME = 'Imported from GraphChatV1';

function argValue(name, fallback = '') {
  const prefix = `--${name}=`;
  const entry = process.argv.find((arg) => arg.startsWith(prefix));
  return entry ? entry.slice(prefix.length).trim() : fallback;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(tempPath, filePath);
}

function findChat(item, chatId, folderPath = []) {
  if (!item || typeof item !== 'object') return null;
  if (item.kind === 'chat') {
    return item.id === chatId ? { name: String(item.name || 'Imported chat'), folderPath } : null;
  }
  if (item.kind !== 'folder') return null;
  const nextPath = item.id === 'root' ? folderPath : [...folderPath, String(item.name || 'Folder')];
  for (const child of Array.isArray(item.children) ? item.children : []) {
    const found = findChat(child, chatId, nextPath);
    if (found) return found;
  }
  return null;
}

function findFolder(item, name) {
  if (!item || item.kind !== 'folder') return null;
  if (String(item.name || '') === name) return item;
  for (const child of Array.isArray(item.children) ? item.children : []) {
    if (child?.kind !== 'folder') continue;
    const found = findFolder(child, name);
    if (found) return found;
  }
  return null;
}

function mergeStateNodes(primaryStateRecord, additionalStateRecord) {
  if (!additionalStateRecord) return { stateRecord: primaryStateRecord, addedNodeCount: 0 };
  const next = structuredClone(primaryStateRecord);
  const nodes = Array.isArray(next?.state?.nodes) ? next.state.nodes : [];
  const additionalNodes = Array.isArray(additionalStateRecord?.state?.nodes)
    ? additionalStateRecord.state.nodes
    : [];
  const existingIds = new Set(nodes.map((node) => String(node?.id || '')).filter(Boolean));
  let addedNodeCount = 0;
  for (const node of additionalNodes) {
    const id = String(node?.id || '').trim();
    if (!id || existingIds.has(id)) continue;
    nodes.push(structuredClone(node));
    existingIds.add(id);
    addedNodeCount += 1;
  }
  return { stateRecord: next, addedNodeCount };
}

function stripProviderData(stateRecord, nextChatId, now) {
  const next = structuredClone(stateRecord);
  next.chatId = nextChatId;
  next.updatedAt = now;
  const nodes = Array.isArray(next?.state?.nodes) ? next.state.nodes : [];
  const nodeById = new Map(nodes.map((node) => [String(node?.id || ''), node]));
  const removedNodeIds = new Set(
    nodes
      .filter((node) => node?.kind === 'pdf')
      .map((node) => String(node?.id || ''))
      .filter(Boolean),
  );
  const resolveKeptParentId = (parentId) => {
    let currentId = typeof parentId === 'string' ? parentId : null;
    const seen = new Set();
    while (currentId && removedNodeIds.has(currentId)) {
      if (seen.has(currentId)) return null;
      seen.add(currentId);
      const parent = nodeById.get(currentId);
      currentId = typeof parent?.parentId === 'string' ? parent.parentId : null;
    }
    return currentId;
  };
  let droppedAttachmentCount = 0;
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    droppedAttachmentCount += Array.isArray(node.attachments) ? node.attachments.length : 0;
    node.parentId = resolveKeptParentId(node.parentId);
    node.attachments = [];
    delete node.apiRequest;
    delete node.apiRequestKey;
    delete node.apiResponse;
    delete node.apiResponseKey;
    delete node.canonicalMeta;
    delete node.thinkingSummary;
    delete node.llmTask;
    delete node.latexCompiledAt;
    delete node.latexCompileLog;
    delete node.latexCompileError;
    node.isGenerating = false;
  }
  next.state.nodes = nodes.filter((node) => !removedNodeIds.has(String(node?.id || '')));
  return {
    stateRecord: next,
    droppedAttachmentCount,
    droppedNodeCount: removedNodeIds.size,
  };
}

function stateContainsNode(stateRecord, nodeId) {
  const id = String(nodeId || '').trim();
  if (!id) return false;
  return Boolean(stateRecord?.state?.nodes?.some((node) => node?.id === id));
}

async function copyBackground(args) {
  const key = String(args.backgroundKey || '').trim();
  if (!key) return null;

  const sourceMetaPath = path.join(args.sourceRoot, 'Blobs', 'meta', `${encodeURIComponent(key)}.json`);
  const sourceDataPath = path.join(args.sourceRoot, 'Blobs', 'data', `${encodeURIComponent(key)}.bin`);
  const destinationMetaPath = path.join(args.destinationRoot, 'Blobs', 'meta', `${encodeURIComponent(key)}.json`);
  const destinationDataPath = path.join(args.destinationRoot, 'Blobs', 'data', `${encodeURIComponent(key)}.bin`);

  const sourceMeta = await readJson(sourceMetaPath).catch(() => null);
  const sourceData = await fs.readFile(sourceDataPath).catch(() => null);
  if (!sourceMeta || !sourceData) return null;

  await fs.mkdir(path.dirname(destinationMetaPath), { recursive: true });
  await fs.mkdir(path.dirname(destinationDataPath), { recursive: true });
  await fs.writeFile(destinationMetaPath, `${JSON.stringify(sourceMeta, null, 2)}\n`, { flag: 'wx' }).catch(async (error) => {
    if (error?.code !== 'EEXIST') throw error;
  });
  await fs.writeFile(destinationDataPath, sourceData, { flag: 'wx' }).catch(async (error) => {
    if (error?.code !== 'EEXIST') throw error;
  });
  return sourceMeta;
}

async function main() {
  const home = os.homedir();
  const chatId = argValue('chat-id', DEFAULT_CHAT_ID);
  const sourceRoot = path.resolve(
    argValue(
      'source-root',
      path.join(home, 'Library', 'Application Support', 'Electron', 'GraphChatV1Data', 'v1'),
    ),
  );
  const destinationRoot = path.resolve(
    argValue(
      'destination-root',
      path.join(home, 'Library', 'Application Support', 'GraphChat Codex', 'GraphChatCodexData', 'v1'),
    ),
  );
  const mergeStateChatId = argValue('merge-state-chat-id');

  const sourceWorkspacePath = path.join(sourceRoot, 'Workspace', 'workspace.json');
  const destinationWorkspacePath = path.join(destinationRoot, 'Workspace', 'workspace.json');
  const sourceWorkspace = await readJson(sourceWorkspacePath);
  const destinationWorkspace = await readJson(destinationWorkspacePath);
  const sourceChat = findChat(sourceWorkspace.root, chatId);
  if (!sourceChat) throw new Error(`Chat ${chatId} is not present in the GraphChatV1 workspace.`);

  const destinationChatIds = [];
  const collectDestinationChats = (item) => {
    if (!item || typeof item !== 'object') return;
    if (item.kind === 'chat') {
      destinationChatIds.push(item.id);
      return;
    }
    for (const child of Array.isArray(item.children) ? item.children : []) collectDestinationChats(child);
  };
  collectDestinationChats(destinationWorkspace.root);
  for (const destinationChatId of destinationChatIds) {
    const metaPath = path.join(destinationRoot, 'Chats', encodeURIComponent(destinationChatId), 'meta.json');
    const record = await readJson(metaPath).catch(() => null);
    if (record?.meta?.legacyImport?.sourceChatId === chatId) {
      console.log(JSON.stringify({ imported: false, reason: 'already-imported', chatId: destinationChatId }, null, 2));
      return;
    }
  }

  const sourceStatePath = path.join(sourceRoot, 'Chats', encodeURIComponent(chatId), 'state.json');
  const sourceMetaPath = path.join(sourceRoot, 'Chats', encodeURIComponent(chatId), 'meta.json');
  const [sourceStateRecord, sourceMetaRecord, additionalStateRecord] = await Promise.all([
    readJson(sourceStatePath),
    readJson(sourceMetaPath),
    mergeStateChatId
      ? readJson(path.join(sourceRoot, 'Chats', encodeURIComponent(mergeStateChatId), 'state.json'))
      : Promise.resolve(null),
  ]);

  const backupRoot = path.join(
    path.dirname(path.dirname(destinationRoot)),
    'LegacyMigrationBackups',
    `before-${chatId}-${timestamp()}`,
  );
  await fs.mkdir(path.dirname(backupRoot), { recursive: true });
  await fs.cp(destinationRoot, backupRoot, { recursive: true, errorOnExist: true });

  const now = Date.now();
  const nextChatId = `chat_${crypto.randomUUID()}`;
  const destinationChatRoot = path.join(destinationRoot, 'Chats', encodeURIComponent(nextChatId));
  const merged = mergeStateNodes(sourceStateRecord, additionalStateRecord);
  const stripped = stripProviderData(merged.stateRecord, nextChatId, now);
  const nextStateRecord = stripped.stateRecord;
  const nextMetaRecord = structuredClone(sourceMetaRecord);
  nextMetaRecord.chatId = nextChatId;
  nextMetaRecord.updatedAt = now;
  nextMetaRecord.meta = nextMetaRecord.meta && typeof nextMetaRecord.meta === 'object' ? nextMetaRecord.meta : {};
  const workingFolderPath =
    argValue('cwd') ||
    String(destinationWorkspace?.codex?.defaultWorkingFolderPath || '').trim() ||
    path.join(home, '.graphchat-codex', 'threads');
  const workingFolderStat = await fs.stat(workingFolderPath).catch(() => null);
  if (!workingFolderStat?.isDirectory()) {
    throw new Error(`Codex working folder is unavailable: ${workingFolderPath}`);
  }
  nextMetaRecord.meta.codexWorkingFolderPath = workingFolderPath;
  nextMetaRecord.meta.draftAttachments = [];
  nextMetaRecord.meta.selectedAttachmentKeys = [];
  if (!stateContainsNode(nextStateRecord, nextMetaRecord.meta.headNodeId)) {
    nextMetaRecord.meta.headNodeId = null;
  }
  if (Array.isArray(nextMetaRecord.meta.turns)) {
    nextMetaRecord.meta.turns = nextMetaRecord.meta.turns.map((turn) => ({
      ...turn,
      attachmentNodeIds: [],
    }));
  }
  nextMetaRecord.meta.legacyImport = {
    source: 'graphchatv1',
    sourceChatId: chatId,
    importedAt: now,
  };
  delete nextMetaRecord.meta.codexImportedThreadId;
  delete nextMetaRecord.meta.codexImportedUpdatedAt;

  const backgroundKey = String(nextMetaRecord.meta.backgroundStorageKey || '').trim();
  const backgroundMeta = await copyBackground({
    sourceRoot,
    destinationRoot,
    backgroundKey,
  });
  if (backgroundKey && !backgroundMeta) nextMetaRecord.meta.backgroundStorageKey = null;

  await Promise.all([
    writeJsonAtomic(path.join(destinationChatRoot, 'state.json'), nextStateRecord),
    writeJsonAtomic(path.join(destinationChatRoot, 'meta.json'), nextMetaRecord),
  ]);

  let importFolder = findFolder(destinationWorkspace.root, IMPORT_FOLDER_NAME);
  if (!importFolder) {
    importFolder = {
      kind: 'folder',
      id: `folder_${crypto.randomUUID()}`,
      name: IMPORT_FOLDER_NAME,
      expanded: true,
      children: [],
    };
    destinationWorkspace.root.children.unshift(importFolder);
  }
  importFolder.expanded = true;
  importFolder.children.push({
    kind: 'chat',
    id: nextChatId,
    name: `${sourceChat.name} (legacy)`,
  });
  destinationWorkspace.activeChatId = nextChatId;
  destinationWorkspace.focusedFolderId = importFolder.id;
  destinationWorkspace.updatedAt = now;

  if (backgroundMeta) {
    const library = Array.isArray(destinationWorkspace.backgroundLibrary)
      ? destinationWorkspace.backgroundLibrary
      : [];
    if (!library.some((entry) => entry?.storageKey === backgroundKey)) {
      const sourceEntry = (Array.isArray(sourceWorkspace.backgroundLibrary) ? sourceWorkspace.backgroundLibrary : [])
        .find((entry) => entry?.storageKey === backgroundKey);
      library.push(
        sourceEntry || {
          id: backgroundKey,
          storageKey: backgroundKey,
          name: String(backgroundMeta.name || 'Imported background'),
          createdAt: now,
          mimeType: backgroundMeta.mimeType,
          size: backgroundMeta.size,
        },
      );
    }
    destinationWorkspace.backgroundLibrary = library;
  }

  await writeJsonAtomic(destinationWorkspacePath, destinationWorkspace);

  console.log(JSON.stringify({
    imported: true,
    sourceChatId: chatId,
    chatId: nextChatId,
    name: `${sourceChat.name} (legacy)`,
    destinationRoot,
    backupRoot,
    backgroundCopied: Boolean(backgroundMeta),
    workingFolderPath,
    mergedStateChatId: mergeStateChatId || null,
    recoveredNodeCount: merged.addedNodeCount,
    droppedAttachmentCount: stripped.droppedAttachmentCount,
    droppedNodeCount: stripped.droppedNodeCount,
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
