const { EventEmitter } = require('events');
const { randomUUID } = require('crypto');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

function executableNames(platform = process.platform) {
  return platform === 'win32' ? ['claude.exe', 'claude', 'claude.cmd'] : ['claude'];
}

function pathCandidates(platform = process.platform, env = process.env) {
  const names = executableNames(platform);
  const out = [];
  for (const entry of String(env.PATH ?? env.Path ?? '').split(path.delimiter)) {
    const dir = cleanString(entry);
    if (!dir) continue;
    for (const name of names) out.push(path.join(dir, name));
  }
  return out;
}

function claudeCodeCandidates(resourcesPath, options = {}) {
  const platform = cleanString(options.platform) || process.platform;
  const env = options.env ?? process.env;
  const out = [];
  const configured = cleanString(env.GRAPHCHAT_CLAUDE_CODE_BINARY || env.CLAUDE_CODE_BINARY);
  if (configured) out.push(configured);

  if (resourcesPath) {
    out.push(path.join(resourcesPath, platform === 'win32' ? 'claude.exe' : 'claude'));
  }

  const home = cleanString(env.USERPROFILE || env.HOME);
  if (home) out.push(path.join(home, '.local', 'bin', platform === 'win32' ? 'claude.exe' : 'claude'));

  if (platform === 'win32') {
    const appData = cleanString(env.APPDATA);
    const localAppData = cleanString(env.LOCALAPPDATA);
    if (appData) {
      out.push(path.join(appData, 'npm', 'claude.exe'));
      out.push(path.join(appData, 'npm', 'claude.cmd'));
    }
    if (localAppData) {
      out.push(path.join(localAppData, 'Microsoft', 'WinGet', 'Links', 'claude.exe'));
    }
  } else if (platform === 'darwin') {
    out.push('/opt/homebrew/bin/claude', '/usr/local/bin/claude');
  } else {
    out.push('/usr/local/bin/claude', '/usr/bin/claude');
  }

  out.push(...pathCandidates(platform, env));
  return Array.from(new Set(out.map(cleanString).filter(Boolean)));
}

function probeClaudeCodeBinary(candidate) {
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

function findClaudeCodeBinary(resourcesPath, options = {}) {
  for (const candidate of claudeCodeCandidates(resourcesPath, options)) {
    const found = probeClaudeCodeBinary(candidate);
    if (found) return found;
  }
  return null;
}

function claudeCodePermissionSettings(value) {
  const mode = cleanString(value) || 'full-access';
  if (mode === 'full-access') {
    return {
      mode,
      cliMode: 'bypassPermissions',
      extraArgs: ['--dangerously-skip-permissions'],
    };
  }
  if (mode === 'workspace-write') {
    return { mode, cliMode: 'acceptEdits', extraArgs: [] };
  }
  if (mode === 'read-only') {
    return { mode, cliMode: 'plan', extraArgs: [] };
  }
  throw new Error(`Unsupported Claude Code permission mode: ${mode}`);
}

const CLAUDE_CODE_EFFORT_LEVELS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

function normalizeClaudeCodeEffort(value) {
  const effort = cleanString(value).toLowerCase();
  if (!effort) return '';
  if (CLAUDE_CODE_EFFORT_LEVELS.has(effort)) return effort;
  throw new Error(`Unsupported Claude Code effort level: ${effort}`);
}

function textFromContent(content) {
  if (!Array.isArray(content)) return '';
  return content
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('');
}

function textDeltaFromStreamEvent(message) {
  const event = message?.type === 'stream_event' ? message.event : null;
  if (event?.type !== 'content_block_delta') return '';
  return event.delta?.type === 'text_delta' && typeof event.delta.text === 'string'
    ? event.delta.text
    : '';
}

function sameOrContained(current, next) {
  const left = cleanString(current);
  const right = cleanString(next);
  if (!left) return next;
  if (!right) return current;
  if (left === right) return current;
  if (left.includes(right)) return current;
  if (right.includes(left)) return next;
  return `${String(current).trimEnd()}\n\n${String(next).trimStart()}`;
}

function toolUsesFromAssistantMessage(message) {
  if (message?.type !== 'assistant' || !Array.isArray(message.message?.content)) return [];
  return message.message.content
    .filter((block) => block?.type === 'tool_use' && cleanString(block.name))
    .map((block) => ({
      id: cleanString(block.id) || randomUUID(),
      name: cleanString(block.name),
      input: block.input ?? {},
    }));
}

function toolResultsFromUserMessage(message) {
  if (message?.type !== 'user' || !Array.isArray(message.message?.content)) return [];
  return message.message.content
    .filter((block) => block?.type === 'tool_result' && cleanString(block.tool_use_id || block.toolUseId))
    .map((block) => ({
      toolUseId: cleanString(block.tool_use_id || block.toolUseId),
      isError: Boolean(block.is_error || block.isError),
      content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? ''),
    }));
}

