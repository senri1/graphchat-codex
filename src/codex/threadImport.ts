import type { WorldEngineChatState } from '../engine/WorldEngine';
import type { ChatNode, CodexConversationRef, ThinkingSummaryChunk } from '../model/chat';
import { codexEventsFromThreadItems } from './events.ts';

export type CodexThreadSummary = {
  id: string;
  sessionId?: string;
  forkedFromId?: string | null;
  preview?: string;
  name?: string | null;
  cwd: string;
  source?: unknown;
  modelProvider?: string;
  createdAt?: number;
  updatedAt?: number;
  status?: { type?: string } | null;
};

export type CodexThreadTurn = {
  id: string;
  items?: any[];
  status?: string;
  error?: any;
  startedAt?: number | null;
  completedAt?: number | null;
  durationMs?: number | null;
};

export type CodexThreadDetail = CodexThreadSummary & {
  turns?: CodexThreadTurn[];
};

export type CodexImportPayload = {
  key: string;
  json: unknown;
};

export type CodexThreadMergeResult = {
  state: WorldEngineChatState;
  turns: Array<{
    id: string;
    createdAt: number;
    userNodeId: string;
    assistantNodeId: string;
    attachmentNodeIds: string[];
  }>;
  headNodeId: string | null;
  payloads: CodexImportPayload[];
  importedTurnCount: number;
  addedTurnCount: number;
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function stablePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-');
}

function importedNodeIds(threadId: string, turnId: string): { userNodeId: string; assistantNodeId: string } {
  const thread = stablePart(threadId);
  const turn = stablePart(turnId);
  return {
    userNodeId: `codex-u-${thread}-${turn}`,
    assistantNodeId: `codex-a-${thread}-${turn}`,
  };
}

function userTextForTurn(turn: CodexThreadTurn): string {
  const messages = (Array.isArray(turn.items) ? turn.items : []).filter((item) => item?.type === 'userMessage');
  const parts: string[] = [];
  for (const message of messages) {
    for (const input of Array.isArray(message?.content) ? message.content : []) {
      if (input?.type === 'text' && clean(input.text)) {
        parts.push(clean(input.text));
      } else if (input?.type === 'image' && clean(input.url)) {
        parts.push(`[Image: ${clean(input.url)}]`);
      } else if (input?.type === 'localImage' && clean(input.path)) {
        parts.push(`[Local image: ${clean(input.path)}]`);
      } else if ((input?.type === 'skill' || input?.type === 'mention') && clean(input.name)) {
        parts.push(`[@${clean(input.name)}]`);
      }
    }
  }
  return parts.join('\n\n').trim() || '(Codex turn)';
}

function assistantMessagesForTurn(turn: CodexThreadTurn): Array<{ text: string; phase: string | null }> {
  return (Array.isArray(turn.items) ? turn.items : [])
    .filter((item) => item?.type === 'agentMessage' && clean(item.text))
    .map((item) => ({
      text: clean(item.text),
      phase: clean(item.phase) || null,
    }));
}

function assistantTextForTurn(turn: CodexThreadTurn): string {
  const messages = assistantMessagesForTurn(turn);
  const finals = messages.filter((message) => message.phase === 'final_answer');
  const selected = finals.length ? finals : messages;
  if (selected.length) return selected.map((message) => message.text).join('\n\n');
  if (turn.status === 'failed') {
    return clean(turn.error?.message) || 'Codex turn failed.';
  }
  if (turn.status === 'interrupted') return 'Codex turn interrupted.';
  return '(No assistant message recorded)';
}

function reasoningForTurn(turn: CodexThreadTurn): ThinkingSummaryChunk[] | undefined {
  const summaries = (Array.isArray(turn.items) ? turn.items : [])
    .filter((item) => item?.type === 'reasoning')
    .flatMap((item) => (Array.isArray(item?.summary) ? item.summary : []))
    .map((text) => clean(text))
    .filter(Boolean);
  if (!summaries.length) return undefined;
  return summaries.map((text, summaryIndex) => ({ summaryIndex, text, done: true }));
}

function estimatedHeight(text: string, author: 'user' | 'assistant', eventCount = 0): number {
  const explicitLines = Math.max(1, text.split('\n').length);
  const wrappedLines = Math.ceil(text.length / 66);
  const lines = Math.max(explicitLines, wrappedLines);
  const min = author === 'user' ? 120 : 150;
  return Math.max(min, Math.min(620, 70 + lines * 19 + Math.max(0, eventCount) * 34));
}

function nodeWithPreservedRect(next: ChatNode, previous: ChatNode | null): ChatNode {
  if (!previous || previous.kind !== next.kind) return next;
  if (next.kind === 'text' && previous.kind === 'text' && next.author === 'assistant') {
    return {
      ...next,
      rect: { ...previous.rect },
      title: previous.title || next.title,
      modelId: previous.modelId ?? next.modelId,
      codexRef: previous.codexRef ? { ...next.codexRef, ...previous.codexRef } : next.codexRef,
      expandedCodexEvents: previous.expandedCodexEvents,
    };
  }
  return { ...next, rect: { ...previous.rect } } as ChatNode;
}

function findExistingTurnNodes(
  nodes: ChatNode[],
  threadId: string,
  turnId: string,
): { userNode: Extract<ChatNode, { kind: 'text' }> | null; assistantNode: Extract<ChatNode, { kind: 'text' }> | null } {
  const assistantNode =
    nodes.find(
      (node): node is Extract<ChatNode, { kind: 'text' }> =>
        node.kind === 'text' &&
        node.author === 'assistant' &&
        node.codexRef?.threadId === threadId &&
        node.codexRef?.turnId === turnId,
    ) ??
    nodes.find(
      (node): node is Extract<ChatNode, { kind: 'text' }> =>
        node.kind === 'text' && node.author === 'assistant' && node.codexRef?.turnId === turnId,
    ) ??
    null;
  const userNode =
    assistantNode && assistantNode.parentId
      ? (nodes.find(
          (node): node is Extract<ChatNode, { kind: 'text' }> =>
            node.kind === 'text' && node.author === 'user' && node.id === assistantNode.parentId,
        ) ?? null)
      : null;
  return { userNode, assistantNode };
}

