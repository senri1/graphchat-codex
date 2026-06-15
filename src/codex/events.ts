import type {
  CodexEvent,
  CodexEventFile,
  CodexEventKind,
  CodexEventStatus,
  CodexPlanStep,
  CodexTokenUsage,
} from '../model/chat';

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
  if (status === 'declined' || status === 'denied' || status === 'blocked' || status === 'stopped') return 'declined';
  if (status === 'warning') return 'warning';
  return fallback;
}

function humanize(value: unknown): string {
  const raw = clean(value);
  if (!raw) return '';
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());
}

function planSteps(value: unknown): CodexPlanStep[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const steps = value
    .map((entry): CodexPlanStep | null => {
      if (!entry || typeof entry !== 'object') return null;
      const raw = entry as any;
      const step = clean(raw.step);
      if (!step) return null;
      const status =
        raw.status === 'completed'
          ? 'completed'
          : raw.status === 'inProgress' || raw.status === 'in_progress'
            ? 'in_progress'
            : 'pending';
      return { step, status };
    })
    .filter((entry): entry is CodexPlanStep => Boolean(entry));
  return steps.length ? steps : undefined;
}

function tokenUsage(value: unknown): CodexTokenUsage | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as any;
  const last = raw.last && typeof raw.last === 'object' ? raw.last : {};
  const total = raw.total && typeof raw.total === 'object' ? raw.total : {};
  const usage: CodexTokenUsage = {
    ...(finiteNumber(last.inputTokens) !== undefined ? { lastInputTokens: finiteNumber(last.inputTokens) } : {}),
    ...(finiteNumber(last.outputTokens) !== undefined ? { lastOutputTokens: finiteNumber(last.outputTokens) } : {}),
    ...(finiteNumber(last.reasoningOutputTokens) !== undefined
      ? { lastReasoningTokens: finiteNumber(last.reasoningOutputTokens) }
      : {}),
    ...(finiteNumber(last.totalTokens) !== undefined ? { lastTotalTokens: finiteNumber(last.totalTokens) } : {}),
    ...(finiteNumber(total.totalTokens) !== undefined ? { totalTokens: finiteNumber(total.totalTokens) } : {}),
    ...(finiteNumber(raw.modelContextWindow) !== undefined
      ? { modelContextWindow: finiteNumber(raw.modelContextWindow) }
      : {}),
  };
  return Object.keys(usage).length ? usage : undefined;
}

function hookDetail(run: any): string {
  const lines: string[] = [];
  if (clean(run?.statusMessage)) lines.push(clean(run.statusMessage));
  for (const entry of Array.isArray(run?.entries) ? run.entries : []) {
    const text = clean(entry?.text);
    if (!text) continue;
    const kind = humanize(entry?.kind);
    lines.push(kind ? `${kind}: ${text}` : text);
  }
  return lines.join('\n');
}

function approvalActionSummary(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const raw = value as any;
  switch (clean(raw.type)) {
    case 'command':
      return clean(raw.command);
    case 'execve':
      return [clean(raw.program), ...(Array.isArray(raw.argv) ? raw.argv.map(clean).filter(Boolean) : [])].join(' ');
    case 'applyPatch':
      return `${Array.isArray(raw.files) ? raw.files.length : 0} file change`;
    case 'networkAccess':
      return [clean(raw.protocol), clean(raw.target || raw.host)].filter(Boolean).join(' ');
    case 'mcpToolCall':
      return [clean(raw.server), clean(raw.toolTitle || raw.toolName)].filter(Boolean).join(' / ');
    case 'requestPermissions':
      return clean(raw.reason) || 'Additional permissions';
    default:
      return '';
  }
}

function approvalReviewStatus(value: unknown): CodexEventStatus {
  switch (clean(value)) {
    case 'inProgress':
      return 'in_progress';
    case 'approved':
      return 'completed';
    case 'denied':
      return 'declined';
    case 'timedOut':
    case 'aborted':
      return 'failed';
    default:
      return 'in_progress';
  }
}