function legacyHistoryContext(value) {
  if (!Array.isArray(value) || value.length === 0) return '';
  const lines = [];
  for (const item of value) {
    const role = item?.role === 'assistant' ? 'Assistant' : item?.role === 'user' ? 'User' : '';
    if (!role) continue;
    const text = Array.isArray(item.content)
      ? item.content
          .map((part) => (typeof part?.text === 'string' ? part.text.trim() : ''))
          .filter(Boolean)
          .join('\n')
      : '';
    if (text) lines.push(`${role}:\n${text}`);
  }
  return lines.length
    ? `The following is prior conversation context imported from GraphChat. Continue from it as if it preceded the current request.\n\n${lines.join('\n\n')}`
    : '';
}

function buildClaudeCodeArgs(args) {
  const prompt = cleanString(args?.prompt);
  const model = cleanString(args?.model);
  const sourceSessionId = cleanString(args?.sourceSessionId);
  const sessionId = cleanString(args?.sessionId);
  const appendSystemPrompt = cleanString(args?.appendSystemPrompt);
  const effort = normalizeClaudeCodeEffort(args?.effort);
  const permissions = claudeCodePermissionSettings(args?.permissionMode);

  if (!prompt) throw new Error('A text prompt is required.');
  if (!model) throw new Error('A Claude Code model is required.');
  if (sourceSessionId && sessionId) throw new Error('A Claude Code turn cannot both resume and create a session.');

  const cliArgs = [
    '--print',
    '--input-format',
    'text',
    '--output-format',
    'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--model',
    model,
    '--permission-mode',
    permissions.cliMode,
    ...permissions.extraArgs,
  ];
  if (effort) cliArgs.push('--effort', effort);
  if (appendSystemPrompt) cliArgs.push('--append-system-prompt', appendSystemPrompt);
  if (sourceSessionId) {
    cliArgs.push('--resume', sourceSessionId, '--fork-session');
  } else if (sessionId) {
    cliArgs.push('--session-id', sessionId);
  }
  return cliArgs;
}

class ClaudeCodeProcessManager extends EventEmitter {
  constructor(options) {
    super();
    this.resourcesPath = options.resourcesPath;
    this.binary = null;
    this.lastError = null;
    this.stderrTail = '';
    this.activeByOperationId = new Map();
  }

  status() {
    if (!this.binary) this.binary = findClaudeCodeBinary(this.resourcesPath);
    return {
      state: this.binary ? 'ready' : 'error',
      ready: Boolean(this.binary),
      binaryPath: this.binary?.path ?? null,
      version: this.binary?.version ?? null,
      error: this.binary
        ? this.lastError
        : 'No working Claude Code executable was found. Install Claude Code or set GRAPHCHAT_CLAUDE_CODE_BINARY.',
      stderr: this.stderrTail || null,
    };
  }

  restart() {
    this.binary = findClaudeCodeBinary(this.resourcesPath);
    this.lastError = null;
    return this.status();
  }

  stop() {
    for (const operation of this.activeByOperationId.values()) {
      operation.interrupted = true;
      try {
        operation.child.kill('SIGKILL');
      } catch {
        // Ignore processes that already exited.
      }
    }
    this.activeByOperationId.clear();
  }

