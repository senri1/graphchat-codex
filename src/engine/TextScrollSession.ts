export type TextScrollPosition = {
  nodeId: string;
  scrollTop: number;
  scrollLeft: number;
};

type TextScrollSessionScheduler = {
  setTimeout: (callback: () => void, delayMs: number) => number;
  clearTimeout: (timerId: number) => void;
};

type TextScrollSessionHooks = {
  onInteractionChange: (active: boolean) => void;
  onCommit: (position: TextScrollPosition) => void;
};

export const TEXT_SCROLL_IDLE_COMMIT_MS = 500;

function browserScheduler(): TextScrollSessionScheduler {
  return {
    setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimeout: (timerId) => window.clearTimeout(timerId),
  };
}

export class TextScrollSession {
  private readonly hooks: TextScrollSessionHooks;
  private readonly scheduler: TextScrollSessionScheduler;
  private readonly idleCommitMs: number;
  private active = false;
  private timerId: number | null = null;
  private pending: TextScrollPosition | null = null;

  constructor(
    hooks: TextScrollSessionHooks,
    opts?: { idleCommitMs?: number; scheduler?: TextScrollSessionScheduler },
  ) {
    this.hooks = hooks;
    this.scheduler = opts?.scheduler ?? browserScheduler();
    this.idleCommitMs = Math.max(0, Math.round(opts?.idleCommitMs ?? TEXT_SCROLL_IDLE_COMMIT_MS));
  }

  record(position: TextScrollPosition): void {
    if (!position.nodeId) return;
    this.pending = {
      nodeId: position.nodeId,
      scrollTop: Math.max(0, Number(position.scrollTop) || 0),
      scrollLeft: Math.max(0, Number(position.scrollLeft) || 0),
    };
    this.setActive(true);
    this.clearTimer();
    this.timerId = this.scheduler.setTimeout(() => {
      this.timerId = null;
      this.flush();
    }, this.idleCommitMs);
  }

  flush(): boolean {
    this.clearTimer();
    const pending = this.pending;
    this.pending = null;
    try {
      if (pending) this.hooks.onCommit(pending);
    } finally {
      this.setActive(false);
    }
    return Boolean(pending);
  }

  isActive(): boolean {
    return this.active;
  }

  getPending(): TextScrollPosition | null {
    return this.pending ? { ...this.pending } : null;
  }

  private setActive(next: boolean): void {
    if (this.active === next) return;
    this.active = next;
    this.hooks.onInteractionChange(next);
  }

  private clearTimer(): void {
    if (this.timerId == null) return;
    this.scheduler.clearTimeout(this.timerId);
    this.timerId = null;
  }
}