function warningId(method: string, raw: any): string {
  return `${method}:${clean(raw?.turnId) || clean(raw?.threadId) || 'global'}:${clean(
    raw?.message || raw?.summary || raw?.error?.message,
  )}`;
}

function semanticEventIndex(events: CodexEvent[], kind: CodexEventKind, syntheticPrefix?: string): number {
  const exact = events.findIndex((event) => event.kind === kind && (!syntheticPrefix || event.id.startsWith(syntheticPrefix)));
  if (exact >= 0 || syntheticPrefix) return exact;
  return events.findIndex((event) => event.kind === kind);
}

function upsertSemanticEvent(
  events: CodexEvent[] | null | undefined,
  event: CodexEvent,
  syntheticPrefix?: string,
): CodexEvent[] {
  const current = Array.isArray(events) ? events : [];
  const direct = current.findIndex((entry) => entry.id === event.id);
  const index = direct >= 0 ? direct : semanticEventIndex(current, event.kind, syntheticPrefix);
  if (index < 0) return [...current, event];
  const next = current.slice();
  next[index] = {
    ...current[index],
    ...event,
    id: direct >= 0 ? event.id : current[index].id,
    startedAtMs: current[index].startedAtMs ?? event.startedAtMs,
    completedAtMs: event.completedAtMs ?? current[index].completedAtMs,
    steps: event.steps ?? current[index].steps,
    terminalInput: event.terminalInput ?? current[index].terminalInput,
    tokenUsage: event.tokenUsage ?? current[index].tokenUsage,
  };
  return next;
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
    if (!event) return Array.isArray(events) ? events : [];
    if (event.kind === 'plan') return upsertSemanticEvent(events, event, 'turn-plan:');
    if (event.kind === 'context_compaction') {
      return upsertSemanticEvent(events, event, 'context-compaction:');
    }
    return upsertCodexEvent(events, event);
  }

  if (name === 'item/commandExecution/outputDelta' || name === 'item/plan/delta') {
    const itemId = clean(raw.itemId);
    const kind: CodexEventKind = name.includes('commandExecution') ? 'command' : 'plan';
    const allEvents = Array.isArray(events) ? events : [];
    const current =
      allEvents.find((entry) => entry.id === itemId) ??
      (kind === 'plan' ? allEvents.find((entry) => entry.kind === 'plan') : undefined);
    const targetId = current?.id || itemId;
    const fallback: CodexEvent = {
      id: targetId || `${kind}-stream`,
      kind,
      title: kind === 'command' ? 'Running command' : 'Updating plan',
      status: 'in_progress',
      detail: typeof raw.delta === 'string' ? raw.delta : '',
    };
    return patchEvent(events, targetId, { detail: appendDetail(current?.detail, raw.delta), status: 'in_progress' }, fallback);
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

  if (name === 'item/commandExecution/terminalInteraction') {
    const itemId = clean(raw.itemId);
    const stdin = typeof raw.stdin === 'string' ? raw.stdin : '';
    if (!itemId || !stdin) return Array.isArray(events) ? events : [];
    const current = (Array.isArray(events) ? events : []).find((entry) => entry.id === itemId);
    const terminalInput = [...(current?.terminalInput ?? []), stdin];
    return patchEvent(events, itemId, { terminalInput, status: 'in_progress' });
  }

  if (name === 'turn/plan/updated') {
    const steps = planSteps(raw.plan);
    const completed = steps?.filter((step) => step.status === 'completed').length ?? 0;
    const total = steps?.length ?? 0;
    const explanation = clean(raw.explanation);
    const event: CodexEvent = {
      id: `turn-plan:${clean(raw.turnId) || 'current'}`,
      kind: 'plan',
      title: 'Updated plan',
      status: total > 0 && completed === total ? 'completed' : 'in_progress',
      ...(total ? { subtitle: `${completed}/${total} complete` } : {}),
      ...(explanation ? { detail: explanation } : {}),
      ...(steps ? { steps } : {}),
    };
    return upsertSemanticEvent(events, event);
  }

  if (name === 'turn/diff/updated') {
    const detail = typeof raw.diff === 'string' ? raw.diff : '';
    const changedFiles = Array.from(detail.matchAll(/^diff --git /gm)).length;
    return upsertCodexEvent(events, {
      id: `turn-diff:${clean(raw.turnId) || 'current'}`,
      kind: 'turn_diff',
      title: 'Updated turn diff',
      status: 'in_progress',
      ...(changedFiles ? { subtitle: `${changedFiles} file${changedFiles === 1 ? '' : 's'}` } : {}),
      ...(detail ? { detail } : {}),
    });
  }

  if (name === 'hook/started' || name === 'hook/completed') {
    const run = raw.run && typeof raw.run === 'object' ? raw.run : {};
    const eventName = humanize(run.eventName) || 'Hook';
    const completed = name === 'hook/completed';
    const detail = hookDetail(run);
    const source = humanize(run.source);
    const handler = humanize(run.handlerType);
    return upsertCodexEvent(events, {
      id: clean(run.id) || `hook:${eventName}`,
      kind: 'hook',
      title: `${completed ? 'Ran' : 'Running'} ${eventName} hook`,
      status: statusFor(run.status, completed ? 'completed' : 'in_progress'),
      ...([handler, source].filter(Boolean).length ? { subtitle: [handler, source].filter(Boolean).join(' / ') } : {}),
      ...(detail ? { detail } : {}),
      ...(clean(run.sourcePath) ? { path: clean(run.sourcePath) } : {}),
      ...(finiteNumber(run.startedAt) !== undefined ? { startedAtMs: finiteNumber(run.startedAt) } : {}),
      ...(finiteNumber(run.completedAt) !== undefined ? { completedAtMs: finiteNumber(run.completedAt) } : {}),
      ...(finiteNumber(run.durationMs) !== undefined ? { durationMs: finiteNumber(run.durationMs) } : {}),
    });
  }

  if (name === 'item/autoApprovalReview/started' || name === 'item/autoApprovalReview/completed') {
    const review = raw.review && typeof raw.review === 'object' ? raw.review : {};
    const action = approvalActionSummary(raw.action);
    const rationale = clean(review.rationale);
    const risk = humanize(review.riskLevel);
    return upsertCodexEvent(events, {
      id: `approval-review:${clean(raw.reviewId) || clean(raw.targetItemId) || 'current'}`,
      kind: 'approval_review',
      title: name.endsWith('/started') ? 'Reviewing approval request' : humanize(review.status) || 'Reviewed approval request',
      status: approvalReviewStatus(review.status),
      ...(risk ? { subtitle: `${risk} risk` } : action ? { subtitle: action } : {}),
      ...([action, rationale].filter(Boolean).length ? { detail: [action, rationale].filter(Boolean).join('\n\n') } : {}),
      ...(finiteNumber(raw.startedAtMs) !== undefined ? { startedAtMs: finiteNumber(raw.startedAtMs) } : {}),
      ...(finiteNumber(raw.completedAtMs) !== undefined ? { completedAtMs: finiteNumber(raw.completedAtMs) } : {}),
    });
  }

  if (name === 'thread/tokenUsage/updated') {
    const usage = tokenUsage(raw.tokenUsage);
    const latest = usage?.lastTotalTokens;
    const window = usage?.modelContextWindow;
    return upsertCodexEvent(events, {
      id: `token-usage:${clean(raw.turnId) || 'current'}`,
      kind: 'token_usage',
      title: 'Updated context usage',
      status: 'completed',
      ...(latest !== undefined && window !== undefined ? { subtitle: `${latest.toLocaleString()} / ${window.toLocaleString()}` } : {}),
      ...(usage ? { tokenUsage: usage } : {}),
    });
  }

  if (name === 'model/rerouted') {
    const from = clean(raw.fromModel);
    const to = clean(raw.toModel);
    return upsertCodexEvent(events, {
      id: `model-reroute:${clean(raw.turnId) || 'current'}`,
      kind: 'model_reroute',
      title: 'Model rerouted',
      status: 'warning',
      ...([from, to].filter(Boolean).length ? { subtitle: [from, to].filter(Boolean).join(' to ') } : {}),
      ...(clean(raw.reason) ? { detail: humanize(raw.reason) } : {}),
    });
  }

  if (name === 'model/verification') {
    const verifications = Array.isArray(raw.verifications) ? raw.verifications.map(humanize).filter(Boolean) : [];
    return upsertCodexEvent(events, {
      id: `model-verification:${clean(raw.turnId) || 'current'}`,
      kind: 'model_verification',
      title: 'Verified model access',
      status: 'completed',
      ...(verifications.length ? { detail: verifications.join('\n') } : {}),
    });
  }

  if (name === 'warning' || name === 'guardianWarning') {
    const message = clean(raw.message);
    if (!message) return Array.isArray(events) ? events : [];
    return upsertCodexEvent(events, {
      id: warningId(name, raw),
      kind: 'warning',
      title: name === 'guardianWarning' ? 'Safety warning' : 'Codex warning',
      status: 'warning',
      detail: message,
    });
  }

  if (name === 'error') {
    const message = clean(raw.error?.message);
    if (!message) return Array.isArray(events) ? events : [];
    return upsertCodexEvent(events, {
      id: warningId(name, raw),
      kind: 'error',
      title: raw.willRetry ? 'Codex error, retrying' : 'Codex error',
      status: raw.willRetry ? 'warning' : 'failed',
      detail: [message, clean(raw.error?.additionalDetails)].filter(Boolean).join('\n\n'),
    });
  }

  if (name === 'thread/compacted') {
    return upsertSemanticEvent(
      events,
      {
        id: `context-compaction:${clean(raw.turnId) || 'current'}`,
        kind: 'context_compaction',
        title: 'Compacted context',
        status: 'completed',
      },
      'context-compaction:',
    );
  }

  if (name === 'turn/completed') {
    const turnStatus = clean(raw.turn?.status);
    const finalStatus: CodexEventStatus =
      turnStatus === 'failed'
        ? 'failed'
        : turnStatus === 'interrupted'
          ? 'declined'
          : 'completed';
    const current = Array.isArray(events) ? events : [];
    let changed = false;
    const next = current.map((event) => {
      if (event.status !== 'in_progress') return event;
      changed = true;
      return {
        ...event,
        status: finalStatus,
        ...(finiteNumber(raw.turn?.completedAt) !== undefined
          ? { completedAtMs: Number(raw.turn.completedAt) * 1000 }
          : {}),
      };
    });
    return changed ? next : current;
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
      const steps = planSteps(raw.steps);
      const terminalInput = Array.isArray(raw.terminalInput)
        ? raw.terminalInput.map((entry: unknown) => (typeof entry === 'string' ? entry : '')).filter(Boolean)
        : undefined;
      const usage = tokenUsage(
        raw.tokenUsage
          ? {
              last: {
                inputTokens: raw.tokenUsage.lastInputTokens,
                outputTokens: raw.tokenUsage.lastOutputTokens,
                reasoningOutputTokens: raw.tokenUsage.lastReasoningTokens,
                totalTokens: raw.tokenUsage.lastTotalTokens,
              },
              total: { totalTokens: raw.tokenUsage.totalTokens },
              modelContextWindow: raw.tokenUsage.modelContextWindow,
            }
          : undefined,
      );
      return {
        ...raw,
        id,
        kind,
        title,
        status: statusFor(raw.status, 'completed'),
        ...(files ? { files } : {}),
        ...(steps ? { steps } : {}),
        ...(terminalInput?.length ? { terminalInput } : {}),
        ...(usage ? { tokenUsage: usage } : {}),
      } as CodexEvent;
    })
    .filter((event): event is CodexEvent => Boolean(event));
  return events.length ? events : undefined;
}

export function normalizeCodexEvent(value: unknown): CodexEvent | null {
  return normalizeCodexEvents([value])?.[0] ?? null;
}
