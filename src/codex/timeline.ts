import type {
  CodexEvent,
  CodexTimelineItem,
  ThinkingSummaryChunk,
} from '../model/chat';
import {
  applyCodexEventNotification,
  codexEventFromThreadItem,
  normalizeCodexEvent,
} from './events.ts';

type ItemTiming = {
  startedAtMs?: number | null;
  completedAtMs?: number | null;
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function finiteNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function phaseFor(value: unknown): 'commentary' | 'final_answer' | null {
  return value === 'commentary' || value === 'final_answer' ? value : null;
}

function timelineStatus(timing?: ItemTiming): 'in_progress' | 'completed' {
  return finiteNumber(timing?.completedAtMs) !== undefined ? 'completed' : 'in_progress';
}

function timingFields(timing?: ItemTiming): {
  startedAtMs?: number;
  completedAtMs?: number;
} {
  const startedAtMs = finiteNumber(timing?.startedAtMs);
  const completedAtMs = finiteNumber(timing?.completedAtMs);
  return {
    ...(startedAtMs !== undefined ? { startedAtMs } : {}),
    ...(completedAtMs !== undefined ? { completedAtMs } : {}),
  };
}

function reasoningSummary(value: unknown, done: boolean): ThinkingSummaryChunk[] {
  if (!Array.isArray(value)) return [];
  return value.map((text, summaryIndex) => ({
    summaryIndex,
    text: typeof text === 'string' ? text : String(text ?? ''),
    done,
  }));
}

export function codexTimelineItemFromThreadItem(
  item: unknown,
  timing?: ItemTiming,
): CodexTimelineItem | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as any;
  const type = clean(raw.type);
  const status = timelineStatus(timing);
  const id = clean(raw.id) || `${type || 'item'}:${clean(raw.text) || 'unknown'}`;

  if (type === 'agentMessage') {
    return {
      id,
      kind: 'agent_message',
      status,
      text: typeof raw.text === 'string' ? raw.text : '',
      phase: phaseFor(raw.phase),
      ...timingFields(timing),
    };
  }

  if (type === 'reasoning') {
    return {
      id,
      kind: 'reasoning',
      status,
      summary: reasoningSummary(raw.summary, status === 'completed'),
      ...timingFields(timing),
    };
  }

  const event = codexEventFromThreadItem(item, timing);
  return event ? { id: event.id, kind: 'event', event } : null;
}

function mergeTimelineItem(current: CodexTimelineItem, next: CodexTimelineItem): CodexTimelineItem {
  if (current.kind !== next.kind) return next;

  if (current.kind === 'agent_message' && next.kind === 'agent_message') {
    return {
      ...current,
      ...next,
      text: next.text || current.text,
      phase: next.phase ?? current.phase ?? null,
      startedAtMs: current.startedAtMs ?? next.startedAtMs,
      completedAtMs: next.completedAtMs ?? current.completedAtMs,
    };
  }

  if (current.kind === 'reasoning' && next.kind === 'reasoning') {
    return {
      ...current,
      ...next,
      summary: next.summary.length ? next.summary : current.summary,
      startedAtMs: current.startedAtMs ?? next.startedAtMs,
      completedAtMs: next.completedAtMs ?? current.completedAtMs,
    };
  }

  if (current.kind === 'event' && next.kind === 'event') {
    return {
      ...current,
      ...next,
      event: {
        ...current.event,
        ...next.event,
        startedAtMs: current.event.startedAtMs ?? next.event.startedAtMs,
        completedAtMs: next.event.completedAtMs ?? current.event.completedAtMs,
      },
    };
  }

  return next;
}

export function upsertCodexTimelineItem(
  timeline: CodexTimelineItem[] | null | undefined,
  item: CodexTimelineItem,
): CodexTimelineItem[] {
  const current = Array.isArray(timeline) ? timeline : [];
  const index = current.findIndex((entry) => entry.id === item.id);
  if (index < 0) return [...current, item];
  const next = current.slice();
  next[index] = mergeTimelineItem(current[index], item);
  return next;
}

