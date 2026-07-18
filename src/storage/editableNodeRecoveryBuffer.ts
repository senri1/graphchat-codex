export type EditableNodeRecoveryDraft = {
  chatId: string;
  nodeId: string;
  content: string;
  updatedAt: number;
};

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

type EditableNodeRecoveryBufferOptions = {
  delayMs: number;
  onFlush: (drafts: EditableNodeRecoveryDraft[]) => void;
  now?: () => number;
  setTimer?: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimer?: (handle: TimerHandle) => void;
};

function draftKey(chatId: string, nodeId: string): string {
  return `${chatId}\u0000${nodeId}`;
}

export class EditableNodeRecoveryBuffer {
  private readonly delayMs: number;
  private readonly onFlush: (drafts: EditableNodeRecoveryDraft[]) => void;
  private readonly now: () => number;
  private readonly setTimer: (callback: () => void, delayMs: number) => TimerHandle;
  private readonly clearTimer: (handle: TimerHandle) => void;
  private readonly pending = new Map<string, EditableNodeRecoveryDraft>();
  private timer: TimerHandle | null = null;

  constructor(options: EditableNodeRecoveryBufferOptions) {
    this.delayMs = Math.max(0, Math.round(Number(options.delayMs) || 0));
    this.onFlush = options.onFlush;
    this.now = options.now ?? (() => Date.now());
    this.setTimer = options.setTimer ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs));
    this.clearTimer = options.clearTimer ?? ((handle) => globalThis.clearTimeout(handle));
  }

  schedule(chatIdRaw: string, nodeIdRaw: string, content: string): void {
    const chatId = String(chatIdRaw ?? '').trim();
    const nodeId = String(nodeIdRaw ?? '').trim();
    if (!chatId || !nodeId) return;

    this.pending.set(draftKey(chatId, nodeId), {
      chatId,
      nodeId,
      content: typeof content === 'string' ? content : String(content ?? ''),
      updatedAt: this.now(),
    });
    this.restartTimer();
  }

  discard(chatIdRaw: string, nodeIdRaw: string): void {
    const chatId = String(chatIdRaw ?? '').trim();
    const nodeId = String(nodeIdRaw ?? '').trim();
    if (!chatId || !nodeId) return;
    this.pending.delete(draftKey(chatId, nodeId));
    if (this.pending.size === 0) this.cancelTimer();
  }

  discardMatching(predicate: (draft: EditableNodeRecoveryDraft) => boolean): void {
    for (const [key, draft] of this.pending.entries()) {
      if (predicate(draft)) this.pending.delete(key);
    }
    if (this.pending.size === 0) this.cancelTimer();
  }

  flush(): void {
    this.cancelTimer();
    if (this.pending.size === 0) return;

    const drafts = Array.from(this.pending.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    this.pending.clear();
    this.onFlush(drafts);
  }

  dispose(options?: { flush?: boolean }): void {
    if (options?.flush !== false) {
      this.flush();
      return;
    }
    this.cancelTimer();
    this.pending.clear();
  }

  private restartTimer(): void {
    this.cancelTimer();
    this.timer = this.setTimer(() => {
      this.timer = null;
      this.flush();
    }, this.delayMs);
  }

  private cancelTimer(): void {
    if (this.timer == null) return;
    this.clearTimer(this.timer);
    this.timer = null;
  }
}
