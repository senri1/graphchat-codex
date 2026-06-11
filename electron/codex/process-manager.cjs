const { EventEmitter } = require('events');
const { spawnSync } = require('child_process');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { JsonRpcProcessClient } = require('./json-rpc-client.cjs');

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

function normalizeInjectedHistory(value) {
  if (!Array.isArray(value)) return [];
  if (value.length > 2_000) throw new Error('Legacy history contains too many messages.');

  const out = [];
  let totalChars = 0;
  for (const item of value) {
    if (!item || item.type !== 'message') throw new Error('Legacy history contains an unsupported item.');
    const role = item.role === 'user' || item.role === 'assistant' ? item.role : null;
    if (!role) throw new Error('Legacy history contains an unsupported message role.');

    const expectedType = role === 'user' ? 'input_text' : 'output_text';
    const parts = [];
    for (const content of Array.isArray(item.content) ? item.content : []) {
      if (!content || content.type !== expectedType || typeof content.text !== 'string') {
        throw new Error('Legacy history contains unsupported message content.');
      }
      if (!content.text.trim()) continue;
      totalChars += content.text.length;
      if (totalChars > 10_000_000) throw new Error('Legacy history is too large to inject.');
      parts.push({ type: expectedType, text: content.text });
    }
    if (parts.length) out.push({ type: 'message', role, content: parts });
  }
  return out;
}

function executableNames(platform = process.platform) {
  return platform === 'win32' ? ['codex.exe', 'codex.cmd', 'codex'] : ['codex'];
}

function pathCandidates(platform = process.platform, env = process.env) {
  const names = executableNames(platform);
  const out = [];
  for (const entry of String(env.PATH ?? '').split(path.delimiter)) {
    const dir = cleanString(entry);
    if (!dir) continue;
    for (const name of names) out.push(path.join(dir, name));
  }
  return out;
}