function patchTimelineItem(
  timeline: CodexTimelineItem[] | null | undefined,
  itemId: unknown,
  patch: (current: CodexTimelineItem | null) => CodexTimelineItem | null,
): CodexTimelineItem[] {
  const current = Array.isArray(timeline) ? timeline : [];
  const id = clean(itemId);
  const index = current.findIndex((entry) => entry.id === id);
  const updated = patch(index >= 0 ? current[index] : null);
  if (!updated) return current;
  if (index < 0) return [...current, updated];
  const next = current.slice();
  next[index] = updated;
  return next;
}

function ensureReasoningSummary(
  current: CodexTimelineItem | null,
  itemId: string,
  summaryIndex: number,
): Extract<CodexTimelineItem, { kind: 'reasoning' }> {
  const reasoning =
    current?.kind === 'reasoning'
      ? current
      : {
          id: itemId,
          kind: 'reasoning' as const,
          status: 'in_progress' as const,
          summary: [],
        };
  const summary = reasoning.summary.slice();
  while (summary.length <= summaryIndex) {
    summary.push({ summaryIndex: summary.length, text: '', done: false });
  }
  return { ...reasoning, status: 'in_progress', summary };
}

function applyEventsToTimeline(
  timeline: CodexTimelineItem[],
  updatedEvents: CodexEvent[],
): CodexTimelineItem[] {
  const byId = new Map(updatedEvents.map((event) => [event.id, event]));
  const consumed = new Set<string>();
  let changed = false;
  const next = timeline.map((item) => {
    if (item.kind !== 'event') return item;
    const event = byId.get(item.id);
    if (!event) {
      changed = true;
      return null;
    }
    consumed.add(event.id);
    if (event !== item.event) changed = true;
    return { id: event.id, kind: 'event' as const, event };
  }).filter((item): item is CodexTimelineItem => Boolean(item));

  for (const event of updatedEvents) {
    if (consumed.has(event.id)) continue;
    next.push({ id: event.id, kind: 'event', event });
    changed = true;
  }
  return changed ? next : timeline;
}

export function applyCodexTimelineNotification(
  timeline: CodexTimelineItem[] | null | undefined,
  method: unknown,
  params: unknown,
): CodexTimelineItem[] {
  const name = clean(method);
  const raw = params && typeof params === 'object' ? (params as any) : {};
  const current = Array.isArray(timeline) ? timeline : [];

  if (name === 'item/started' || name === 'item/completed') {
    const item = codexTimelineItemFromThreadItem(raw.item, {
      ...(name === 'item/started' ? { startedAtMs: raw.startedAtMs } : {}),
      ...(name === 'item/completed' ? { completedAtMs: raw.completedAtMs } : {}),
    });
    if (!item) return current;
    if (item.kind !== 'event') return upsertCodexTimelineItem(current, item);
    const existingEvents = current
      .filter((entry): entry is Extract<CodexTimelineItem, { kind: 'event' }> => entry.kind === 'event')
      .map((entry) => entry.event);
    const updatedEvents = applyCodexEventNotification(existingEvents, name, raw);
    return applyEventsToTimeline(current, updatedEvents);
  }

  if (name === 'item/agentMessage/delta') {
    const itemId = clean(raw.itemId) || 'agent-message-stream';
    const delta = typeof raw.delta === 'string' ? raw.delta : '';
    if (!delta) return current;
    return patchTimelineItem(current, itemId, (existing) => {
      const message =
        existing?.kind === 'agent_message'
          ? existing
          : {
              id: itemId,
              kind: 'agent_message' as const,
              status: 'in_progress' as const,
              text: '',
              phase: null,
            };
      return { ...message, status: 'in_progress', text: message.text + delta };
    });
  }

  if (name === 'item/reasoning/summaryPartAdded') {
    const itemId = clean(raw.itemId) || 'reasoning-stream';
    const summaryIndex = Math.max(0, Math.floor(finiteNumber(raw.summaryIndex) ?? 0));
    return patchTimelineItem(current, itemId, (existing) =>
      ensureReasoningSummary(existing, itemId, summaryIndex),
    );
  }

  if (name === 'item/reasoning/summaryTextDelta') {
    const itemId = clean(raw.itemId) || 'reasoning-stream';
    const summaryIndex = Math.max(0, Math.floor(finiteNumber(raw.summaryIndex) ?? 0));
    const delta = typeof raw.delta === 'string' ? raw.delta : '';
    if (!delta) return current;
    return patchTimelineItem(current, itemId, (existing) => {
      const reasoning = ensureReasoningSummary(existing, itemId, summaryIndex);
      const summary = reasoning.summary.slice();
      const part = summary[summaryIndex] ?? { summaryIndex, text: '', done: false };
      summary[summaryIndex] = { ...part, text: part.text + delta, done: false };
      return { ...reasoning, summary };
    });
  }

  const existingEvents = current
    .filter((item): item is Extract<CodexTimelineItem, { kind: 'event' }> => item.kind === 'event')
    .map((item) => item.event);
  const updatedEvents = applyCodexEventNotification(existingEvents, name, raw);
  return updatedEvents === existingEvents ? current : applyEventsToTimeline(current, updatedEvents);
}

