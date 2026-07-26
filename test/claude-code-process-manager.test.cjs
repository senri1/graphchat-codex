const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const test = require('node:test');

const {
  ClaudeCodeProcessManager,
  buildClaudeCodeArgs,
  claudeCodeCandidates,
  claudeCodePermissionSettings,
  legacyHistoryContext,
  normalizeClaudeCodeEffort,
  textDeltaFromStreamEvent,
  textFromContent,
  toolResultsFromUserMessage,
  toolUsesFromAssistantMessage,
} = require('../electron/claude-code/process-manager.cjs');

function fakeSpawnForMessages(messages) {
  const calls = [];
  const fakeSpawn = (command, args, options) => {
    calls.push({ command, args, options });
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = new EventEmitter();
    child.stdin.end = () => {
      setImmediate(() => {
        for (const message of messages) {
          child.stdout.emit('data', Buffer.from(`${JSON.stringify(message)}\n`, 'utf8'));
        }
        setImmediate(() => child.emit('close', 0));
      });
    };
    child.kill = () => {
      child.emit('close', null);
    };
    return child;
  };
  fakeSpawn.calls = calls;
  return fakeSpawn;
}

async function runFakeClaudeCodeTurn(messages) {
  const fakeSpawn = fakeSpawnForMessages(messages);
  const manager = new ClaudeCodeProcessManager({ resourcesPath: null, spawn: fakeSpawn });
  manager.binary = { path: 'claude-test', version: 'test' };
  const events = [];
  manager.on('event', (event) => events.push(event));
  await manager.startGraphTurn({
    clientTag: 'assistant-node',
    cwd: path.join(__dirname, '..'),
    prompt: 'Test prompt',
    model: 'claude-fable-5',
    effort: 'high',
    permissionMode: 'read-only',
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { events, fakeSpawn };
}

test('Claude Code discovery includes the native per-user install before PATH candidates', () => {
  const candidates = claudeCodeCandidates('C:\\GraphChat\\resources', {
    platform: 'win32',
    env: {
      USERPROFILE: 'C:\\Users\\example',
      APPDATA: 'C:\\Users\\example\\AppData\\Roaming',
      LOCALAPPDATA: 'C:\\Users\\example\\AppData\\Local',
      PATH: 'C:\\tools',
    },
  });

  assert.deepEqual(candidates.slice(0, 6), [
    path.join('C:\\GraphChat\\resources', 'claude.exe'),
    path.join('C:\\Users\\example', '.local', 'bin', 'claude.exe'),
    path.join('C:\\Users\\example\\AppData\\Roaming', 'npm', 'claude.exe'),
    path.join('C:\\Users\\example\\AppData\\Roaming', 'npm', 'claude.cmd'),
    path.join('C:\\Users\\example\\AppData\\Local', 'Microsoft', 'WinGet', 'Links', 'claude.exe'),
    path.join('C:\\tools', 'claude.exe'),
  ]);
});

test('explicit Claude Code configuration is the first discovery candidate', () => {
  const configured = 'D:\\apps\\claude.exe';
  const candidates = claudeCodeCandidates(null, {
    platform: 'win32',
    env: {
      GRAPHCHAT_CLAUDE_CODE_BINARY: configured,
      USERPROFILE: 'C:\\Users\\example',
      PATH: '',
    },
  });
  assert.equal(candidates[0], configured);
});

test('GraphChat permission modes map to Claude Code non-interactive modes', () => {
  assert.deepEqual(claudeCodePermissionSettings('full-access'), {
    mode: 'full-access',
    cliMode: 'bypassPermissions',
    extraArgs: ['--dangerously-skip-permissions'],
  });
  assert.deepEqual(claudeCodePermissionSettings('workspace-write'), {
    mode: 'workspace-write',
    cliMode: 'acceptEdits',
    extraArgs: [],
  });
  assert.deepEqual(claudeCodePermissionSettings('read-only'), {
    mode: 'read-only',
    cliMode: 'plan',
    extraArgs: [],
  });
});

test('new Claude Code turns use print streaming and an explicit session id', () => {
  const args = buildClaudeCodeArgs({
    prompt: 'Fix the test',
    model: 'claude-opus-4-8',
    effort: 'xhigh',
    permissionMode: 'full-access',
    appendSystemPrompt: 'Use the current project.',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
  });

  assert.deepEqual(args, [
    '--print',
    '--input-format',
    'text',
    '--output-format',
    'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--model',
    'claude-opus-4-8',
    '--permission-mode',
    'bypassPermissions',
    '--dangerously-skip-permissions',
    '--thinking-display',
    'summarized',
    '--effort',
    'xhigh',
    '--append-system-prompt',
    'Use the current project.',
    '--session-id',
    '550e8400-e29b-41d4-a716-446655440000',
  ]);
  assert.equal(args.includes('Fix the test'), false);
});

test('Opus 4.8 and Opus 5 request thinking summaries without changing other Claude models', () => {
  const opus48Args = buildClaudeCodeArgs({
    prompt: 'Explain the result',
    model: 'claude-opus-4-8',
    permissionMode: 'read-only',
  });
  const opus5Args = buildClaudeCodeArgs({
    prompt: 'Explain the result',
    model: 'claude-opus-5',
    permissionMode: 'read-only',
  });
  const sonnetArgs = buildClaudeCodeArgs({
    prompt: 'Explain the result',
    model: 'claude-sonnet-4-6',
    permissionMode: 'read-only',
  });

  assert.deepEqual(
    opus48Args.slice(opus48Args.indexOf('--thinking-display'), opus48Args.indexOf('--thinking-display') + 2),
    ['--thinking-display', 'summarized'],
  );
  assert.deepEqual(
    opus5Args.slice(opus5Args.indexOf('--thinking-display'), opus5Args.indexOf('--thinking-display') + 2),
    ['--thinking-display', 'summarized'],
  );
  assert.equal(sonnetArgs.includes('--thinking-display'), false);
});

test('Claude Code prompt text is kept out of process arguments', () => {
  const prompt = 'x'.repeat(70_000);
  const args = buildClaudeCodeArgs({
    prompt,
    model: 'claude-opus-4-8',
    permissionMode: 'workspace-write',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
  });

  assert.equal(args.includes(prompt), false);
  assert.equal(Math.max(...args.map((arg) => arg.length)) < 1_000, true);
});

test('Claude Code effort validation accepts every supported CLI level', () => {
  for (const effort of ['low', 'medium', 'high', 'xhigh', 'max']) {
    assert.equal(normalizeClaudeCodeEffort(effort), effort);
  }
  assert.equal(normalizeClaudeCodeEffort(undefined), '');
  assert.throws(
    () => normalizeClaudeCodeEffort('minimal'),
    /Unsupported Claude Code effort level: minimal/,
  );
});

test('Claude Code graph turns forward text deltas before message stop', async () => {
  const { events } = await runFakeClaudeCodeTurn([
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'message_start', message: { id: 'message-1' } },
    },
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    },
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello' } },
    },
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: ' world' } },
    },
    {
      type: 'assistant',
      session_id: 'session-1',
      message: { content: [{ type: 'text', text: 'Hello world' }] },
    },
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'content_block_stop', index: 0 },
    },
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'message_stop' },
    },
    {
      type: 'result',
      session_id: 'session-1',
      subtype: 'success',
      is_error: false,
      result: 'Hello world',
    },
  ]);

  assert.deepEqual(
    events.filter((event) => event.kind === 'text-delta').map((event) => event.delta),
    ['Hello', ' world'],
  );
  const firstTextDelta = events.findIndex((event) => event.kind === 'text-delta');
  const assistantMessage = events.findIndex((event) => event.kind === 'assistant-message');
  assert.notEqual(firstTextDelta, -1);
  assert.notEqual(assistantMessage, -1);
  assert.equal(firstTextDelta < assistantMessage, true);
});

