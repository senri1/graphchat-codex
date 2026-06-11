import type { ChatNode } from '../model/chat';

export type CodexThreadLinkOrigin = 'created' | 'imported' | 'forked' | 'legacy';

export type CodexThreadLink = {
  threadId: string;
  cwd: string;
  origin: CodexThreadLinkOrigin;
  forkedFromThreadId?: string;
  forkedFromTurnId?: string;
  lastSeenUpdatedAt?: number;
};

export type CodexThreadLinks = Record<string, CodexThreadLink>;

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function origin(value: unknown): CodexThreadLinkOrigin | null {
  if (value === 'created' || value === 'imported' || value === 'forked' || value === 'legacy') {
    return value;
  }
  return null;
}

function timestamp(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizedLink(value: unknown, fallbackThreadId = ''): CodexThreadLink | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const threadId = clean(raw.threadId) || clean(fallbackThreadId);
  const cwd = clean(raw.cwd);
  const linkOrigin = origin(raw.origin);
  if (!threadId || !cwd || !linkOrigin) return null;
  const forkedFromThreadId = clean(raw.forkedFromThreadId);
  const forkedFromTurnId = clean(raw.forkedFromTurnId);
  const lastSeenUpdatedAt = timestamp(raw.lastSeenUpdatedAt);
  return {
    threadId,
    cwd,
    origin: forkedFromThreadId ? 'forked' : linkOrigin,
    ...(forkedFromThreadId ? { forkedFromThreadId } : {}),
    ...(forkedFromTurnId ? { forkedFromTurnId } : {}),
    ...(lastSeenUpdatedAt ? { lastSeenUpdatedAt } : {}),
  };
}

export function upsertCodexThreadLink(
  links: CodexThreadLinks,
  value: CodexThreadLink,
): CodexThreadLinks {
  const incoming = normalizedLink(value);
  if (!incoming) return links;
  const existing = normalizedLink(links[incoming.threadId], incoming.threadId);
  const forkedFromThreadId = incoming.forkedFromThreadId || existing?.forkedFromThreadId;
  const forkedFromTurnId = incoming.forkedFromTurnId || existing?.forkedFromTurnId;
  const lastSeenUpdatedAt = Math.max(
    incoming.lastSeenUpdatedAt ?? 0,
    existing?.lastSeenUpdatedAt ?? 0,
  );
  const next: CodexThreadLink = {
    threadId: incoming.threadId,
    cwd: incoming.cwd || existing?.cwd || '',
    origin: forkedFromThreadId ? 'forked' : existing?.origin ?? incoming.origin,
    ...(forkedFromThreadId ? { forkedFromThreadId } : {}),
    ...(forkedFromTurnId ? { forkedFromTurnId } : {}),
    ...(lastSeenUpdatedAt > 0 ? { lastSeenUpdatedAt } : {}),
  };
  return Object.fromEntries([...Object.entries(links), [next.threadId, next]]);
}

export function normalizeCodexThreadLinks(args: {
  rawLinks?: unknown;
  nodes?: ChatNode[];
  workingFolder?: unknown;
  legacyImportedThreadId?: unknown;
  legacyImportedUpdatedAt?: unknown;
}): CodexThreadLinks {
  let links: CodexThreadLinks = {};
  const rawLinks =
    args.rawLinks && typeof args.rawLinks === 'object' && !Array.isArray(args.rawLinks)
      ? (args.rawLinks as Record<string, unknown>)
      : {};

  for (const [key, value] of Object.entries(rawLinks)) {
    const link = normalizedLink(value, key);
    if (link) links = upsertCodexThreadLink(links, link);
  }

  const workingFolder = clean(args.workingFolder);
  const importedThreadId = clean(args.legacyImportedThreadId);
  const importedUpdatedAt = timestamp(args.legacyImportedUpdatedAt);
  if (importedThreadId) {
    const nodeCwd = (args.nodes ?? []).find(
      (node) =>
        node.kind === 'text' &&
        node.author === 'assistant' &&
        node.codexRef?.threadId === importedThreadId &&
        clean(node.codexRef.cwd),
    );
    const cwd = nodeCwd?.kind === 'text' ? clean(nodeCwd.codexRef?.cwd) : workingFolder;
    if (cwd) {
      links = upsertCodexThreadLink(links, {
        threadId: importedThreadId,
        cwd,
        origin: 'imported',
        ...(importedUpdatedAt ? { lastSeenUpdatedAt: importedUpdatedAt } : {}),
      });
    }
  }

  for (const node of args.nodes ?? []) {
    if (node.kind !== 'text' || node.author !== 'assistant' || !node.codexRef) continue;
    const threadId = clean(node.codexRef.threadId);
    const cwd = clean(node.codexRef.cwd) || workingFolder;
    if (!threadId || !cwd) continue;
    const existing = links[threadId];
    const forkedFromThreadId = clean(node.codexRef.forkedFromThreadId);
    const forkedFromTurnId = clean(node.codexRef.forkedFromTurnId);
    links = upsertCodexThreadLink(links, {
      threadId,
      cwd,
      origin: forkedFromThreadId
        ? 'forked'
        : existing?.origin ?? (threadId === importedThreadId ? 'imported' : 'created'),
      ...(forkedFromThreadId ? { forkedFromThreadId } : {}),
      ...(forkedFromTurnId ? { forkedFromTurnId } : {}),
      ...(existing?.lastSeenUpdatedAt ? { lastSeenUpdatedAt: existing.lastSeenUpdatedAt } : {}),
    });
  }

  return links;
}

export function hasCodexThreadLink(links: CodexThreadLinks, threadId: unknown): boolean {
  const id = clean(threadId);
  return Boolean(id && links[id]?.threadId === id);
}
