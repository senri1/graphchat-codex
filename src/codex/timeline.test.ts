import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCodexTimelineNotification,
  codexTimelineFromThreadItems,
  portableAssistantTextFromCodexTimeline,
  thinkingSummaryFromCodexTimeline,
} from './timeline.ts';

test('preserves imported ThreadItem order across reasoning, tools, and messages', () => {
  const timeline = codexTimelineFromThreadItems([
    { type: 'reasoning', id: 'reason-1', summary: ['Inspecting the project.'], content: [] },
    {
      type: 'commandExecution',
      id: 'cmd-1',
      command: 'npm test',
      cwd: '/workspace',
      status: 'completed',
      aggregatedOutput: 'ok',
    },
    { type: 'agentMessage', id: 'comment-1', text: 'The tests pass.', phase: 'commentary' },
    {
      type: 'fileChange',
      id: 'patch-1',
      status: 'completed',
      changes: [{ path: 'src/App.tsx', kind: { type: 'update' }, diff: '@@ changed' }],
    },
    { type: 'agentMessage', id: 'final-1', text: 'Implemented.', phase: 'final_answer' },
  ]);

  assert.deepEqual(
    timeline?.map((item) => item.id),
    ['reason-1', 'cmd-1', 'comment-1', 'patch-1', 'final-1'],
  );
  assert.equal(portableAssistantTextFromCodexTimeline(timeline), 'Implemented.');
  assert.deepEqual(thinkingSummaryFromCodexTimeline(timeline), [
    { summaryIndex: 0, text: 'Inspecting the project.', done: true },
  ]);
});

test('uses item start order while streaming and replaces items with completed snapshots', () => {
  let timeline = applyCodexTimelineNotification([], 'item/started', {
    startedAtMs: 10,
    item: { type: 'reasoning', id: 'reason-1', summary: [], content: [] },
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/reasoning/summaryPartAdded', {
    itemId: 'reason-1',
    summaryIndex: 0,
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/reasoning/summaryTextDelta', {
    itemId: 'reason-1',
    summaryIndex: 0,
    delta: 'Checking files.',
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/started', {
    startedAtMs: 20,
    item: {
      type: 'commandExecution',
      id: 'cmd-1',
      command: 'rg TODO',
      cwd: '/workspace',
      status: 'inProgress',
      aggregatedOutput: null,
    },
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/commandExecution/outputDelta', {
    itemId: 'cmd-1',
    delta: 'src/App.tsx\n',
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/started', {
    startedAtMs: 30,
    item: { type: 'agentMessage', id: 'final-1', text: '', phase: 'final_answer' },
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/agentMessage/delta', {
    itemId: 'final-1',
    delta: 'Done.',
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/completed', {
    completedAtMs: 40,
    item: {
      type: 'commandExecution',
      id: 'cmd-1',
      command: 'rg TODO',
      cwd: '/workspace',
      status: 'completed',
      aggregatedOutput: 'src/App.tsx\n',
      exitCode: 0,
    },
  });

  assert.deepEqual(timeline.map((item) => item.id), ['reason-1', 'cmd-1', 'final-1']);
  assert.equal(timeline[1]?.kind, 'event');
  assert.equal(timeline[1]?.kind === 'event' ? timeline[1].event.status : null, 'completed');
  assert.equal(portableAssistantTextFromCodexTimeline(timeline), 'Done.');
});

test('keeps separate reasoning items and summary indexes in timeline order', () => {
  let timeline = applyCodexTimelineNotification([], 'item/reasoning/summaryTextDelta', {
    itemId: 'reason-1',
    summaryIndex: 1,
    delta: 'Second part',
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/reasoning/summaryTextDelta', {
    itemId: 'reason-2',
    summaryIndex: 0,
    delta: 'Later reasoning',
  });

  assert.deepEqual(thinkingSummaryFromCodexTimeline(timeline), [
    { summaryIndex: 0, text: 'Second part', done: false },
    { summaryIndex: 1, text: 'Later reasoning', done: false },
  ]);
});

test('keeps one plan row when structured progress and plan items overlap', () => {
  let timeline = applyCodexTimelineNotification([], 'turn/plan/updated', {
    turnId: 'turn-1',
    plan: [
      { step: 'Inspect', status: 'completed' },
      { step: 'Implement', status: 'inProgress' },
    ],
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/started', {
    startedAtMs: 10,
    item: { type: 'plan', id: 'plan-item', text: '' },
  });
  timeline = applyCodexTimelineNotification(timeline, 'item/plan/delta', {
    itemId: 'plan-item',
    delta: 'Inspect, then implement.',
  });

  assert.equal(timeline.length, 1);
  assert.equal(timeline[0]?.kind, 'event');
  if (timeline[0]?.kind !== 'event') return;
  assert.equal(timeline[0].event.id, 'turn-plan:turn-1');
  assert.equal(timeline[0].event.steps?.length, 2);
  assert.equal(timeline[0].event.detail, 'Inspect, then implement.');
});