function windowsCodexCandidates(env = process.env, fileSystem = fsSync) {
  const localAppData = cleanString(env.LOCALAPPDATA);
  if (!localAppData) return [];

  const binDir = path.join(localAppData, 'OpenAI', 'Codex', 'bin');
  const versioned = [];
  try {
    for (const entry of fileSystem.readdirSync(binDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(binDir, entry.name, 'codex.exe');
      try {
        const stat = fileSystem.statSync(candidate);
        if (stat.isFile()) versioned.push({ path: candidate, mtimeMs: stat.mtimeMs });
      } catch {
        // Ignore stale or incomplete Codex app update directories.
      }
    }
  } catch {
    // The Codex desktop app is not installed for this user.
  }

  versioned.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return [...versioned.map((item) => item.path), path.join(binDir, 'codex.exe')];
}

function codexCandidates(resourcesPath, options = {}) {
  const platform = cleanString(options.platform) || process.platform;
  const env = options.env ?? process.env;
  const fileSystem = options.fileSystem ?? fsSync;
  const out = [];
  const configured = cleanString(env.GRAPHCHAT_CODEX_BINARY || env.CODEX_BINARY);
  if (configured) out.push(configured);

  if (resourcesPath) {
    out.push(path.join(resourcesPath, platform === 'win32' ? 'codex.exe' : 'codex'));
  }

  if (platform === 'win32') {
    out.push(...windowsCodexCandidates(env, fileSystem));
  }

  if (platform === 'darwin') {
    out.push('/Applications/Codex.app/Contents/Resources/codex');
    out.push(path.join(env.HOME || '', 'Applications', 'Codex.app', 'Contents', 'Resources', 'codex'));
  }

  out.push(...pathCandidates(platform, env));
  return Array.from(new Set(out.map((candidate) => cleanString(candidate)).filter(Boolean)));
}

function probeCodexBinary(candidate) {
  if (candidate.includes(path.sep) && !fsSync.existsSync(candidate)) return null;
  const result = spawnSync(candidate, ['--version'], {
    encoding: 'utf8',
    timeout: 5_000,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) return null;
  const version = cleanString(result.stdout || result.stderr);
  return version ? { path: candidate, version } : null;
}

function findCodexBinary(resourcesPath) {
  for (const candidate of codexCandidates(resourcesPath)) {
    const found = probeCodexBinary(candidate);
    if (found) return found;
  }
  return null;
}

class CodexProcessManager extends EventEmitter {
  constructor(options) {
    super();
    this.app = options.app;
    this.resourcesPath = options.resourcesPath;
    this.client = null;
    this.startPromise = null;
    this.binary = null;
    this.state = 'stopped';
    this.lastError = null;
    this.stderrTail = '';
    this.graphClientTagByTurnId = new Map();
    this.pendingGraphEventsByTurnId = new Map();
    this.pendingGraphStarts = 0;
  }

  status() {
    return {
      state: this.state,
      ready: this.state === 'ready',
      binaryPath: this.binary?.path ?? null,
      version: this.binary?.version ?? null,
      error: this.lastError,
      stderr: this.stderrTail || null,
    };
  }

  async ensureStarted() {
    if (this.state === 'ready' && this.client) return this.status();
    if (this.startPromise) return await this.startPromise;

    this.startPromise = this.#start();
    try {
      return await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  async restart() {
    this.stop();
    return await this.ensureStarted();
  }

  stop() {
    this.client?.stop();
    this.client = null;
    this.graphClientTagByTurnId.clear();
    this.pendingGraphEventsByTurnId.clear();
    this.pendingGraphStarts = 0;
    this.state = 'stopped';
    this.#emitStatus();
  }

  async request(method, params = {}, options = {}) {
    await this.ensureStarted();
    return await this.client.request(method, params, options);
  }

  respondToServerRequest(id, result) {
    if (!this.client) throw new Error('Codex App Server is not running.');
    this.client.respond(id, result);
  }

  async startDiagnosticTurn(args) {
    await this.ensureStarted();
    const model = cleanString(args?.model) || null;
    const prompt = cleanString(args?.prompt) || 'Reply with: GraphChat Codex is connected.';
    const effort = cleanString(args?.effort) || null;
    const workspace = path.join(this.app.getPath('userData'), 'CodexDiagnosticWorkspace');
    await fs.mkdir(workspace, { recursive: true });

    const started = await this.request(
      'thread/start',
      {
        model,
        cwd: workspace,
        sandbox: 'read-only',
        approvalPolicy: 'never',
        developerInstructions:
          'This is a connection diagnostic. Answer the user directly and do not call tools or modify files.',
      },
      { timeoutMs: 60_000 },
    );
    const threadId = cleanString(started?.thread?.id);
    if (!threadId) throw new Error('Codex did not return a thread id.');

    const turnResult = await this.request(
      'turn/start',
      {
        threadId,
        input: [{ type: 'text', text: prompt }],
        ...(model ? { model } : {}),
        ...(effort ? { effort } : {}),
        summary: 'auto',
      },
      { timeoutMs: 60_000 },
    );
    const turnId = cleanString(turnResult?.turn?.id);
    if (!turnId) throw new Error('Codex did not return a turn id.');
    return { threadId, turnId };
  }

  async startGraphTurn(args) {
    await this.ensureStarted();
    const clientTag = cleanString(args?.clientTag);
    const cwd = cleanString(args?.cwd);
    const prompt = cleanString(args?.prompt);
    const model = cleanString(args?.model);
    const effort = cleanString(args?.effort) || null;
    const developerInstructions = cleanString(args?.developerInstructions) || null;
    const sourceThreadId = cleanString(args?.source?.threadId);
    const sourceTurnId = cleanString(args?.source?.turnId);
    const legacyHistory = normalizeInjectedHistory(args?.legacyHistory);

    if (!clientTag) throw new Error('Graph turn client tag is required.');
    if (!cwd) throw new Error('Select a Codex working folder before sending.');
    if (!prompt) throw new Error('A text prompt is required.');
    if (!model) throw new Error('A Codex model is required.');
    if (legacyHistory.length && (sourceThreadId || sourceTurnId)) {
      throw new Error('Legacy history cannot be combined with a native Codex source turn.');
    }

    const stat = await fs.stat(cwd).catch(() => null);
    if (!stat?.isDirectory()) throw new Error(`Codex working folder is unavailable: ${cwd}`);

    const threadOptions = {
      cwd,
      model,
      sandbox: 'workspace-write',
      approvalPolicy: 'on-request',
      ...(developerInstructions ? { developerInstructions } : {}),
    };

    let threadId = '';
    let forkedFromThreadId = null;
    let mode = 'new';
    let rolledBackTurns = 0;
    let injectedItemCount = 0;

    if (sourceThreadId || sourceTurnId) {
      if (!sourceThreadId || !sourceTurnId) {
        throw new Error('Both source thread id and source turn id are required.');
      }
      const read = await this.request(
        'thread/read',
        { threadId: sourceThreadId, includeTurns: true },
        { timeoutMs: 60_000 },
      );
      const sourceThread = read?.thread;
      const sourceCwd = cleanString(sourceThread?.cwd);
      if (sourceCwd && path.resolve(sourceCwd) !== path.resolve(cwd)) {
        throw new Error(
          `This Codex thread belongs to a different working folder (${sourceCwd}). Create a new chat to use ${cwd}.`,
        );
      }
      const turns = Array.isArray(sourceThread?.turns) ? sourceThread.turns : [];
      const targetIndex = turns.findIndex((turn) => cleanString(turn?.id) === sourceTurnId);
      if (targetIndex < 0) {
        throw new Error('The selected GraphChat node no longer matches a turn in its Codex thread.');
      }
      const sourceStatus = cleanString(sourceThread?.status?.type);
      if (sourceStatus === 'active') {
        throw new Error('This Codex thread is active in another client. Wait for it to finish before continuing or branching.');
      }

      rolledBackTurns = turns.length - targetIndex - 1;
      if (rolledBackTurns > 0) {
        const forked = await this.request(
          'thread/fork',
          { threadId: sourceThreadId, ...threadOptions },
          { timeoutMs: 60_000 },
        );
        threadId = cleanString(forked?.thread?.id);
        if (!threadId) throw new Error('Codex did not return a forked thread id.');
        await this.request(
          'thread/rollback',
          { threadId, numTurns: rolledBackTurns },
          { timeoutMs: 60_000 },
        );
        forkedFromThreadId = sourceThreadId;
        mode = 'fork';
      } else {
        const resumed = await this.request(
          'thread/resume',
          { threadId: sourceThreadId, ...threadOptions },
          { timeoutMs: 60_000 },
        );
        threadId = cleanString(resumed?.thread?.id) || sourceThreadId;
        mode = 'continue';
      }
    } else {
      const started = await this.request('thread/start', threadOptions, { timeoutMs: 60_000 });
      threadId = cleanString(started?.thread?.id);
      if (!threadId) throw new Error('Codex did not return a thread id.');
      if (legacyHistory.length) {
        try {
          await this.request(
            'thread/inject_items',
            { threadId, items: legacyHistory },
            { timeoutMs: 60_000 },
          );
        } catch (error) {
          await this.request('thread/archive', { threadId }, { timeoutMs: 15_000 }).catch(() => {});
          throw error;
        }
        injectedItemCount = legacyHistory.length;
        mode = 'legacy';
      }
    }

    this.pendingGraphStarts += 1;
    try {
      const turnResult = await this.request(
        'turn/start',
        {
          threadId,
          input: [{ type: 'text', text: prompt }],
          model,
          ...(effort ? { effort } : {}),
          summary: 'auto',
        },
        { timeoutMs: 60_000 },
      );
      const turnId = cleanString(turnResult?.turn?.id);
      if (!turnId) throw new Error('Codex did not return a turn id.');
      this.graphClientTagByTurnId.set(turnId, clientTag);
      this.emit('event', {
        kind: 'graph-turn-associated',
        clientTag,
        threadId,
        turnId,
        mode,
        forkedFromThreadId,
        forkedFromTurnId: mode === 'fork' ? sourceTurnId : null,
      });
      this.#flushPendingGraphEvents(turnId, clientTag);
      return {
        clientTag,
        threadId,
        turnId,
        mode,
        rolledBackTurns,
        injectedItemCount,
        forkedFromThreadId,
        forkedFromTurnId: mode === 'fork' ? sourceTurnId : null,
      };
    } finally {
      this.pendingGraphStarts = Math.max(0, this.pendingGraphStarts - 1);
    }
  }

  async #start() {
    this.state = 'starting';
    this.lastError = null;
    this.stderrTail = '';
    this.#emitStatus();

    const binary = findCodexBinary(this.resourcesPath);
    if (!binary) {
      const error = 'No working Codex executable was found. Install Codex or set GRAPHCHAT_CODEX_BINARY.';
      this.state = 'error';
      this.lastError = error;
      this.#emitStatus();
      throw new Error(error);
    }
    this.binary = binary;
    const userDataPath = this.app.getPath('userData');
    await fs.mkdir(userDataPath, { recursive: true });

    const client = new JsonRpcProcessClient({
      command: binary.path,
      args: ['app-server', '--listen', 'stdio://'],
      env: { ...process.env },
      cwd: userDataPath,
    });
    this.client = client;

    client.on('notification', (message) => {
      this.#emitCodexEvent({
        kind: 'notification',
        method: message.method,
        params: message.params ?? {},
      });
    });
    client.on('server-request', (message) => {
      this.#emitCodexEvent({
        kind: 'server-request',
        id: message.id,
        method: message.method,
        params: message.params ?? {},
      });
    });
    client.on('stderr', (text) => {
      this.stderrTail = `${this.stderrTail}${String(text ?? '')}`.slice(-8_000);
      this.emit('event', { kind: 'stderr', text: String(text ?? '') });
    });
    client.on('protocol-error', (error, line) => {
      this.emit('event', {
        kind: 'protocol-error',
        error: cleanString(error?.message) || 'Codex protocol error.',
        line: String(line ?? '').slice(0, 2_000),
      });
    });
    client.on('closed', (error) => {
      if (this.client !== client) return;
      this.client = null;
      this.state = 'error';
      this.lastError = cleanString(error?.message) || 'Codex App Server stopped unexpectedly.';
      this.#emitStatus();
    });

    try {
      await client.start();
      await client.request(
        'initialize',
        {
          clientInfo: {
            name: 'graphchat_codex',
            title: 'GraphChat Codex',
            version: '0.1.0',
          },
          capabilities: {
            experimentalApi: true,
          },
        },
        { timeoutMs: 30_000 },
      );
      client.notify('initialized', {});
      this.state = 'ready';
      this.lastError = null;
      this.#emitStatus();
      return this.status();
    } catch (error) {
      client.stop();
      if (this.client === client) this.client = null;
      this.state = 'error';
      this.lastError = cleanString(error?.message) || 'Failed to initialize Codex App Server.';
      this.#emitStatus();
      throw error;
    }
  }

  #emitStatus() {
    this.emit('event', { kind: 'status', status: this.status() });
  }

  #emitCodexEvent(event) {
    const turnId = cleanString(event?.params?.turnId || event?.params?.turn?.id);
    const clientTag = turnId ? this.graphClientTagByTurnId.get(turnId) : null;
    if (clientTag) {
      this.emit('event', { ...event, clientTag });
      if (event.kind === 'notification' && event.method === 'turn/completed') {
        this.graphClientTagByTurnId.delete(turnId);
      }
      return;
    }

    this.emit('event', event);
    if (!turnId || this.pendingGraphStarts <= 0) return;
    const queued = this.pendingGraphEventsByTurnId.get(turnId) ?? [];
    queued.push(event);
    this.pendingGraphEventsByTurnId.set(turnId, queued.slice(-200));
  }

  #flushPendingGraphEvents(turnId, clientTag) {
    const queued = this.pendingGraphEventsByTurnId.get(turnId) ?? [];
    this.pendingGraphEventsByTurnId.delete(turnId);
    for (const event of queued) {
      this.emit('event', { ...event, clientTag, replayed: true });
      if (event.kind === 'notification' && event.method === 'turn/completed') {
        this.graphClientTagByTurnId.delete(turnId);
      }
    }
  }
}

module.exports = {
  CodexProcessManager,
  codexCandidates,
  findCodexBinary,
  windowsCodexCandidates,
};
