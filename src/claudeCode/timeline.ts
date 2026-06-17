import type {
  CodexEvent,
  CodexEventStatus,
  CodexTimelineItem,
  CodexTokenUsage,
  ThinkingSummaryChunk,
} from '../model/chat';

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function finiteNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function jsonDetail(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function statusFromClaude(value: unknown): CodexEventStatus {
  const status = clean(value).toLowerCase();
  if (status === 'completed' || status === 'success') return 'completed';
  if (status === 'interrupted' || status === 'canceled' || status === 'cancelled') return 'declined';
  if (status === 'warning') return 'warning';
  if (status === 'failed' || status === 'error') return 'failed';
  return 'completed';
}

function usageFromClaude(value: unknown): CodexTokenUsage | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as any;
  const input =
    finiteNumber(raw.input_tokens) ??
    finiteNumber(raw.inputTokens) ??
    finiteNumber(raw.input);
  const output =
    finiteNumber(raw.output_tokens) ??
    finiteNumber(raw.outputTokens) ??
    finiteNumber(raw.output);
  const cacheCreation =
    finiteNumber(raw.cache_creation_input_tokens) ??
    finiteNumber(raw.cacheCreationInputTokens);
  const cacheRead =
    finiteNumber(raw.cache_read_input_tokens) ??
    finiteNumber(raw.cacheReadInputTokens);
  const total = [input, output, cacheCreation, cacheRead]
    .filter((number): number is number => Number.isFinite(number))
    .reduce((sum, number) => sum + number, 0);
  const usage: CodexTokenUsage = {
    ...(input !== undefined ? { lastInputTokens: input } : {}),
    ...(output !== undefined ? { lastOutputTokens: output } : {}),
    ...(total > 0 ? { lastTotalTokens: total } : {}),
  };
  return Object.keys(usage).length ? usage : undefined;
}

function sameOrContained(current: string, next: string): string {
  const left = current.trim();
  const right = next.trim();
  if (!left) return next;
  if (!right) return current;
  if (left === right) return current;
  if (left.includes(right)) return current;
  if (right.includes(left)) return next;
  return `${current.trimEnd()}\n\n${next.trimStart()}`;
}

function upsertItem(
  timeline: CodexTimelineItem[] | null | undefined,
  item: CodexTimelineItem,
): CodexTimelineItem[] {
  const current = Array.isArray(timeline) ? timeline : [];
  const index = current.findIndex((entry) => entry.id === item.id);
  if (index < 0) return [...current, item];
  const next = current.slice();
  const previous = current[index];
  if (previous.kind === 'agent_message' && item.kind === 'agent_message') {
    next[index] = {
      ...previous,
      ...item,
      text: item.text || previous.text,
      phase: item.phase ?? previous.phase ?? null,
      startedAtMs: previous.startedAtMs ?? item.startedAtMs,
      completedAtMs: item.completedAtMs ?? previous.completedAtMs,
    };
    return next;
  }
  if (previous.kind === 'event' && item.kind === 'event') {
    next[index] = {
      ...previous,
      ...item,
      event: {
        ...previous.event,
        ...item.event,
        detail: item.event.detail ?? previous.event.detail,
        arguments: item.event.arguments ?? previous.event.arguments,
        tokenUsage: item.event.tokenUsage ?? previous.event.tokenUsage,
        startedAtMs: previous.event.startedAtMs ?? item.event.startedAtMs,
        completedAtMs: item.event.completedAtMs ?? previous.event.completedAtMs,
      },
    };
    return next;
  }
  next[index] = item;
  return next;
}

function patchAssistantMessage(
  timeline: CodexTimelineItem[] | null | undefined,
  patch: (current: Extract<CodexTimelineItem, { kind: 'agent_message' }> | null) => Extract<CodexTimelineItem, { kind: 'agent_message' }>,
): CodexTimelineItem[] {
  const current = Array.isArray(timeline) ? timeline : [];
  const id = 'claude-code:assistant-message';
  const index = current.findIndex((entry) => entry.id === id);
  const previous = index >= 0 && current[index].kind === 'agent_message' ? current[index] as Extract<CodexTimelineItem, { kind: 'agent_message' }> : null;
  const updated = patch(previous);
  if (index < 0) return [...current, updated];
  const next = current.slice();
  next[index] = updated;
  return next;
}

function reasoningItemId(event: any, index: unknown): string {
  const blockIndex = finiteNumber(index);
  return `claude-code:reasoning:${operationId(event)}:${blockIndex !== undefined ? blockIndex : 'current'}`;
}

