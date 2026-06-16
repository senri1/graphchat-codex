import type {
  CodexEvent,
  CodexEventStatus,
  CodexTimelineItem,
  CodexTokenUsage,
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

  if (kind === 'tool-use') {
    const tool = raw.tool && typeof raw.tool === 'object' ? raw.tool : {};
    const name = clean(tool.name) || 'tool';
    const id = clean(tool.id) || `${operationId(raw)}:${name}`;
    return upsertItem(current, {
      id: `claude-code:tool:${id}`,
      kind: 'event',
      event: {
        id: `claude-code:tool:${id}`,
        kind: 'dynamic_tool',
        title: `Called ${name}`,
        subtitle: 'Claude Code',
        status: 'in_progress',
        tool: name,
        server: 'Claude Code',
        ...(tool.input !== undefined ? { arguments: tool.input } : {}),
      },
    });
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

  return current;
}