test('Claude Code graph turns keep known tool-use stream text out of final deltas', async () => {
  const { events } = await runFakeClaudeCodeTurn([
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'message_start', message: { id: 'message-1' } },
    },
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'tool-1', name: 'Read' } },
    },
    {
      type: 'assistant',
      session_id: 'session-1',
      message: {
        content: [
          { type: 'text', text: 'Inspecting note.txt first.' },
          { type: 'tool_use', id: 'tool-1', name: 'Read', input: { file_path: 'note.txt' } },
        ],
      },
    },
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'Still inspecting.' } },
    },
    {
      type: 'stream_event',
      session_id: 'session-1',
      event: { type: 'message_stop' },
    },
    {
      type: 'result',
      session_id: 'session-1',
      subtype: 'success',
      is_error: false,
      result: '',
    },
  ]);

  assert.deepEqual(events.filter((event) => event.kind === 'text-delta'), []);
  assert.equal(
    events.some((event) => event.kind === 'assistant-progress' && event.text.includes('Inspecting note.txt')),
    true,
  );
  assert.equal(events.some((event) => event.kind === 'tool-use'), true);
});

test('child graph turns resume and fork the selected parent session', () => {
  const args = buildClaudeCodeArgs({
    prompt: 'Now add coverage',
    model: 'claude-sonnet-4-6',
    effort: 'max',
    permissionMode: 'workspace-write',
    sourceSessionId: 'parent-session',
  });
  assert.deepEqual(args.slice(-3), [
    '--resume',
    'parent-session',
    '--fork-session',
  ]);
  assert.deepEqual(args.slice(0, 14), [
    '--print',
    '--input-format',
    'text',
    '--output-format',
    'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--model',
    'claude-sonnet-4-6',
    '--permission-mode',
    'acceptEdits',
    '--effort',
    'max',
    '--resume',
  ]);
  assert.equal(args.includes('Now add coverage'), false);
});

test('Claude Code stream helpers extract text deltas, messages, and tools', () => {
  assert.equal(
    textDeltaFromStreamEvent({
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: 'hello' },
      },
    }),
    'hello',
  );
  assert.equal(
    textFromContent([
      { type: 'text', text: 'first' },
      { type: 'tool_use', name: 'Read', input: { file_path: 'a.ts' } },
      { type: 'text', text: ' second' },
    ]),
    'first second',
  );
  assert.deepEqual(
    toolUsesFromAssistantMessage({
      type: 'assistant',
      message: {
        content: [{ type: 'tool_use', id: 'tool-1', name: 'Read', input: { file_path: 'a.ts' } }],
      },
    }),
    [{ id: 'tool-1', name: 'Read', input: { file_path: 'a.ts' } }],
  );
  assert.deepEqual(
    toolResultsFromUserMessage({
      type: 'user',
      message: {
        content: [{ type: 'tool_result', tool_use_id: 'tool-1', content: '1\tcontent', is_error: false }],
      },
    }),
    [{ toolUseId: 'tool-1', isError: false, content: '1\tcontent' }],
  );
});

test('legacy graph history is converted into prompt context', () => {
  const context = legacyHistoryContext([
    { role: 'user', content: [{ text: 'Question' }] },
    { role: 'assistant', content: [{ text: 'Answer' }] },
  ]);
  assert.match(context, /User:\nQuestion/);
  assert.match(context, /Assistant:\nAnswer/);
});
