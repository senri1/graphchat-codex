const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  CodexProcessManager,
  codexPermissionSettings,
  codexCandidates,
  codexProcessEnv,
  windowsCodexCandidates,
} = require('../electron/codex/process-manager.cjs');

function createGraphTurnHarness(t, respond) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'graphchat-codex-protocol-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));

  const manager = new CodexProcessManager({
    app: { getPath: () => cwd },
    resourcesPath: cwd,
  });
  const calls = [];
  manager.ensureStarted = async () => ({ state: 'ready', ready: true });
  manager.request = async (method, params, options) => {
    calls.push({ method, params, options });
    return await respond(method, params, calls);
  };
  return { manager, cwd, calls };
}

function graphTurnArgs(cwd, extra = {}) {
  return {
    clientTag: 'assistant-node',
    cwd,
    prompt: 'Next question',
    model: 'gpt-5.4',
    effort: 'high',
    developerInstructions: 'Use the current project.',
    ...extra,
  };
}

test('Windows Codex desktop binaries are ordered newest-first with the stable copy as fallback', (t) => {
  const localAppData = fs.mkdtempSync(path.join(os.tmpdir(), 'graphchat-codex-discovery-'));
  t.after(() => fs.rmSync(localAppData, { recursive: true, force: true }));

  const binDir = path.join(localAppData, 'OpenAI', 'Codex', 'bin');
  const older = path.join(binDir, 'older', 'codex.exe');
  const newer = path.join(binDir, 'newer', 'codex.exe');
  fs.mkdirSync(path.dirname(older), { recursive: true });
  fs.mkdirSync(path.dirname(newer), { recursive: true });
  fs.writeFileSync(older, '');
  fs.writeFileSync(newer, '');
  fs.utimesSync(older, new Date(1_000), new Date(1_000));
  fs.utimesSync(newer, new Date(2_000), new Date(2_000));

  assert.deepEqual(windowsCodexCandidates({ LOCALAPPDATA: localAppData }), [
    newer,
    older,
    path.join(binDir, 'codex.exe'),
  ]);
});

test('explicit configuration stays ahead of bundled, desktop app, and PATH candidates', (t) => {
  const localAppData = fs.mkdtempSync(path.join(os.tmpdir(), 'graphchat-codex-priority-'));
  t.after(() => fs.rmSync(localAppData, { recursive: true, force: true }));

  const desktopBinary = path.join(localAppData, 'OpenAI', 'Codex', 'bin', 'current', 'codex.exe');
  fs.mkdirSync(path.dirname(desktopBinary), { recursive: true });
  fs.writeFileSync(desktopBinary, '');

  const resourcesPath = path.join(localAppData, 'GraphChat', 'resources');
  const configured = path.join(localAppData, 'configured-codex.exe');
  const pathDir = path.join(localAppData, 'path-bin');
  const candidates = codexCandidates(resourcesPath, {
    platform: 'win32',
    env: {
      GRAPHCHAT_CODEX_BINARY: configured,
      LOCALAPPDATA: localAppData,
      PATH: pathDir,
    },
  });

  assert.deepEqual(candidates.slice(0, 4), [
    configured,
    path.join(resourcesPath, 'codex.exe'),
    desktopBinary,
    path.join(localAppData, 'OpenAI', 'Codex', 'bin', 'codex.exe'),
  ]);
  assert.equal(candidates[4], path.join(pathDir, 'codex.exe'));
});

test('Codex app-server PATH includes the selected binary directory on Windows', () => {
  const binaryDir = 'C:\\Users\\dev\\AppData\\Local\\OpenAI\\Codex\\bin\\current';
  const baseEnv = {
    Path: 'C:\\Windows\\System32;C:\\Tools',
    OTHER: 'kept',
  };

  const env = codexProcessEnv(path.win32.join(binaryDir, 'codex.exe'), baseEnv, 'win32');

  assert.equal(env.OTHER, 'kept');
  assert.equal(baseEnv.Path, 'C:\\Windows\\System32;C:\\Tools');
  assert.equal(env.Path, `${binaryDir};C:\\Windows\\System32;C:\\Tools`);
  assert.equal(env.PATH, env.Path);
});

test('a new graph conversation starts a thread before starting its first turn', async (t) => {
  const { manager, cwd, calls } = createGraphTurnHarness(t, async (method) => {
    if (method === 'thread/start') return { thread: { id: 'thread-new' } };
    if (method === 'turn/start') return { turn: { id: 'turn-new' } };
    throw new Error(`Unexpected request: ${method}`);
  });

  const result = await manager.startGraphTurn(graphTurnArgs(cwd));

  assert.deepEqual(calls.map((call) => call.method), ['thread/start', 'turn/start']);
  assert.deepEqual(calls[0].params, {
    cwd,
    model: 'gpt-5.4',
    sandbox: 'danger-full-access',
    approvalPolicy: 'never',
    developerInstructions: 'Use the current project.',
  });
  assert.deepEqual(calls[1].params, {
    threadId: 'thread-new',
    input: [{ type: 'text', text: 'Next question' }],
    model: 'gpt-5.4',
    effort: 'high',
    summary: 'auto',
  });
  assert.deepEqual(result, {
    clientTag: 'assistant-node',
    threadId: 'thread-new',
    turnId: 'turn-new',
    mode: 'new',
    rolledBackTurns: 0,
    injectedItemCount: 0,
    forkedFromThreadId: null,
    forkedFromTurnId: null,
  });
  assert.equal(manager.graphClientTagByTurnId.get('turn-new'), 'assistant-node');
  assert.equal(manager.graphClientTagByThreadId.get('thread-new'), 'assistant-node');
});

