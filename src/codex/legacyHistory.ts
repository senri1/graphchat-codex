import type { ChatNode } from '../model/chat';

export type CodexInjectedMessage = {
  type: 'message';
  role: 'user' | 'assistant';
  content: Array<{
    type: 'input_text' | 'output_text';
    text: string;
  }>;
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function visibleTextForNode(node: Extract<ChatNode, { kind: 'text' }>): string {
  if (node.author !== 'user') return clean(node.content);

  const parts: string[] = [];
  const replyTo = clean(node.userPreface?.replyTo);
  if (replyTo) parts.push(`Selected context to reply to:\n${replyTo}`);

  const contexts = Array.isArray(node.userPreface?.contexts)
    ? node.userPreface.contexts.map(clean).filter(Boolean)
    : [];
  if (contexts.length) {
    parts.push(contexts.map((text, index) => `Additional context ${index + 1}:\n${text}`).join('\n\n'));
  }

  const content = clean(node.content);
  if (content) parts.push(content);
  return parts.join('\n\n');
}

function isStoppedAssistantResponse(node: Extract<ChatNode, { kind: 'text' }>): boolean {
  if (node.author !== 'assistant') return false;
  const error = clean(node.llmError).toLowerCase();
  return (
    error === 'canceled' ||
    error === 'cancelled' ||
    error === 'codex turn interrupted.' ||
    error.startsWith('interrupted ')
  );
}

export function isLegacyContinuationNode(
  node: ChatNode | null | undefined,
): node is Extract<ChatNode, { kind: 'text' }> {
  return Boolean(
    node?.kind === 'text' &&
      !node.conversationDraft &&
      !node.isGenerating &&
      (!node.llmError || isStoppedAssistantResponse(node)) &&
      visibleTextForNode(node),
  );
}

export function buildLegacyHistory(nodes: ChatNode[], endNodeId: string): CodexInjectedMessage[] {
  const endId = clean(endNodeId);
  if (!endId) throw new Error('Legacy history endpoint is missing.');

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const reversedPath: ChatNode[] = [];
  const visited = new Set<string>();
  let currentId: string | null = endId;

  while (currentId) {
    if (visited.has(currentId)) throw new Error('Legacy graph contains a parent cycle.');
    visited.add(currentId);

    const node = nodeById.get(currentId);
    if (!node) throw new Error(`Legacy graph is missing node ${currentId}.`);
    reversedPath.push(node);
    currentId = clean(node.parentId) || null;
  }

  const history: CodexInjectedMessage[] = [];
  for (const node of reversedPath.reverse()) {
    if (node.kind !== 'text') continue;
    if (node.author === 'assistant' && node.llmError && !isStoppedAssistantResponse(node)) {
      throw new Error('The selected imported branch contains a failed assistant response.');
    }
    const text = visibleTextForNode(node);
    if (!text) continue;

    const role = node.author;
    const contentType = role === 'user' ? 'input_text' : 'output_text';
    const previous = history[history.length - 1];
    if (previous?.role === role) {
      previous.content[0].text = `${previous.content[0].text}\n\n${text}`;
      continue;
    }

    history.push({
      type: 'message',
      role,
      content: [{ type: contentType, text }],
    });
  }

  return history;
}