  interrupt(operationId) {
    const id = cleanString(operationId);
    const operation = this.activeByOperationId.get(id);
    if (!operation) return false;
    operation.interrupted = true;
    try {
      operation.child.kill('SIGKILL');
    } catch {
      // The close handler will report the final state.
    }
    return true;
  }

  async startGraphTurn(args) {
    const clientTag = cleanString(args?.clientTag);
    const cwd = cleanString(args?.cwd);
    const model = cleanString(args?.model);
    const prompt = cleanString(args?.prompt);
    const sourceSessionId = cleanString(args?.source?.sessionId);
    const historyContext = legacyHistoryContext(args?.legacyHistory);

    if (!clientTag) throw new Error('Graph turn client tag is required.');
    if (!cwd) throw new Error('Select a Claude Code working folder before sending.');
    if (!prompt) throw new Error('A text prompt is required.');
    if (!model) throw new Error('A Claude Code model is required.');

    const stat = await fs.stat(cwd).catch(() => null);
    if (!stat?.isDirectory()) throw new Error(`Claude Code working folder is unavailable: ${cwd}`);

    const status = this.status();
    if (!status.ready || !this.binary) throw new Error(status.error);

    const operationId = randomUUID();
    const requestedSessionId = sourceSessionId ? '' : randomUUID();
    const effectivePrompt = historyContext ? `${historyContext}\n\nCurrent request:\n${prompt}` : prompt;
    const cliArgs = buildClaudeCodeArgs({
      prompt: effectivePrompt,
      model,
      effort: args?.effort,
      permissionMode: args?.permissionMode,
      appendSystemPrompt: args?.developerInstructions,
      sourceSessionId,
      sessionId: requestedSessionId,
    });

    const child = spawn(this.binary.path, cliArgs, {
      cwd,
      env: { ...process.env },
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const operation = {
      child,
      clientTag,
      operationId,
      sessionId: requestedSessionId,
      interrupted: false,
      completed: false,
      stdoutBuffer: '',
      stderrTail: '',
      stdinError: '',
      streamMessage: null,
      toolUseGroupById: new Map(),
    };
    this.activeByOperationId.set(operationId, operation);

    const started = new Promise((resolve, reject) => {
      let settled = false;
      const finishStart = (error, sessionId) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(sessionId);
      };
      const timer = setTimeout(() => {
        finishStart(new Error('Claude Code did not initialize within 30 seconds.'));
        operation.interrupted = true;
        try {
          child.kill('SIGKILL');
        } catch {
          // Ignore a process that exited during timeout handling.
        }
      }, 30_000);

      const eventSessionId = (sessionId) => operation.sessionId || sessionId || null;
      const emitAssistantProgress = (stream, sessionId) => {
        const text = typeof stream?.text === 'string' ? stream.text.trim() : '';
        if (!text) return;
        if (stream.progressFlushed && stream.lastProgressText === text) return;
        stream.progressFlushed = true;
        stream.lastProgressText = text;
        this.emit('event', {
          kind: 'assistant-progress',
          clientTag,
          operationId,
          sessionId: eventSessionId(sessionId),
          messageId: stream.id,
          batchId: stream.batchId,
          text,
        });
      };
      const emitAssistantFinal = (stream, sessionId) => {
        const text = typeof stream?.text === 'string' ? stream.text.trim() : '';
        if (!text) return;
        this.emit('event', {
          kind: 'assistant-message',
          clientTag,
          operationId,
          sessionId: eventSessionId(sessionId),
          text,
        });
      };
      const ensureStreamMessage = (message) => {
        if (operation.streamMessage) return operation.streamMessage;
        const id =
          cleanString(message?.event?.message?.id) ||
          cleanString(message?.message?.id) ||
          cleanString(message?.uuid) ||
          randomUUID();
        operation.streamMessage = {
          id,
          batchId: randomUUID(),
          text: '',
          hasToolUse: false,
          progressFlushed: false,
          lastProgressText: '',
        };
        return operation.streamMessage;
      };

      const handleStreamEvent = (message, sessionId) => {
        const streamEvent = message?.event;
        const type = cleanString(streamEvent?.type);
        if (type === 'message_start') {
          operation.streamMessage = {
            id:
              cleanString(streamEvent?.message?.id) ||
              cleanString(message?.uuid) ||
              randomUUID(),
            batchId: randomUUID(),
            text: '',
            hasToolUse: false,
            progressFlushed: false,
            lastProgressText: '',
          };
          return;
        }

        const stream = ensureStreamMessage(message);
        if (type === 'content_block_start') {
          const block = streamEvent?.content_block;
          const blockType = cleanString(block?.type);
          if (blockType === 'text' && typeof block.text === 'string') {
            stream.text = sameOrContained(stream.text, block.text);
          } else if (blockType === 'tool_use') {
            stream.hasToolUse = true;
            emitAssistantProgress(stream, sessionId);
          }
          return;
        }

        if (type === 'content_block_delta') {
          const delta = streamEvent?.delta;
          if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
            stream.text += delta.text;
            if (stream.hasToolUse && stream.progressFlushed) emitAssistantProgress(stream, sessionId);
          }
          return;
        }

        if (type === 'message_stop') {
          if (stream.hasToolUse) emitAssistantProgress(stream, sessionId);
          else emitAssistantFinal(stream, sessionId);
          operation.streamMessage = null;
        }
      };

      const handleMessage = (message) => {
        const sessionId = cleanString(message?.session_id);
        if (sessionId) {
          operation.sessionId = sessionId;
          finishStart(null, sessionId);
        }

        if (message?.type === 'stream_event') {
          handleStreamEvent(message, sessionId);
        }

        if (message?.type === 'assistant') {
          const text = textFromContent(message.message?.content);
          const tools = toolUsesFromAssistantMessage(message);
          if (text) {
            if (operation.streamMessage) {
              operation.streamMessage.text = sameOrContained(operation.streamMessage.text, text);
              if (operation.streamMessage.hasToolUse) emitAssistantProgress(operation.streamMessage, sessionId);
            } else if (tools.length > 0) {
              const stream = ensureStreamMessage(message);
              stream.text = sameOrContained(stream.text, text);
              stream.hasToolUse = true;
              emitAssistantProgress(stream, sessionId);
            } else {
              this.emit('event', {
                kind: 'assistant-message',
                clientTag,
                operationId,
                sessionId: eventSessionId(sessionId),
                text,
              });
            }
          }
          if (tools.length > 0) {
            const stream = ensureStreamMessage(message);
            stream.hasToolUse = true;
            emitAssistantProgress(stream, sessionId);
          }
          for (const tool of tools) {
            const stream = ensureStreamMessage(message);
            operation.toolUseGroupById.set(tool.id, stream.batchId);
            this.emit('event', {
              kind: 'tool-use',
              clientTag,
              operationId,
              sessionId: eventSessionId(sessionId),
              batchId: stream.batchId,
              tool,
            });
          }
        }

        if (message?.type === 'user') {
          for (const toolResult of toolResultsFromUserMessage(message)) {
            this.emit('event', {
              kind: 'tool-result',
              clientTag,
              operationId,
              sessionId: eventSessionId(sessionId),
              batchId: operation.toolUseGroupById.get(toolResult.toolUseId) || null,
              toolResult,
            });
          }
        }

        if (message?.type === 'system' && message?.subtype === 'permission_denied') {
          this.emit('event', {
            kind: 'permission-denied',
            clientTag,
            operationId,
            sessionId: eventSessionId(sessionId),
            toolName: cleanString(message.tool_name),
            message: cleanString(message.message) || 'Claude Code denied a tool request.',
          });
        }

        if (message?.type === 'result') {
          operation.completed = true;
          const success = message.subtype === 'success' && !message.is_error;
          this.emit('event', {
            kind: 'turn-completed',
            clientTag,
            operationId,
            sessionId: eventSessionId(sessionId),
            status: success ? 'completed' : 'failed',
            result: typeof message.result === 'string' ? message.result : '',
            error: success
              ? null
              : Array.isArray(message.errors)
                ? message.errors.map(cleanString).filter(Boolean).join('\n')
                : `Claude Code ended with ${cleanString(message.subtype) || 'an error'}.`,
            usage: message.usage ?? null,
            costUsd: Number.isFinite(Number(message.total_cost_usd)) ? Number(message.total_cost_usd) : null,
          });
        }

        this.emit('event', {
          kind: 'message',
          clientTag,
          operationId,
          sessionId: eventSessionId(sessionId),
          message,
        });
      };

      child.stdout.on('data', (chunk) => {
        operation.stdoutBuffer += chunk.toString('utf8');
        const lines = operation.stdoutBuffer.split(/\r?\n/);
        operation.stdoutBuffer = lines.pop() ?? '';
        for (const line of lines) {
          const raw = line.trim();
          if (!raw) continue;
          try {
            handleMessage(JSON.parse(raw));
          } catch (error) {
            this.emit('event', {
              kind: 'protocol-error',
              clientTag,
              operationId,
              error: cleanString(error?.message) || 'Invalid Claude Code stream event.',
              line: raw.slice(0, 2_000),
            });
          }
        }
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString('utf8');
        operation.stderrTail = `${operation.stderrTail}${text}`.slice(-8_000);
        this.stderrTail = `${this.stderrTail}${text}`.slice(-8_000);
        this.emit('event', { kind: 'stderr', clientTag, operationId, text });
      });

      child.stdin.on('error', (error) => {
        operation.stdinError = cleanString(error?.message) || 'Failed to write prompt to Claude Code.';
      });

      child.on('error', (error) => {
        this.lastError = cleanString(error?.message) || 'Failed to start Claude Code.';
        finishStart(new Error(this.lastError));
        if (!operation.completed) {
          operation.completed = true;
          this.emit('event', {
            kind: 'turn-completed',
            clientTag,
            operationId,
            sessionId: operation.sessionId || null,
            status: operation.interrupted ? 'interrupted' : 'failed',
            result: '',
            error: operation.interrupted ? 'Canceled' : this.lastError,
          });
        }
      });

      child.on('close', (code) => {
        this.activeByOperationId.delete(operationId);
        if (!settled) {
          finishStart(
            new Error(
              operation.stderrTail.trim() ||
                operation.stdinError ||
                `Claude Code exited before initialization (${code ?? 'unknown'}).`,
            ),
          );
        }
        if (operation.completed) return;
        operation.completed = true;
        this.emit('event', {
          kind: 'turn-completed',
          clientTag,
          operationId,
          sessionId: operation.sessionId || null,
          status: operation.interrupted ? 'interrupted' : code === 0 ? 'completed' : 'failed',
          result: '',
          error: operation.interrupted
            ? 'Canceled'
            : code === 0
              ? null
              : operation.stderrTail.trim() ||
                operation.stdinError ||
                `Claude Code exited with code ${code ?? 'unknown'}.`,
        });
      });

      try {
        child.stdin.end(effectivePrompt, 'utf8');
      } catch (error) {
        operation.stdinError = cleanString(error?.message) || 'Failed to write prompt to Claude Code.';
        finishStart(new Error(operation.stdinError));
      }
    });

    const sessionId = await started;
    this.emit('event', {
      kind: 'graph-turn-associated',
      clientTag,
      operationId,
      sessionId,
      mode: sourceSessionId ? 'fork' : historyContext ? 'legacy' : 'new',
      forkedFromSessionId: sourceSessionId || null,
    });
    return {
      clientTag,
      operationId,
      sessionId,
      mode: sourceSessionId ? 'fork' : historyContext ? 'legacy' : 'new',
      forkedFromSessionId: sourceSessionId || null,
    };
  }
}

module.exports = {
  ClaudeCodeProcessManager,
  buildClaudeCodeArgs,
  claudeCodeCandidates,
  normalizeClaudeCodeEffort,
  claudeCodePermissionSettings,
  findClaudeCodeBinary,
  legacyHistoryContext,
  textDeltaFromStreamEvent,
  textFromContent,
  toolResultsFromUserMessage,
  toolUsesFromAssistantMessage,
};
