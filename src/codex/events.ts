import type { CodexEvent, CodexEventFile, CodexEventKind, CodexEventStatus } from '../model/chat';

type EventTiming = {
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

function jsonDetail(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function statusFor(value: unknown, fallback: CodexEventStatus = 'completed'): CodexEventStatus {
  const status = clean(value).toLowerCase();
  if (status === 'inprogress' || status === 'in_progress' || status === 'running') return 'in_progress';
  if (status === 'completed' || status === 'success' || status === 'succeeded') return 'completed';
  if (status === 'failed' || status === 'error') return 'failed';
  if (status === 'declined' || status === 'denied') return 'declined';
  return fallback;
}

function fileKind(value: unknown): CodexEventFile['kind'] {
  const raw = clean(value).toLowerCase();
  if (raw === 'add' || raw === 'added' || raw === 'create' || raw === 'created') return 'add';
  if (raw === 'delete' || raw === 'deleted' || raw === 'remove' || raw === 'removed') return 'delete';
  if (raw === 'update' || raw === 'updated' || raw === 'modify' || raw === 'modified') return 'update';
  return 'unknown';
}

function normalizeFiles(value: unknown): CodexEventFile[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const files = value
    .map((entry): CodexEventFile | null => {
      if (!entry || typeof entry !== 'object') return null;
      const raw = entry as any;
      const path = clean(raw.path);
      const diff = typeof raw.diff === 'string' ? raw.diff : '';
      if (!path && !diff) return null;
      return {
        path: path || 'Changed file',
        kind: fileKind(raw.kind?.type ?? raw.kind),
        ...(diff ? { diff } : {}),
      };
    })
    .filter((entry): entry is CodexEventFile => Boolean(entry));
  return files.length ? files : undefined;
}

function eventBase(
  item: any,
  kind: CodexEventKind,
  title: string,
  status: CodexEventStatus,
  timing?: EventTiming,
): CodexEvent {
  return {
    id: clean(item?.id) || `${kind}:${title}`,
    kind,
    title,
    status,
    ...(finiteNumber(timing?.startedAtMs) !== undefined ? { startedAtMs: finiteNumber(timing?.startedAtMs) } : {}),
    ...(finiteNumber(timing?.completedAtMs) !== undefined ? { completedAtMs: finiteNumber(timing?.completedAtMs) } : {}),
  };
}

function actionSummary(action: unknown): string {
  if (!action || typeof action !== 'object') return '';
  const raw = action as any;
  const type = clean(raw.type);
  if (type === 'openPage') return clean(raw.url);
  if (type === 'findInPage') return [clean(raw.pattern), clean(raw.url)].filter(Boolean).join(' in ');
  if (type === 'search') {
    const queries = Array.isArray(raw.queries) ? raw.queries.map(clean).filter(Boolean) : [];
    return queries.join(', ') || clean(raw.query);
  }
  return '';
}

function collabTitle(tool: unknown): string {
  switch (clean(tool)) {
    case 'spawnAgent':
      return 'Spawned agent';
    case 'sendInput':
      return 'Sent input to agent';
    case 'resumeAgent':
      return 'Resumed agent';
    case 'wait':
      return 'Waited for agents';
    case 'closeAgent':
      return 'Closed agent';
    default:
      return 'Agent collaboration';
  }
}

export function codexEventFromThreadItem(item: unknown, timing?: EventTiming): CodexEvent | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as any;
  const type = clean(raw.type);
  const started = finiteNumber(timing?.startedAtMs) !== undefined && finiteNumber(timing?.completedAtMs) === undefined;
  const lifecycleStatus: CodexEventStatus = started ? 'in_progress' : 'completed';

  if (type === 'hookPrompt') {
    const fragments = Array.isArray(raw.fragments) ? raw.fragments : [];
    const detail = fragments.map((fragment: any) => clean(fragment?.text ?? fragment?.content)).filter(Boolean).join('\n\n');
    return { ...eventBase(raw, 'hook_prompt', 'Hook prompt', lifecycleStatus, timing), ...(detail ? { detail } : {}) };
  }

  if (type === 'plan') {
    const detail = typeof raw.text === 'string' ? raw.text : '';
    return { ...eventBase(raw, 'plan', 'Updated plan', lifecycleStatus, timing), ...(detail ? { detail } : {}) };
  }

  if (type === 'commandExecution') {
    const command = clean(raw.command);
    const output = typeof raw.aggregatedOutput === 'string' ? raw.aggregatedOutput : '';
    const status = statusFor(raw.status, lifecycleStatus);
    return {
      ...eventBase(raw, 'command', command ? `Ran ${command}` : 'Ran command', status, timing),
      ...(command ? { command } : {}),
      ...(clean(raw.cwd) ? { cwd: clean(raw.cwd) } : {}),
      ...(output ? { detail: output } : {}),
      ...(finiteNumber(raw.exitCode) !== undefined ? { exitCode: finiteNumber(raw.exitCode) } : {}),
      ...(finiteNumber(raw.durationMs) !== undefined ? { durationMs: finiteNumber(raw.durationMs) } : {}),
    };
  }

  if (type === 'fileChange') {
    const files = normalizeFiles(raw.changes);
    const count = files?.length ?? 0;
    return {
      ...eventBase(
        raw,
        'file_change',
        count ? `Changed ${count} file${count === 1 ? '' : 's'}` : 'Changed files',
        statusFor(raw.status, lifecycleStatus),
        timing,
      ),
      ...(files ? { files } : {}),
    };
  }

  if (type === 'mcpToolCall') {
    const server = clean(raw.server);
    const tool = clean(raw.tool);
    const result = raw.error ?? raw.result;
    return {
      ...eventBase(raw, 'mcp_tool', tool ? `Called ${tool}` : 'Called MCP tool', statusFor(raw.status, lifecycleStatus), timing),
      ...(server ? { subtitle: server } : {}),
      ...(tool ? { tool } : {}),
      ...(server ? { server } : {}),
      ...(raw.arguments !== undefined ? { arguments: raw.arguments } : {}),
      ...(result != null ? { detail: jsonDetail(result) } : {}),
      ...(finiteNumber(raw.durationMs) !== undefined ? { durationMs: finiteNumber(raw.durationMs) } : {}),
    };
  }

  if (type === 'dynamicToolCall') {
    const tool = clean(raw.tool);
    const namespace = clean(raw.namespace);
    const detail = Array.isArray(raw.contentItems) ? jsonDetail(raw.contentItems) : '';
    return {
      ...eventBase(raw, 'dynamic_tool', tool ? `Called ${tool}` : 'Called tool', statusFor(raw.status, lifecycleStatus), timing),
      ...(namespace ? { subtitle: namespace } : {}),
      ...(tool ? { tool } : {}),
      ...(namespace ? { server: namespace } : {}),
      ...(raw.arguments !== undefined ? { arguments: raw.arguments } : {}),
      ...(detail ? { detail } : {}),
      ...(finiteNumber(raw.durationMs) !== undefined ? { durationMs: finiteNumber(raw.durationMs) } : {}),
    };
  }

  if (type === 'collabAgentToolCall') {
    const receiverIds = Array.isArray(raw.receiverThreadIds) ? raw.receiverThreadIds.map(clean).filter(Boolean) : [];
    const prompt = clean(raw.prompt);
    return {
      ...eventBase(raw, 'collab_agent', collabTitle(raw.tool), statusFor(raw.status, lifecycleStatus), timing),
      ...(receiverIds.length ? { subtitle: `${receiverIds.length} agent${receiverIds.length === 1 ? '' : 's'}` } : {}),
      ...(prompt ? { detail: prompt } : {}),
      ...(clean(raw.tool) ? { tool: clean(raw.tool) } : {}),
    };
  }

  if (type === 'webSearch') {
    const query = clean(raw.query);
    const action = actionSummary(raw.action);
    return {
      ...eventBase(raw, 'web_search', query ? `Searched for ${query}` : 'Searched the web', lifecycleStatus, timing),
      ...(action && action !== query ? { subtitle: action } : {}),
      ...(query ? { query } : {}),
    };
  }

  if (type === 'imageView') {
    const path = clean(raw.path);
    return {
      ...eventBase(raw, 'image_view', path ? `Viewed ${path.split('/').pop() || path}` : 'Viewed image', lifecycleStatus, timing),
      ...(path ? { path } : {}),
    };
  }

  if (type === 'imageGeneration') {
    const path = clean(raw.savedPath);
    const prompt = clean(raw.revisedPrompt);
    return {
      ...eventBase(raw, 'image_generation', 'Generated image', statusFor(raw.status, lifecycleStatus), timing),
      ...(path ? { path } : {}),
      ...(prompt ? { detail: prompt } : {}),
    };
  }

  if (type === 'enteredReviewMode' || type === 'exitedReviewMode') {
    const entered = type === 'enteredReviewMode';
    const detail = clean(raw.review);
    return {
      ...eventBase(raw, entered ? 'review_entered' : 'review_exited', entered ? 'Entered review mode' : 'Exited review mode', lifecycleStatus, timing),
      ...(detail ? { detail } : {}),
    };
  }

  if (type === 'contextCompaction') {
    return eventBase(raw, 'context_compaction', 'Compacted context', lifecycleStatus, timing);
  }

  return null;
}

export function upsertCodexEvent(events: CodexEvent[] | null | undefined, event: CodexEvent): CodexEvent[] {
  const current = Array.isArray(events) ? events : [];
  const index = current.findIndex((entry) => entry.id === event.id);
  if (index < 0) return [...current, event];
  const next = current.slice();
  next[index] = { ...current[index], ...event };
  return next;
}

function patchEvent(
  events: CodexEvent[] | null | undefined,
  itemId: unknown,
  patch: Partial<CodexEvent>,
  fallback?: CodexEvent,
): CodexEvent[] {
  const id = clean(itemId);
  const current = Array.isArray(events) ? events : [];
  const index = current.findIndex((entry) => entry.id === id);
  if (index < 0) return fallback ? upsertCodexEvent(current, fallback) : current;
  const next = current.slice();
  next[index] = { ...next[index], ...patch };
  return next;
}

function appendDetail(current: string | undefined, delta: unknown): string {
  const text = typeof delta === 'string' ? delta : '';
  return text ? `${current ?? ''}${text}` : current ?? '';
}

export function applyCodexEventNotification(
  events: CodexEvent[] | null | undefined,
  method: unknown,
  params: unknown,
): CodexEvent[] {
  const name = clean(method);
  const raw = params && typeof params === 'object' ? (params as any) : {};

  if (name === 'item/started' || name === 'item/completed') {
    const event = codexEventFromThreadItem(raw.item, {
      ...(name === 'item/started' ? { startedAtMs: finiteNumber(raw.startedAtMs) } : {}),
      ...(name === 'item/completed' ? { completedAtMs: finiteNumber(raw.completedAtMs) } : {}),
    });
    return event ? upsertCodexEvent(events, event) : Array.isArray(events) ? events : [];
  }

  if (name === 'item/commandExecution/outputDelta' || name === 'item/plan/delta') {
    const itemId = clean(raw.itemId);
    const current = (Array.isArray(events) ? events : []).find((entry) => entry.id === itemId);
    const kind: CodexEventKind = name.includes('commandExecution') ? 'command' : 'plan';
    const fallback: CodexEvent = {
      id: itemId || `${kind}-stream`,
      kind,
      title: kind === 'command' ? 'Running command' : 'Updating plan',
      status: 'in_progress',
      detail: typeof raw.delta === 'string' ? raw.delta : '',
    };
    return patchEvent(events, itemId, { detail: appendDetail(current?.detail, raw.delta), status: 'in_progress' }, fallback);
  }

  if (name === 'item/fileChange/patchUpdated') {
    const files = normalizeFiles(raw.changes);
    const count = files?.length ?? 0;
    const fallback: CodexEvent = {
      id: clean(raw.itemId) || 'file-change-stream',
      kind: 'file_change',
      title: count ? `Changing ${count} file${count === 1 ? '' : 's'}` : 'Changing files',
      status: 'in_progress',
      ...(files ? { files } : {}),
    };
    return patchEvent(
      events,
      raw.itemId,
      {
        status: 'in_progress',
        title: fallback.title,
        ...(files ? { files } : {}),
      },
      fallback,
    );
  }

  if (name === 'item/mcpToolCall/progress') {
    const itemId = clean(raw.itemId);
    const current = (Array.isArray(events) ? events : []).find((entry) => entry.id === itemId);
    return patchEvent(events, itemId, {
      status: 'in_progress',
      detail: appendDetail(current?.detail, current?.detail ? `\n${clean(raw.message)}` : clean(raw.message)),
    });
  }

  return Array.isArray(events) ? events : [];
}

export function codexEventsFromThreadItems(items: unknown): CodexEvent[] | undefined {
  if (!Array.isArray(items)) return undefined;
  const events = items
    .map((item) => codexEventFromThreadItem(item))
    .filter((event): event is CodexEvent => Boolean(event));
  return events.length ? events : undefined;
}

export function normalizeCodexEvents(value: unknown): CodexEvent[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const events = value
    .map((entry): CodexEvent | null => {
      if (!entry || typeof entry !== 'object') return null;
      const raw = entry as any;
      const id = clean(raw.id);
      const kind = clean(raw.kind) as CodexEventKind;
      const title = clean(raw.title);
      if (!id || !kind || !title) return null;
      const files = normalizeFiles(raw.files);
      return {
        ...raw,
        id,
        kind,
        title,
        status: statusFor(raw.status, 'completed'),
        ...(files ? { files } : {}),
      } as CodexEvent;
    })
    .filter((event): event is CodexEvent => Boolean(event));
  return events.length ? events : undefined;
}

export function normalizeCodexEvent(value: unknown): CodexEvent | null {
  return normalizeCodexEvents([value])?.[0] ?? null;
}
