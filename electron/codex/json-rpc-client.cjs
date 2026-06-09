const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const readline = require('readline');

class JsonRpcError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'JsonRpcError';
    this.code = details.code;
    this.data = details.data;
    this.method = details.method;
  }
}

class JsonRpcProcessClient extends EventEmitter {
  constructor(options) {
    super();
    this.command = options.command;
    this.args = Array.isArray(options.args) ? options.args : [];
    this.cwd = options.cwd;
    this.env = options.env;
    this.process = null;
    this.stdoutReader = null;
    this.pending = new Map();
    this.nextId = 1;
    this.closed = false;
  }

  async start() {
    if (this.process) return;
    this.closed = false;

    const child = spawn(this.command, this.args, {
      cwd: this.cwd,
      env: this.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    this.process = child;

    child.once('error', (error) => {
      this.emit('process-error', error);
      this.#close(error);
    });
    child.once('exit', (code, signal) => {
      const suffix = signal ? `signal ${signal}` : `code ${code ?? 'unknown'}`;
      this.#close(new Error(`Codex App Server exited with ${suffix}.`));
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      const text = String(chunk ?? '');
      if (text) this.emit('stderr', text);
    });

    this.stdoutReader = readline.createInterface({
      input: child.stdout,
      crlfDelay: Infinity,
    });
    this.stdoutReader.on('line', (line) => this.#handleLine(line));

    await new Promise((resolve, reject) => {
      const onSpawn = () => {
        cleanup();
        resolve();
      };
      const onError = (error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        child.off('spawn', onSpawn);
        child.off('error', onError);
      };
      child.once('spawn', onSpawn);
      child.once('error', onError);
    });
  }

  request(method, params = {}, options = {}) {
    if (!this.process?.stdin?.writable || this.closed) {
      return Promise.reject(new Error('Codex App Server is not running.'));
    }

    const id = this.nextId++;
    const timeoutMs = Number.isFinite(Number(options.timeoutMs))
      ? Math.max(1_000, Number(options.timeoutMs))
      : 30_000;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(String(id));
        reject(new Error(`Codex request timed out: ${method}`));
      }, timeoutMs);

      this.pending.set(String(id), { method, resolve, reject, timer });
      try {
        this.#write({ method, id, params });
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(String(id));
        reject(error);
      }
    });
  }

  notify(method, params = {}) {
    if (!this.process?.stdin?.writable || this.closed) {
      throw new Error('Codex App Server is not running.');
    }
    this.#write({ method, params });
  }

  respond(id, result) {
    this.#write({ id, result });
  }

  respondError(id, error) {
    this.#write({
      id,
      error: {
        code: Number.isFinite(Number(error?.code)) ? Number(error.code) : -32603,
        message: String(error?.message || 'Client failed to handle the server request.'),
        ...(error?.data === undefined ? {} : { data: error.data }),
      },
    });
  }

  stop() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.stdoutReader?.close();
    } catch {
      // ignore
    }
    this.stdoutReader = null;

    const child = this.process;
    this.process = null;
    if (child && !child.killed) {
      try {
        child.kill('SIGTERM');
      } catch {
        // ignore
      }
    }
    this.#rejectPending(new Error('Codex App Server stopped.'));
  }

  #write(message) {
    const stdin = this.process?.stdin;
    if (!stdin?.writable || this.closed) throw new Error('Codex App Server is not writable.');
    stdin.write(`${JSON.stringify(message)}\n`);
  }

  #handleLine(rawLine) {
    const line = String(rawLine ?? '').trim();
    if (!line) return;

    let message;
    try {
      message = JSON.parse(line);
    } catch {
      this.emit('protocol-error', new Error('Codex emitted invalid JSON.'), line);
      return;
    }

    if (message && Object.prototype.hasOwnProperty.call(message, 'id')) {
      const key = String(message.id);
      const pending = this.pending.get(key);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(key);
        if (message.error) {
          pending.reject(
            new JsonRpcError(String(message.error.message || `Codex request failed: ${pending.method}`), {
              code: message.error.code,
              data: message.error.data,
              method: pending.method,
            }),
          );
        } else {
          pending.resolve(message.result);
        }
        return;
      }

      if (typeof message.method === 'string') {
        this.emit('server-request', message);
        return;
      }
    }

    if (message && typeof message.method === 'string') {
      this.emit('notification', message);
      return;
    }

    this.emit('protocol-error', new Error('Codex emitted an unrecognized JSON-RPC message.'), line);
  }

  #close(error) {
    if (this.closed && !this.process) return;
    this.closed = true;
    this.process = null;
    try {
      this.stdoutReader?.close();
    } catch {
      // ignore
    }
    this.stdoutReader = null;
    this.#rejectPending(error);
    this.emit('closed', error);
  }

  #rejectPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

module.exports = {
  JsonRpcError,
  JsonRpcProcessClient,
};