test('Codex permission modes map to sandbox and approval settings', () => {
  assert.deepEqual(codexPermissionSettings(undefined), {
    mode: 'full-access',
    sandbox: 'danger-full-access',
    approvalPolicy: 'never',
  });
  assert.deepEqual(codexPermissionSettings('workspace-write'), {
    mode: 'workspace-write',
    sandbox: 'workspace-write',
    approvalPolicy: 'on-request',
  });
  assert.deepEqual(codexPermissionSettings('read-only'), {
    mode: 'read-only',
    sandbox: 'read-only',
    approvalPolicy: 'on-request',
  });
  assert.throws(() => codexPermissionSettings('unknown'), /Unsupported Codex permission mode/);
});

test('selected permissions are applied when resuming a Codex thread', async (t) => {
  const { manager, cwd, calls } = createGraphTurnHarness(t, async (method) => {
    if (method === 'thread/read') {
      return {
        thread: {
          id: 'thread-1',
          cwd,
          status: { type: 'idle' },
          turns: [{ id: 'turn-a' }],
        },
      };
    }
    if (method === 'thread/resume') return { thread: { id: 'thread-1' } };
    if (method === 'turn/start') return { turn: { id: 'turn-b' } };
    throw new Error(`Unexpected request: ${method}`);
  });

  await manager.startGraphTurn(
    graphTurnArgs(cwd, {
      permissionMode: 'read-only',
      source: { threadId: 'thread-1', turnId: 'turn-a' },
    }),
  );

  assert.equal(calls[1].params.sandbox, 'read-only');
  assert.equal(calls[1].params.approvalPolicy, 'on-request');
});

test('continuing the newest source turn resumes the existing Codex thread', async (t) => {
  const { manager, cwd, calls } = createGraphTurnHarness(t, async (method) => {
    if (method === 'thread/read') {
      return {
        thread: {
          id: 'thread-1',
          cwd,
          status: { type: 'idle' },
          turns: [{ id: 'turn-a' }, { id: 'turn-b' }],
        },
      };
    }
    if (method === 'thread/resume') return { thread: { id: 'thread-1' } };
    if (method === 'turn/start') return { turn: { id: 'turn-c' } };
    throw new Error(`Unexpected request: ${method}`);
  });

  const result = await manager.startGraphTurn(
    graphTurnArgs(cwd, { source: { threadId: 'thread-1', turnId: 'turn-b' } }),
  );

  assert.deepEqual(calls.map((call) => call.method), ['thread/read', 'thread/resume', 'turn/start']);
  assert.deepEqual(calls[0].params, { threadId: 'thread-1', includeTurns: true });
  assert.equal(calls[1].params.threadId, 'thread-1');
  assert.equal(calls[2].params.threadId, 'thread-1');
  assert.equal(result.mode, 'continue');
  assert.equal(result.threadId, 'thread-1');
  assert.equal(result.rolledBackTurns, 0);
});

test('continuing a historical source turn forks and rolls back the copied tail', async (t) => {
  const { manager, cwd, calls } = createGraphTurnHarness(t, async (method) => {
    if (method === 'thread/read') {
      return {
        thread: {
          id: 'thread-1',
          cwd,
          status: { type: 'idle' },
          turns: [{ id: 'turn-a' }, { id: 'turn-b' }, { id: 'turn-c' }, { id: 'turn-d' }],
        },
      };
    }
    if (method === 'thread/fork') return { thread: { id: 'thread-2' } };
    if (method === 'thread/rollback') return {};
    if (method === 'turn/start') return { turn: { id: 'turn-e' } };
    throw new Error(`Unexpected request: ${method}`);
  });
  const events = [];
  manager.on('event', (event) => events.push(event));

  const result = await manager.startGraphTurn(
    graphTurnArgs(cwd, { source: { threadId: 'thread-1', turnId: 'turn-b' } }),
  );

  assert.deepEqual(calls.map((call) => call.method), [
    'thread/read',
    'thread/fork',
    'thread/rollback',
    'turn/start',
  ]);
  assert.equal(calls[1].params.threadId, 'thread-1');
  assert.deepEqual(calls[2].params, { threadId: 'thread-2', numTurns: 2 });
  assert.equal(calls[3].params.threadId, 'thread-2');
  assert.equal(result.mode, 'fork');
  assert.equal(result.threadId, 'thread-2');
  assert.equal(result.rolledBackTurns, 2);
  assert.equal(result.forkedFromThreadId, 'thread-1');
  assert.equal(result.forkedFromTurnId, 'turn-b');
  assert.deepEqual(events.find((event) => event.kind === 'graph-turn-associated'), {
    kind: 'graph-turn-associated',
    clientTag: 'assistant-node',
    threadId: 'thread-2',
    turnId: 'turn-e',
    mode: 'fork',
    forkedFromThreadId: 'thread-1',
    forkedFromTurnId: 'turn-b',
  });
});

test('legacy continuation injects the selected history into a fresh thread', async (t) => {
  const history = [
    { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Earlier question' }] },
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Earlier answer' }] },
  ];
  const { manager, cwd, calls } = createGraphTurnHarness(t, async (method) => {
    if (method === 'thread/start') return { thread: { id: 'thread-legacy' } };
    if (method === 'thread/inject_items') return {};
    if (method === 'turn/start') return { turn: { id: 'turn-new' } };
    throw new Error(`Unexpected request: ${method}`);
  });

  const result = await manager.startGraphTurn(graphTurnArgs(cwd, { legacyHistory: history }));

  assert.deepEqual(calls.map((call) => call.method), [
    'thread/start',
    'thread/inject_items',
    'turn/start',
  ]);
  assert.deepEqual(calls[1].params, { threadId: 'thread-legacy', items: history });
  assert.equal(result.mode, 'legacy');
  assert.equal(result.injectedItemCount, 2);
});