export function codexThreadDisplayName(thread: CodexThreadSummary): string {
  const explicit = clean(thread.name);
  const preview = clean(thread.preview).replace(/\s+/g, ' ');
  const raw = explicit || preview || 'Codex thread';
  return raw.length > 72 ? `${raw.slice(0, 69).trimEnd()}...` : raw;
}

export function mergeCodexThreadIntoChat(
  existingState: WorldEngineChatState | null,
  thread: CodexThreadDetail,
  chatId: string,
): CodexThreadMergeResult {
  const originalNodes = Array.isArray(existingState?.nodes) ? existingState.nodes : [];
  const nodeById = new Map(originalNodes.map((node) => [node.id, node]));
  const importedNodes: ChatNode[] = [];
  const importedIds = new Set<string>();
  const turnMeta: CodexThreadMergeResult['turns'] = [];
  const payloads: CodexImportPayload[] = [];
  const cwd = clean(thread.cwd);
  const threadId = clean(thread.id);
  let previousAssistantId: string | null = null;
  let y = 100;
  let addedTurnCount = 0;

  for (const turn of Array.isArray(thread.turns) ? thread.turns : []) {
    const turnId = clean(turn?.id);
    if (!turnId) continue;
    const deterministic = importedNodeIds(threadId, turnId);
    const existing = findExistingTurnNodes(originalNodes, threadId, turnId);
    const userNodeId = existing.userNode?.id || deterministic.userNodeId;
    const assistantNodeId = existing.assistantNode?.id || deterministic.assistantNodeId;
    if (!existing.assistantNode) addedTurnCount += 1;

    const userText = userTextForTurn(turn);
    const assistantText = assistantTextForTurn(turn);
    const codexEvents = codexEventsFromThreadItems(turn.items);
    const userHeight = estimatedHeight(userText, 'user');
    const assistantHeight = estimatedHeight(assistantText, 'assistant', codexEvents?.length ?? 0);
    const codexRef: CodexConversationRef = {
      threadId,
      turnId,
      cwd,
      ...(thread.forkedFromId ? { forkedFromThreadId: thread.forkedFromId } : {}),
    };
    const responseKey = `${chatId}/${assistantNodeId}/res`;

    const userNode: ChatNode = {
      kind: 'text',
      id: userNodeId,
      title: 'User',
      parentId: previousAssistantId,
      rect: { x: 120, y, w: 460, h: userHeight },
      author: 'user',
      content: userText,
      textFormat: 'markdown',
    };
    y += userHeight + 30;

    const assistantNode: ChatNode = {
      kind: 'text',
      id: assistantNodeId,
      title: 'Codex',
      parentId: userNodeId,
      rect: { x: 120, y, w: 520, h: assistantHeight },
      author: 'assistant',
      content: assistantText,
      textFormat: 'markdown',
      modelId: null,
      llmError: turn.status === 'failed' ? clean(turn.error?.message) || 'Codex turn failed.' : null,
      canonicalMessage: assistantText ? { role: 'assistant', text: assistantText } : undefined,
      canonicalMeta: {
        runtime: 'codex',
        imported: true,
        threadId,
        turnId,
        status: turn.status ?? null,
        agentMessages: assistantMessagesForTurn(turn),
      },
      apiResponseKey: responseKey,
      codexRef,
      codexEvents,
      thinkingSummary: reasoningForTurn(turn),
      summaryExpanded: false,
    };
    y += assistantHeight + 54;

    const preservedUser = nodeWithPreservedRect(userNode, nodeById.get(userNodeId) ?? null);
    const preservedAssistant = nodeWithPreservedRect(assistantNode, nodeById.get(assistantNodeId) ?? null);
    importedNodes.push(preservedUser, preservedAssistant);
    importedIds.add(userNodeId);
    importedIds.add(assistantNodeId);
    previousAssistantId = assistantNodeId;

    turnMeta.push({
      id: turnId,
      createdAt: Number.isFinite(Number(turn.startedAt)) ? Number(turn.startedAt) * 1000 : Date.now(),
      userNodeId,
      assistantNodeId,
      attachmentNodeIds: [],
    });
    payloads.push({
      key: responseKey,
      json: {
        runtime: 'codex',
        thread: {
          id: threadId,
          cwd,
          sessionId: thread.sessionId ?? null,
          forkedFromId: thread.forkedFromId ?? null,
          source: thread.source ?? null,
        },
        turn,
      },
    });
  }

  const localNodes = originalNodes.filter((node) => !importedIds.has(node.id));
  const importedNodeIdPrefixes = [`codex-u-${stablePart(threadId)}-`, `codex-a-${stablePart(threadId)}-`];
  const retainedLocalNodes = localNodes.filter(
    (node) => !importedNodeIdPrefixes.some((prefix) => node.id.startsWith(prefix)),
  );

  return {
    state: {
      camera: existingState?.camera ?? { x: 0, y: 0, zoom: 0.85 },
      nodes: [...importedNodes, ...retainedLocalNodes],
      worldInkStrokes: existingState?.worldInkStrokes ?? [],
      pdfStates: existingState?.pdfStates ?? [],
    },
    turns: turnMeta,
    headNodeId: previousAssistantId,
    payloads,
    importedTurnCount: turnMeta.length,
    addedTurnCount,
  };
}