function patchReasoningItem(
  timeline: CodexTimelineItem[] | null | undefined,
  itemId: string,
  patch: (current: Extract<CodexTimelineItem, { kind: 'reasoning' }> | null) => Extract<CodexTimelineItem, { kind: 'reasoning' }> | null,
): CodexTimelineItem[] {
  const current = Array.isArray(timeline) ? timeline : [];
  const index = current.findIndex((entry) => entry.id === itemId);
  const previous = index >= 0 && current[index].kind === 'reasoning'
    ? current[index] as Extract<CodexTimelineItem, { kind: 'reasoning' }>
    : null;
  const updated = patch(previous);
  if (!updated) return current;
  if (index < 0) return [...current, updated];
  const next = current.slice();
  next[index] = updated;
  return next;
}

function thinkingSummary(text: string, done: boolean): ThinkingSummaryChunk[] {
  return [{ summaryIndex: 0, text, done }];
}

function appendEventDetail(
  timeline: CodexTimelineItem[] | null | undefined,
  event: CodexEvent,
  detailDelta: string,
  limit = 8_000,
): CodexTimelineItem[] {
  const current = Array.isArray(timeline) ? timeline : [];
  const index = current.findIndex((entry) => entry.id === event.id && entry.kind === 'event');
  if (index < 0) {
    return upsertItem(current, {
      id: event.id,
      kind: 'event',
      event: {
        ...event,
        ...(detailDelta ? { detail: detailDelta.slice(-limit) } : {}),
      },
    });
  }
  const existing = current[index] as Extract<CodexTimelineItem, { kind: 'event' }>;
  const detail = `${existing.event.detail ?? ''}${detailDelta}`.slice(-limit);
  const next = current.slice();
  next[index] = {
    id: event.id,
    kind: 'event',
    event: {
      ...existing.event,
      ...event,
      detail,
      startedAtMs: existing.event.startedAtMs ?? event.startedAtMs,
      completedAtMs: event.completedAtMs ?? existing.event.completedAtMs,
    },
  };
  return next;
}

function operationId(event: any): string {
  return clean(event?.operationId) || 'current';
}

function eventMessageId(event: any): string {
  return clean(event?.messageId) || clean(event?.batchId) || operationId(event);
}

function eventBatchId(event: any): string {
  return clean(event?.batchId);
}

function toolUseIdFromEvent(event: any, fallbackName = 'tool'): string {
  const tool = event?.tool && typeof event.tool === 'object' ? event.tool : {};
  return clean(tool.id) || clean(event?.toolUseId) || `${operationId(event)}:${fallbackName}`;
}

function toolEventPrefix(batchId: string): string {
  return `claude-code:tool:${batchId}:`;
}

function toolEventId(event: any, toolUseId: string): string {
  const batchId = eventBatchId(event);
  return batchId ? `${toolEventPrefix(batchId)}${toolUseId}` : `claude-code:tool:${toolUseId}`;
}

