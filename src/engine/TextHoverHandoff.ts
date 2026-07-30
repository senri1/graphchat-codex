export type TextHoverHandoffRecord = {
  nodeId: string;
  displayHash: string;
  rasterSig: string;
  expiresAt: number;
  requiresRasterHandoff: boolean;
};

export type TextHoverHandoffState = TextHoverHandoffRecord & {
  phase: 'grace' | 'handoff';
};

export type TextHoverIdleDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

export type TextHoverHandoffScheduler = {
  setTimeout: (callback: () => void, delayMs: number) => number;
  clearTimeout: (timerId: number) => void;
  requestIdle: (callback: (deadline: TextHoverIdleDeadline) => void, timeoutMs: number) => number;
  cancelIdle: (idleId: number) => void;
};

type TextHoverHandoffHooks = {
  onStateChange: (state: TextHoverHandoffState | null) => void;
  canStartHandoff?: (deadline: TextHoverIdleDeadline) => boolean;
  onExpire?: (record: TextHoverHandoffRecord) => void;
};

export const TEXT_HOVER_HANDOFF_GRACE_MS = 180;
export const TEXT_HOVER_HANDOFF_IDLE_TIMEOUT_MS = 700;
export const TEXT_HOVER_HANDOFF_MAX_MS = 2200;

export const LARGE_TEXT_SOURCE_CHARS = 12_000;
export const LARGE_TEXT_RENDERED_HTML_CHARS = 32_000;
export const LARGE_TEXT_STRUCTURAL_ROWS = 48;
export const LARGE_TEXT_AREA_PX = 750_000;
export const LARGE_TEXT_AREA_SOURCE_CHARS = 4_000;

export function isLargeTextNodeRender(metrics: {
  sourceChars: number;
  renderedHtmlChars?: number;
  structuralRows?: number;
  areaPx?: number;
}): boolean {
  const sourceChars = Math.max(0, Number(metrics.sourceChars) || 0);
  const renderedHtmlChars = Math.max(0, Number(metrics.renderedHtmlChars) || 0);
  const structuralRows = Math.max(0, Number(metrics.structuralRows) || 0);
  const areaPx = Math.max(0, Number(metrics.areaPx) || 0);
  return (
    renderedHtmlChars >= LARGE_TEXT_RENDERED_HTML_CHARS ||
    sourceChars >= LARGE_TEXT_SOURCE_CHARS ||
    structuralRows >= LARGE_TEXT_STRUCTURAL_ROWS ||
    (areaPx >= LARGE_TEXT_AREA_PX && sourceChars >= LARGE_TEXT_AREA_SOURCE_CHARS)
  );
}

function browserScheduler(): TextHoverHandoffScheduler {
  const browserWindow = window as Window & {
    requestIdleCallback?: (
      callback: (deadline: TextHoverIdleDeadline) => void,
      opts?: { timeout?: number },
    ) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const hasIdleCallback = typeof browserWindow.requestIdleCallback === 'function';
  return {
    setTimeout: (callback, delayMs) => browserWindow.setTimeout(callback, delayMs),
    clearTimeout: (timerId) => browserWindow.clearTimeout(timerId),
    requestIdle: (callback, timeoutMs) => {
      if (hasIdleCallback) return browserWindow.requestIdleCallback!(callback, { timeout: timeoutMs });
      return browserWindow.setTimeout(
        () => callback({ didTimeout: false, timeRemaining: () => 8 }),
        32,
      );
    },
    cancelIdle: (idleId) => {
      if (hasIdleCallback && typeof browserWindow.cancelIdleCallback === 'function') {
        browserWindow.cancelIdleCallback(idleId);
      } else {
        browserWindow.clearTimeout(idleId);
      }
    },
  };
}

export class TextHoverHandoff {
  private readonly hooks: TextHoverHandoffHooks;
  private readonly scheduler: TextHoverHandoffScheduler;
  private readonly graceMs: number;
  private readonly idleTimeoutMs: number;
  private readonly maxMs: number;
  private state: TextHoverHandoffState | null = null;
  private timerId: number | null = null;
  private idleId: number | null = null;
  private expiryTimerId: number | null = null;
  private token = 0;

  constructor(
    hooks: TextHoverHandoffHooks,
    opts?: {
      graceMs?: number;
      idleTimeoutMs?: number;
      maxMs?: number;
      scheduler?: TextHoverHandoffScheduler;
    },
  ) {
    this.hooks = hooks;
    this.scheduler = opts?.scheduler ?? browserScheduler();
    this.graceMs = Math.max(0, Math.round(opts?.graceMs ?? TEXT_HOVER_HANDOFF_GRACE_MS));
    this.idleTimeoutMs = Math.max(0, Math.round(opts?.idleTimeoutMs ?? TEXT_HOVER_HANDOFF_IDLE_TIMEOUT_MS));
    this.maxMs = Math.max(this.graceMs, Math.round(opts?.maxMs ?? TEXT_HOVER_HANDOFF_MAX_MS));
  }

  begin(record: TextHoverHandoffRecord): void {
    if (!record.nodeId || !record.displayHash || !record.rasterSig) return;
    this.clearScheduledWork();
    const token = ++this.token;
    this.state = { ...record, phase: 'grace' };
    this.notify();
    this.expiryTimerId = this.scheduler.setTimeout(() => {
      if (token !== this.token || !this.state) return;
      this.expiryTimerId = null;
      this.hooks.onExpire?.({ ...this.state });
      this.cancel();
    }, this.maxMs);
    this.timerId = this.scheduler.setTimeout(() => {
      if (token !== this.token || this.state?.phase !== 'grace') return;
      this.timerId = null;
      if (!this.state.requiresRasterHandoff) {
        this.state = { ...this.state, phase: 'handoff' };
        this.notify();
        return;
      }
      this.scheduleIdle(token);
    }, this.graceMs);
  }

  cancel(): boolean {
    if (!this.state && this.timerId == null && this.idleId == null) return false;
    this.token += 1;
    this.clearScheduledWork();
    this.state = null;
    this.notify();
    return true;
  }

  getState(): TextHoverHandoffState | null {
    return this.state ? { ...this.state } : null;
  }

  private notify(): void {
    this.hooks.onStateChange(this.getState());
  }

  private scheduleIdle(token: number): void {
    this.idleId = this.scheduler.requestIdle((deadline) => {
      if (token !== this.token || this.state?.phase !== 'grace') return;
      this.idleId = null;
      if (this.hooks.canStartHandoff && !this.hooks.canStartHandoff(deadline)) {
        this.scheduleIdle(token);
        return;
      }
      this.state = { ...this.state, phase: 'handoff' };
      this.notify();
    }, this.idleTimeoutMs);
  }

  private clearScheduledWork(): void {
    if (this.timerId != null) {
      this.scheduler.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.idleId != null) {
      this.scheduler.cancelIdle(this.idleId);
      this.idleId = null;
    }
    if (this.expiryTimerId != null) {
      this.scheduler.clearTimeout(this.expiryTimerId);
      this.expiryTimerId = null;
    }
  }
}
