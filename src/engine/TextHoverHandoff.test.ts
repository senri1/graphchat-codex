import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TextHoverHandoff,
  isLargeTextNodeRender,
  type TextHoverIdleDeadline,
  type TextHoverHandoffScheduler,
} from './TextHoverHandoff.ts';

function createScheduler() {
  let nextId = 1;
  const timers = new Map<number, { callback: () => void; delayMs: number }>();
  const idleCallbacks = new Map<number, (deadline: TextHoverIdleDeadline) => void>();
  const scheduler: TextHoverHandoffScheduler = {
    setTimeout(callback, delayMs) {
      const id = nextId++;
      timers.set(id, { callback, delayMs });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    requestIdle(callback) {
      const id = nextId++;
      idleCallbacks.set(id, callback);
      return id;
    },
    cancelIdle(id) {
      idleCallbacks.delete(id);
    },
  };
  return {
    scheduler,
    runTimers(delayMs: number) {
      const callbacks = Array.from(timers.entries()).filter(([, entry]) => entry.delayMs === delayMs);
      for (const [id] of callbacks) timers.delete(id);
      for (const [, entry] of callbacks) entry.callback();
    },
    runIdle() {
      const callbacks = Array.from(idleCallbacks.values());
      idleCallbacks.clear();
      for (const callback of callbacks) callback({ didTimeout: false, timeRemaining: () => 12 });
    },
    timerCount: () => timers.size,
    idleCount: () => idleCallbacks.size,
  };
}

const record = {
  nodeId: 'n1',
  displayHash: 'hash-1',
  rasterSig: 'sig-1',
  expiresAt: 2200,
  requiresRasterHandoff: true,
};

test('moves from grace to handoff only after the grace timer and idle callback', () => {
  const fake = createScheduler();
  const phases: Array<string | null> = [];
  const session = new TextHoverHandoff(
    { onStateChange: (state) => phases.push(state?.phase ?? null) },
    { scheduler: fake.scheduler },
  );

  session.begin(record);
  assert.equal(session.getState()?.phase, 'grace');
  assert.equal(fake.timerCount(), 2);

  fake.runTimers(180);
  assert.equal(session.getState()?.phase, 'grace');
  assert.equal(fake.idleCount(), 1);

  fake.runIdle();
  assert.equal(session.getState()?.phase, 'handoff');
  assert.deepEqual(phases, ['grace', 'handoff']);
});

test('re-entry cancellation prevents a pending handoff', () => {
  const fake = createScheduler();
  const phases: Array<string | null> = [];
  const session = new TextHoverHandoff(
    { onStateChange: (state) => phases.push(state?.phase ?? null) },
    { scheduler: fake.scheduler },
  );

  session.begin(record);
  fake.runTimers(180);
  assert.equal(fake.idleCount(), 1);
  assert.equal(session.cancel(), true);
  assert.equal(fake.idleCount(), 0);

  fake.runIdle();
  assert.equal(session.getState(), null);
  assert.deepEqual(phases, ['grace', null]);
});

test('a newer exit supersedes older scheduled callbacks', () => {
  const fake = createScheduler();
  const session = new TextHoverHandoff(
    { onStateChange: () => {} },
    { scheduler: fake.scheduler },
  );

  session.begin(record);
  session.begin({ ...record, nodeId: 'n2', displayHash: 'hash-2', rasterSig: 'sig-2' });
  assert.equal(fake.timerCount(), 2);
  fake.runTimers(180);
  fake.runIdle();

  assert.deepEqual(session.getState(), {
    nodeId: 'n2',
    displayHash: 'hash-2',
    rasterSig: 'sig-2',
    expiresAt: 2200,
    requiresRasterHandoff: true,
    phase: 'handoff',
  });
});

test('state snapshots are defensive copies', () => {
  const fake = createScheduler();
  const session = new TextHoverHandoff(
    { onStateChange: () => {} },
    { scheduler: fake.scheduler },
  );
  session.begin(record);
  const snapshot = session.getState();
  assert.ok(snapshot);
  snapshot.nodeId = 'mutated';
  assert.equal(session.getState()?.nodeId, 'n1');
});

test('max-duration expiry clears the parked state and notifies', () => {
  const fake = createScheduler();
  const phases: Array<string | null> = [];
  const expired: string[] = [];
  const session = new TextHoverHandoff(
    {
      onStateChange: (state) => phases.push(state?.phase ?? null),
      onExpire: (state) => expired.push(state.nodeId),
    },
    { scheduler: fake.scheduler },
  );

  session.begin(record);
  fake.runTimers(2200);

  assert.equal(session.getState(), null);
  assert.deepEqual(phases, ['grace', null]);
  assert.equal(fake.timerCount(), 0);
  assert.equal(fake.idleCount(), 0);
  assert.deepEqual(expired, ['n1']);
});

test('small-node grace completes without waiting for an idle callback', () => {
  const fake = createScheduler();
  const phases: Array<string | null> = [];
  const session = new TextHoverHandoff(
    { onStateChange: (state) => phases.push(state?.phase ?? null) },
    { scheduler: fake.scheduler },
  );

  session.begin({ ...record, requiresRasterHandoff: false });
  fake.runTimers(180);

  assert.equal(session.getState()?.phase, 'handoff');
  assert.equal(fake.idleCount(), 0);
  assert.deepEqual(phases, ['grace', 'handoff']);
});

test('idle handoff reschedules while the hook reports recent input', () => {
  const fake = createScheduler();
  let ready = false;
  const session = new TextHoverHandoff(
    {
      onStateChange: () => {},
      canStartHandoff: () => ready,
    },
    { scheduler: fake.scheduler },
  );

  session.begin(record);
  fake.runTimers(180);
  fake.runIdle();
  assert.equal(session.getState()?.phase, 'grace');
  assert.equal(fake.idleCount(), 1);

  ready = true;
  fake.runIdle();
  assert.equal(session.getState()?.phase, 'handoff');
});

test('large render classification covers source, HTML, structure, and large-area text', () => {
  assert.equal(isLargeTextNodeRender({ sourceChars: 11_999, renderedHtmlChars: 31_999 }), false);
  assert.equal(isLargeTextNodeRender({ sourceChars: 12_000 }), true);
  assert.equal(isLargeTextNodeRender({ sourceChars: 1, renderedHtmlChars: 32_000 }), true);
  assert.equal(isLargeTextNodeRender({ sourceChars: 1, structuralRows: 48 }), true);
  assert.equal(isLargeTextNodeRender({ sourceChars: 4_000, areaPx: 750_000 }), true);
});