function findToolEventId(
  timeline: CodexTimelineItem[] | null | undefined,
  event: any,
  toolUseId: string,
): string {
  const current = Array.isArray(timeline) ? timeline : [];
  const direct = toolEventId(event, toolUseId);
  if (current.some((item) => item.id === direct)) return direct;
  const suffix = `:${toolUseId}`;
  const match = current.find((item) => item.kind === 'event' && item.id.endsWith(suffix));
  return match?.id ?? direct;
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

function sentenceCase(text: string): string {
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : text;
}

function toolCategory(name: unknown): string {
  const tool = clean(name).toLowerCase();
  if (tool === 'read') return 'read';
  if (tool === 'grep') return 'grep';
  if (tool === 'bash' || tool === 'powershell') return 'shell';
  if (tool === 'glob') return 'glob';
  if (tool === 'edit' || tool === 'multiedit' || tool === 'write' || tool === 'notebookedit') return 'edit';
  if (tool === 'websearch') return 'web_search';
  if (tool === 'webfetch') return 'web_fetch';
  if (tool === 'task') return 'task';
  return tool ? `tool:${tool}` : 'tool';
}

function toolSummaryPhrase(category: string, count: number): string {
  if (category === 'read') return `read ${count} ${plural(count, 'file')}`;
  if (category === 'grep') return `searched for ${count} ${plural(count, 'pattern')}`;
  if (category === 'shell') return `ran ${count} shell ${plural(count, 'command')}`;
  if (category === 'glob') return `searched ${count} file ${plural(count, 'pattern')}`;
  if (category === 'edit') return `edited ${count} ${plural(count, 'file')}`;
  if (category === 'web_search') return `ran ${count} web ${plural(count, 'search', 'searches')}`;
  if (category === 'web_fetch') return `fetched ${count} web ${plural(count, 'page')}`;
  if (category === 'task') return `started ${count} ${plural(count, 'task')}`;
  if (category.startsWith('tool:')) {
    const tool = category.slice('tool:'.length);
    return `used ${count} ${tool} ${plural(count, 'tool call')}`;
  }
  return `used ${count} ${plural(count, 'tool')}`;
}

function syncToolBatchSummary(
  timeline: CodexTimelineItem[] | null | undefined,
  batchId: string,
): CodexTimelineItem[] {
  if (!batchId) return Array.isArray(timeline) ? timeline : [];
  const current = Array.isArray(timeline) ? timeline : [];
  const prefix = toolEventPrefix(batchId);
  const toolItems = current.filter(
    (item): item is Extract<CodexTimelineItem, { kind: 'event' }> =>
      item.kind === 'event' && item.id.startsWith(prefix) && item.event.kind === 'dynamic_tool',
  );
  if (toolItems.length === 0) return current;

  const counts = new Map<string, number>();
  for (const item of toolItems) {
    const key = toolCategory(item.event.tool);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const order = ['read', 'grep', 'shell', 'glob', 'edit', 'web_search', 'web_fetch', 'task'];
  const keys = Array.from(counts.keys()).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai >= 0 || bi >= 0) return (ai >= 0 ? ai : order.length) - (bi >= 0 ? bi : order.length);
    return a.localeCompare(b);
  });
  const text = sentenceCase(
    keys
      .map((key) => toolSummaryPhrase(key, counts.get(key) ?? 0))
      .join(', '),
  );
  if (!text) return current;

  const completed = toolItems.every((item) => item.event.status !== 'in_progress');
  const now = Date.now();
  const summary: Extract<CodexTimelineItem, { kind: 'agent_message' }> = {
    id: `claude-code:tool-summary:${batchId}`,
    kind: 'agent_message',
    status: completed ? 'completed' : 'in_progress',
    text,
    phase: 'commentary',
    startedAtMs: toolItems[0]?.event.startedAtMs ?? now,
    ...(completed ? { completedAtMs: now } : {}),
  };

  const existingIndex = current.findIndex((item) => item.id === summary.id);
  if (existingIndex >= 0) {
    const next = current.slice();
    const existing = current[existingIndex];
    next[existingIndex] =
      existing.kind === 'agent_message'
        ? {
            ...existing,
            ...summary,
            startedAtMs: existing.startedAtMs ?? summary.startedAtMs,
            completedAtMs: summary.completedAtMs ?? existing.completedAtMs,
          }
        : summary;
    return next;
  }

  const firstToolIndex = current.findIndex((item) => item.id.startsWith(prefix));
  const insertAt = firstToolIndex >= 0 ? firstToolIndex : current.length;
  const next = current.slice();
  next.splice(insertAt, 0, summary);
  return next;
}

function markOpenEvents(
  timeline: CodexTimelineItem[] | null | undefined,
  status: CodexEventStatus,
): CodexTimelineItem[] {
  const current = Array.isArray(timeline) ? timeline : [];
  let changed = false;
  const next = current.map((item) => {
    if (item.kind === 'agent_message') {
      if (item.status === 'completed') return item;
      changed = true;
      return { ...item, status: 'completed' as const, phase: item.phase ?? 'final_answer' };
    }
    if (item.kind === 'reasoning') {
      if (item.status === 'completed') return item;
      changed = true;
      return {
        ...item,
        status: 'completed' as const,
        summary: item.summary.map((part) => ({ ...part, done: true })),
      };
    }
    if (item.kind !== 'event' || item.event.status !== 'in_progress') return item;
    changed = true;
    return { ...item, event: { ...item.event, status } };
  });
  return changed ? next : current;
}

function completionEvent(event: any, status: CodexEventStatus): CodexEvent | null {
  const usage = usageFromClaude(event?.usage);
  const costUsd = finiteNumber(event?.costUsd);
  const error = clean(event?.error);
  if (!usage && costUsd === undefined && status === 'completed' && !error) return null;
  const detail = [
    costUsd !== undefined ? `Cost: $${costUsd.toFixed(4)}` : '',
    error ? `Error: ${error}` : '',
    event?.usage ? jsonDetail(event.usage) : '',
  ].filter(Boolean).join('\n\n');
  const tokenTotal = usage?.lastTotalTokens;
  return {
    id: `claude-code:completion:${operationId(event)}`,
    kind: usage ? 'token_usage' : status === 'failed' ? 'error' : 'warning',
    title: status === 'completed' ? 'Claude Code usage' : status === 'declined' ? 'Claude Code interrupted' : 'Claude Code failed',
    status,
    ...(tokenTotal !== undefined || costUsd !== undefined
      ? { subtitle: [tokenTotal !== undefined ? `${tokenTotal.toLocaleString()} tokens` : '', costUsd !== undefined ? `$${costUsd.toFixed(4)}` : ''].filter(Boolean).join(' / ') }
      : {}),
    ...(usage ? { tokenUsage: usage } : {}),
    ...(detail ? { detail } : {}),
  };
}

