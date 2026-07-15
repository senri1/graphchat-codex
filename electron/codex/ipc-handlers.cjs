const fs = require('fs/promises');
const os = require('os');
const path = require('path');

function errorResult(error, fallback) {
  const message = typeof error?.message === 'string' ? error.message.trim() : String(error ?? '').trim();
  return { ok: false, error: message || fallback };
}

function registerCodexIpcHandlers(options) {
  const { ipcMain, BrowserWindow, shell, dialog, manager } = options;

  const broadcast = (payload) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window || window.isDestroyed()) continue;
      window.webContents.send('codex:event', payload);
    }
  };
  manager.on('event', broadcast);

  ipcMain.handle('codex:status', async () => ({ ok: true, status: manager.status() }));
  ipcMain.handle('codex:start', async () => {
    try {
      return { ok: true, status: await manager.ensureStarted() };
    } catch (error) {
      return errorResult(error, 'Failed to start Codex App Server.');
    }
  });
  ipcMain.handle('codex:restart', async () => {
    try {
      return { ok: true, status: await manager.restart() };
    } catch (error) {
      return errorResult(error, 'Failed to restart Codex App Server.');
    }
  });
  ipcMain.handle('codex:account-read', async () => {
    try {
      return { ok: true, result: await manager.request('account/read', { refreshToken: false }) };
    } catch (error) {
      return errorResult(error, 'Failed to read the Codex account.');
    }
  });
  ipcMain.handle('codex:login-start', async () => {
    try {
      const result = await manager.request('account/login/start', { type: 'chatgptDeviceCode' }, { timeoutMs: 60_000 });
      const url = typeof result?.verificationUrl === 'string' ? result.verificationUrl.trim() : '';
      if (url) await shell.openExternal(url);
      return { ok: true, result };
    } catch (error) {
      return errorResult(error, 'Failed to start ChatGPT login.');
    }
  });
  ipcMain.handle('codex:logout', async () => {
    try {
      return { ok: true, result: await manager.request('account/logout', {}) };
    } catch (error) {
      return errorResult(error, 'Failed to sign out of Codex.');
    }
  });
  ipcMain.handle('codex:rate-limits-read', async () => {
    try {
      return { ok: true, result: await manager.request('account/rateLimits/read', {}) };
    } catch (error) {
      return errorResult(error, 'Failed to read Codex rate limits.');
    }
  });
  ipcMain.handle('codex:model-list', async () => {
    try {
      await manager.ensureLatestBinary();
      return {
        ok: true,
        result: await manager.request('model/list', {
          cursor: null,
          limit: 100,
          includeHidden: false,
        }),
      };
    } catch (error) {
      return errorResult(error, 'Failed to list Codex models.');
    }
  });
  ipcMain.handle('codex:thread-list', async (_event, req) => {
    try {
      return {
        ok: true,
        result: await manager.request(
          'thread/list',
          {
            cursor: typeof req?.cursor === 'string' && req.cursor.trim() ? req.cursor.trim() : null,
            limit: Number.isFinite(Number(req?.limit)) ? Math.max(1, Math.min(200, Number(req.limit))) : 100,
            sortKey: 'updated_at',
            sortDirection: 'desc',
            archived: false,
            modelProviders: ['openai'],
            ...(typeof req?.searchTerm === 'string' && req.searchTerm.trim()
              ? { searchTerm: req.searchTerm.trim() }
              : {}),
          },
          { timeoutMs: 60_000 },
        ),
      };
    } catch (error) {
      return errorResult(error, 'Failed to list Codex threads.');
    }
  });
  ipcMain.handle('codex:thread-read', async (_event, req) => {
    try {
      const threadId = typeof req?.threadId === 'string' ? req.threadId.trim() : '';
      if (!threadId) return { ok: false, error: 'Thread id is required.' };
      return {
        ok: true,
        result: await manager.request(
          'thread/read',
          { threadId, includeTurns: true },
          { timeoutMs: 60_000 },
        ),
      };
    } catch (error) {
      return errorResult(error, 'Failed to read the Codex thread.');
    }
  });
  ipcMain.handle('codex:test-turn-start', async (_event, req) => {
    try {
      return { ok: true, result: await manager.startDiagnosticTurn(req ?? {}) };
    } catch (error) {
      return errorResult(error, 'Failed to start the Codex diagnostic turn.');
    }
  });
  ipcMain.handle('codex:working-folder-default', async () => {
    try {
      const defaultPath = path.join(os.homedir(), '.graphchat-codex', 'threads');
      await fs.mkdir(defaultPath, { recursive: true });
      return { ok: true, path: defaultPath };
    } catch (error) {
      return errorResult(error, 'Failed to prepare the default Codex working folder.');
    }
  });
  ipcMain.handle('codex:working-folder-pick', async (event, req) => {
    try {
      const browserWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined;
      const defaultPath = typeof req?.defaultPath === 'string' ? req.defaultPath.trim() : '';
      const result = await dialog.showOpenDialog(browserWindow, {
        title: 'Select Codex working folder',
        ...(defaultPath ? { defaultPath } : {}),
        properties: ['openDirectory', 'createDirectory'],
      });
      if (result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
        return { ok: true, canceled: true };
      }
      const path = String(result.filePaths[0] ?? '').trim();
      return path ? { ok: true, canceled: false, path } : { ok: true, canceled: true };
    } catch (error) {
      return errorResult(error, 'Failed to select the Codex working folder.');
    }
  });
  ipcMain.handle('codex:graph-turn-start', async (_event, req) => {
    try {
      return { ok: true, result: await manager.startGraphTurn(req ?? {}) };
    } catch (error) {
      return errorResult(error, 'Failed to start the Codex graph turn.');
    }
  });
  ipcMain.handle('codex:turn-interrupt', async (_event, req) => {
    try {
      const threadId = String(req?.threadId ?? '').trim();
      const turnId = String(req?.turnId ?? '').trim();
      if (!threadId || !turnId) return { ok: false, error: 'Thread id and turn id are required.' };
      return { ok: true, result: await manager.request('turn/interrupt', { threadId, turnId }) };
    } catch (error) {
      return errorResult(error, 'Failed to interrupt the Codex turn.');
    }
  });
  ipcMain.handle('codex:server-request-respond', async (_event, req) => {
    try {
      if (req?.id === undefined || req?.id === null) return { ok: false, error: 'Request id is required.' };
      manager.respondToServerRequest(req.id, req.result ?? {});
      return { ok: true };
    } catch (error) {
      return errorResult(error, 'Failed to answer the Codex request.');
    }
  });

  return () => {
    manager.off('event', broadcast);
  };
}

module.exports = {
  registerCodexIpcHandlers,
};
