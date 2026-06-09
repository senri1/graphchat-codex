import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { codexThreadDisplayName, type CodexThreadSummary } from '../codex/threadImport';
import { Icons } from './Icons';

type Props = {
  open: boolean;
  onClose: () => void;
  isThreadLinked: (threadId: string) => boolean;
  onOpenThread: (thread: CodexThreadSummary) => void | Promise<void>;
};

function errorText(value: unknown, fallback: string): string {
  if (value && typeof value === 'object' && typeof (value as any).error === 'string') {
    const message = String((value as any).error).trim();
    if (message) return message;
  }
  return fallback;
}

function sourceLabel(source: unknown): string {
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object' && typeof (source as any).custom === 'string') {
    return String((source as any).custom);
  }
  if (source && typeof source === 'object' && (source as any).subAgent) return 'sub-agent';
  return 'unknown';
}

function dateLabel(value: unknown): string {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Unknown date';
  return new Date(seconds * 1000).toLocaleString();
}

export default function CodexThreadBrowserModal(props: Props) {
  const api = window.gcElectron;
  const [threads, setThreads] = useState<CodexThreadSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openingThreadId, setOpeningThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (!api?.codexThreadList) {
        setError('Codex thread browsing requires the Electron desktop app.');
        return;
      }
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const response = await api.codexThreadList({ cursor, limit: 100 });
        if (!response?.ok) throw new Error(errorText(response, 'Failed to list Codex threads.'));
        const incoming = Array.isArray(response.result?.data) ? response.result.data : [];
        setThreads((current) => {
          const next = append ? [...current, ...incoming] : incoming;
          const byId = new Map<string, CodexThreadSummary>();
          for (const thread of next) {
            const id = typeof thread?.id === 'string' ? thread.id.trim() : '';
            const cwd = typeof thread?.cwd === 'string' ? thread.cwd.trim() : '';
            if (id && cwd) byId.set(id, thread);
          }
          return Array.from(byId.values());
        });
        setNextCursor(
          typeof response.result?.nextCursor === 'string' && response.result.nextCursor.trim()
            ? response.result.nextCursor.trim()
            : null,
        );
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Failed to list Codex threads.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!props.open) return;
    void load(null, false);
  }, [load, props.open]);

  useEffect(() => {
    if (!props.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !openingThreadId) props.onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openingThreadId, props.onClose, props.open]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? threads.filter((thread) => {
          const haystack = [
            codexThreadDisplayName(thread),
            thread.cwd,
            sourceLabel(thread.source),
            thread.id,
          ]
            .join('\n')
            .toLowerCase();
          return haystack.includes(needle);
        })
      : threads;
    const byCwd = new Map<string, CodexThreadSummary[]>();
    for (const thread of filtered) {
      const cwd = String(thread.cwd ?? '').trim() || 'Unknown working folder';
      const group = byCwd.get(cwd) ?? [];
      group.push(thread);
      byCwd.set(cwd, group);
    }
    return Array.from(byCwd.entries()).sort((a, b) => {
      const aNewest = Math.max(...a[1].map((thread) => Number(thread.updatedAt) || 0));
      const bNewest = Math.max(...b[1].map((thread) => Number(thread.updatedAt) || 0));
      return bNewest - aNewest;
    });
  }, [query, threads]);

  if (!props.open) return null;

  const openThread = async (thread: CodexThreadSummary) => {
    if (openingThreadId) return;
    setOpeningThreadId(thread.id);
    setError(null);
    try {
      await props.onOpenThread(thread);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to open the Codex thread.');
    } finally {
      setOpeningThreadId(null);
    }
  };

  return (
    <div className="codexThreads" role="dialog" aria-modal="true" aria-label="Codex threads">
      <div className="codexThreads__backdrop" onMouseDown={props.onClose} />
      <div className="codexThreads__surface" onMouseDown={(event) => event.stopPropagation()}>
        <header className="codexThreads__header">
          <div>
            <h2>Codex Threads</h2>
            <div className="codexThreads__subtitle">Open threads from the official Codex history</div>
          </div>
          <div className="codexThreads__headerActions">
            <button
              className="codexThreads__iconBtn"
              type="button"
              title="Refresh"
              aria-label="Refresh Codex threads"
              disabled={loading || Boolean(openingThreadId)}
              onClick={() => void load(null, false)}
            >
              <Icons.refresh aria-hidden="true" />
            </button>
            <button
              className="codexThreads__iconBtn"
              type="button"
              title="Close"
              aria-label="Close Codex threads"
              onClick={props.onClose}
            >
              <Icons.close aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="codexThreads__search">
          <input
            type="search"
            value={query}
            placeholder="Search threads or working folders"
            aria-label="Search Codex threads"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </div>

        {error ? <div className="codexThreads__error">{error}</div> : null}

        <div className="codexThreads__body">
          {loading ? <div className="codexThreads__empty">Loading Codex threads...</div> : null}
          {!loading && groups.length === 0 ? (
            <div className="codexThreads__empty">{query.trim() ? 'No matching threads.' : 'No Codex threads found.'}</div>
          ) : null}
          {!loading
            ? groups.map(([cwd, groupThreads]) => (
                <section className="codexThreads__group" key={cwd}>
                  <div className="codexThreads__groupHeader">
                    <div className="codexThreads__cwd" title={cwd}>
                      {cwd}
                    </div>
                    <span>{groupThreads.length}</span>
                  </div>
                  <div className="codexThreads__list">
                    {groupThreads.map((thread) => {
                      const linked = props.isThreadLinked(thread.id);
                      const busy = openingThreadId === thread.id;
                      return (
                        <button
                          className="codexThreads__row"
                          type="button"
                          key={thread.id}
                          disabled={Boolean(openingThreadId)}
                          onClick={() => void openThread(thread)}
                        >
                          <span className="codexThreads__rowMain">
                            <strong>{codexThreadDisplayName(thread)}</strong>
                            <span>
                              {dateLabel(thread.updatedAt)} · {sourceLabel(thread.source)}
                              {thread.forkedFromId ? ' · fork' : ''}
                            </span>
                          </span>
                          <span className={`codexThreads__action ${linked ? 'codexThreads__action--linked' : ''}`}>
                            {busy ? 'Opening...' : linked ? 'Open / refresh' : 'Import'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))
            : null}
          {!loading && nextCursor ? (
            <button
              className="codexThreads__loadMore"
              type="button"
              disabled={loadingMore || Boolean(openingThreadId)}
              onClick={() => void load(nextCursor, true)}
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