function applyRawStreamEvent(
  timeline: CodexTimelineItem[] | null | undefined,
  event: any,
  streamEvent: any,
): CodexTimelineItem[] {
  const type = clean(streamEvent?.type);
  const block = streamEvent?.content_block && typeof streamEvent.content_block === 'object'
    ? streamEvent.content_block
    : {};
  const blockType = clean(block?.type);
  const itemId = reasoningItemId(event, streamEvent?.index);
  const now = Date.now();

  if (type === 'content_block_start' && blockType === 'thinking') {
    const initial = typeof block.thinking === 'string' ? block.thinking : '';
    return patchReasoningItem(timeline, itemId, (current) => ({
      id: itemId,
      kind: 'reasoning',
      status: 'in_progress',
      summary: thinkingSummary(current?.summary?.[0]?.text ?? initial, false),
      startedAtMs: current?.startedAtMs ?? now,
    }));
  }

  if (type === 'content_block_delta') {
    const delta = streamEvent?.delta && typeof streamEvent.delta === 'object' ? streamEvent.delta : {};
    if (clean(delta.type) !== 'thinking_delta') return Array.isArray(timeline) ? timeline : [];
    const textDelta = typeof delta.thinking === 'string' ? delta.thinking : '';
    if (!textDelta) return Array.isArray(timeline) ? timeline : [];
    return patchReasoningItem(timeline, itemId, (current) => {
      const text = `${current?.summary?.[0]?.text ?? ''}${textDelta}`;
      return {
        id: itemId,
        kind: 'reasoning',
        status: 'in_progress',
        summary: thinkingSummary(text, false),
        startedAtMs: current?.startedAtMs ?? now,
      };
    });
  }

  if (type === 'content_block_stop') {
    return patchReasoningItem(timeline, itemId, (current) => {
      if (!current) return null;
      return {
        ...current,
        status: 'completed',
        summary: current.summary.map((part) => ({ ...part, done: true })),
        completedAtMs: current.completedAtMs ?? now,
      };
    });
  }

  return Array.isArray(timeline) ? timeline : [];
}