export function codexTimelineFromThreadItems(items: unknown): CodexTimelineItem[] | undefined {
  if (!Array.isArray(items)) return undefined;
  const timeline = items
    .map((item) =>
      codexTimelineItemFromThreadItem(item, {
        completedAtMs: 0,
      }),
    )
    .filter((item): item is CodexTimelineItem => Boolean(item));
  return timeline.length ? timeline : undefined;
}

export function portableAssistantTextFromCodexTimeline(
  timeline: CodexTimelineItem[] | null | undefined,
): string {
  const messages = (Array.isArray(timeline) ? timeline : [])
    .filter(
      (item): item is Extract<CodexTimelineItem, { kind: 'agent_message' }> =>
        item.kind === 'agent_message' && Boolean(item.text.trim()),
    );
  const finalMessages = messages.filter((item) => item.phase === 'final_answer');
  return (finalMessages.length ? finalMessages : messages)
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join('\n\n');
}

export function thinkingSummaryFromCodexTimeline(
  timeline: CodexTimelineItem[] | null | undefined,
): ThinkingSummaryChunk[] | undefined {
  const summaries = (Array.isArray(timeline) ? timeline : [])
    .filter(
      (item): item is Extract<CodexTimelineItem, { kind: 'reasoning' }> =>
        item.kind === 'reasoning',
    )
    .flatMap((item) =>
      item.summary
        .slice()
        .sort((a, b) => a.summaryIndex - b.summaryIndex)
        .filter((part) => Boolean(part.text.trim()))
        .map((part) => ({
          summaryIndex: 0,
          text: part.text,
          done: item.status === 'completed' || part.done,
        })),
    )
    .map((part, summaryIndex) => ({ ...part, summaryIndex }));
  return summaries.length ? summaries : undefined;
}

export function normalizeCodexTimeline(value: unknown): CodexTimelineItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const timeline = value
    .map((entry): CodexTimelineItem | null => {
      if (!entry || typeof entry !== 'object') return null;
      const raw = entry as any;
      const id = clean(raw.id);
      if (!id) return null;

      if (raw.kind === 'agent_message') {
        return {
          id,
          kind: 'agent_message',
          status: raw.status === 'completed' ? 'completed' : 'in_progress',
          text: typeof raw.text === 'string' ? raw.text : '',
          phase: phaseFor(raw.phase),
          ...timingFields(raw),
        };
      }

      if (raw.kind === 'reasoning') {
        const summary = Array.isArray(raw.summary)
          ? raw.summary
              .map((part: any, index: number) => {
                const summaryIndex = finiteNumber(part?.summaryIndex) ?? index;
                const text = typeof part?.text === 'string' ? part.text : String(part?.text ?? '');
                return {
                  summaryIndex: Math.max(0, Math.floor(summaryIndex)),
                  text,
                  done: Boolean(part?.done),
                };
              })
          : [];
        return {
          id,
          kind: 'reasoning',
          status: raw.status === 'completed' ? 'completed' : 'in_progress',
          summary,
          ...timingFields(raw),
        };
      }

      if (raw.kind === 'event') {
        const event = normalizeCodexEvent(raw.event);
        return event ? { id: event.id, kind: 'event', event } : null;
      }

      return null;
    })
    .filter((item): item is CodexTimelineItem => Boolean(item));
  return timeline.length ? timeline : undefined;
}

export function codexEventsFromTimeline(
  timeline: CodexTimelineItem[] | null | undefined,
): CodexEvent[] | undefined {
  const events = (Array.isArray(timeline) ? timeline : [])
    .filter((item): item is Extract<CodexTimelineItem, { kind: 'event' }> => item.kind === 'event')
    .map((item) => item.event);
  return events.length ? events : undefined;
}