export function applyClaudeCodeTimelineEvent(
  timeline: CodexTimelineItem[] | null | undefined,
  event: unknown,
): CodexTimelineItem[] {
  const raw = event && typeof event === 'object' ? event as any : {};
  const kind = clean(raw.kind);
  const current = Array.isArray(timeline) ? timeline : [];

  if (kind === 'text-delta') {
    const delta = typeof raw.delta === 'string' ? raw.delta : '';
    if (!delta) return current;
    return patchAssistantMessage(current, (message) => ({
      id: 'claude-code:assistant-message',
      kind: 'agent_message',
      status: 'in_progress',
      text: `${message?.text ?? ''}${delta}`,
      phase: 'final_answer',
      startedAtMs: message?.startedAtMs ?? Date.now(),
    }));
  }

  if (kind === 'assistant-message') {
    const text = typeof raw.text === 'string' ? raw.text.trim() : '';
    if (!text) return current;
    return patchAssistantMessage(current, (message) => ({
      id: 'claude-code:assistant-message',
      kind: 'agent_message',
      status: 'in_progress',
      text: sameOrContained(message?.text ?? '', text),
      phase: 'final_answer',
      startedAtMs: message?.startedAtMs ?? Date.now(),
    }));
  }

  if (kind === 'assistant-progress') {
    const text = typeof raw.text === 'string' ? raw.text.trim() : '';
    if (!text) return current;
    const id = `claude-code:progress:${operationId(raw)}:${eventMessageId(raw)}`;
    return upsertItem(current, {
      id,
      kind: 'agent_message',
      status: 'completed',
      text,
      phase: 'commentary',
      startedAtMs: Date.now(),
      completedAtMs: Date.now(),
    });
  }

  if (kind === 'tool-use') {
    const tool = raw.tool && typeof raw.tool === 'object' ? raw.tool : {};
    const name = clean(tool.name) || 'tool';
    const id = toolUseIdFromEvent(raw, name);
    const eventId = toolEventId(raw, id);
    const next = upsertItem(current, {
      id: eventId,
      kind: 'event',
      event: {
        id: eventId,
        kind: 'dynamic_tool',
        title: `Called ${name}`,
        subtitle: 'Claude Code',
        status: 'in_progress',
        tool: name,
        server: 'Claude Code',
        startedAtMs: Date.now(),
        ...(tool.input !== undefined ? { arguments: tool.input } : {}),
      },
    });
    return syncToolBatchSummary(next, eventBatchId(raw));
  }

  if (kind === 'tool-result') {
    const result = raw.toolResult && typeof raw.toolResult === 'object' ? raw.toolResult : {};
    const toolUseId = clean(result.toolUseId) || clean(raw.toolUseId);
    if (!toolUseId) return current;
    const id = findToolEventId(current, raw, toolUseId);
    const content = typeof result.content === 'string' ? result.content.trim() : jsonDetail(result.content);
    const failed = Boolean(result.isError);
    const existing = current.find(
      (item): item is Extract<CodexTimelineItem, { kind: 'event' }> =>
        item.kind === 'event' && item.id === id,
    );
    const title = existing?.event.title ?? 'Completed tool';
    const tool = existing?.event.tool;
    const next = upsertItem(current, {
      id,
      kind: 'event',
      event: {
        id,
        kind: 'dynamic_tool',
        title,
        subtitle: existing?.event.subtitle ?? 'Claude Code',
        status: failed ? 'failed' : 'completed',
        server: existing?.event.server ?? 'Claude Code',
        ...(tool ? { tool } : {}),
        ...(existing?.event.arguments !== undefined ? { arguments: existing.event.arguments } : {}),
        ...(content ? { detail: content.slice(-8_000) } : {}),
        startedAtMs: existing?.event.startedAtMs,
        completedAtMs: Date.now(),
      },
    });
    return syncToolBatchSummary(next, eventBatchId(raw));
  }

  if (kind === 'permission-denied') {
    const toolName = clean(raw.toolName);
    return upsertItem(current, {
      id: `claude-code:permission-denied:${operationId(raw)}:${toolName || 'tool'}`,
      kind: 'event',
      event: {
        id: `claude-code:permission-denied:${operationId(raw)}:${toolName || 'tool'}`,
        kind: 'warning',
        title: 'Claude Code permission denied',
        status: 'declined',
        ...(toolName ? { subtitle: toolName } : {}),
        ...(clean(raw.message) ? { detail: clean(raw.message) } : {}),
      },
    });
  }

  if (kind === 'stderr') {
    const text = typeof raw.text === 'string' ? raw.text : '';
    if (!text.trim()) return current;
    const id = `claude-code:stderr:${operationId(raw)}`;
    return appendEventDetail(
      current,
      {
        id,
        kind: 'warning',
        title: 'Claude Code stderr',
        status: 'in_progress',
      },
      text,
    );
  }

  if (kind === 'protocol-error') {
    const id = `claude-code:protocol-error:${operationId(raw)}`;
    const detail = [clean(raw.error), clean(raw.line)].filter(Boolean).join('\n\n');
    return appendEventDetail(
      current,
      {
        id,
        kind: 'error',
        title: 'Claude Code stream parse error',
        status: 'warning',
      },
      detail ? `${detail}\n` : '',
    );
  }

  if (kind === 'turn-completed') {
    const status = statusFromClaude(raw.status);
    const text = typeof raw.result === 'string' ? raw.result.trim() : '';
    const withText = text
      ? patchAssistantMessage(current, (message) => ({
          id: 'claude-code:assistant-message',
          kind: 'agent_message',
          status: 'completed',
          text: sameOrContained(message?.text ?? '', text),
          phase: 'final_answer',
          startedAtMs: message?.startedAtMs,
          completedAtMs: Date.now(),
        }))
      : current;
    const marked = markOpenEvents(withText, status);
    const finalEvent = completionEvent(raw, status);
    return finalEvent ? upsertItem(marked, { id: finalEvent.id, kind: 'event', event: finalEvent }) : marked;
  }

  if (kind === 'message') {
    const message = raw.message && typeof raw.message === 'object' ? raw.message : {};
    if (clean(message.type) !== 'stream_event') return current;
    const streamEvent = message.event && typeof message.event === 'object' ? message.event : {};
    return applyRawStreamEvent(current, raw, streamEvent);
  }

  return current;
}
