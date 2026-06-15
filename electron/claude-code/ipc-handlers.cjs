function errorResult(error, fallback) {
  const message = typeof error?.message === 'string' ? error.message.trim() : String(error ?? '').trim();
  return { ok: false, error: message || fallback };
}

function registerClaudeCodeIpcHandlers(options) {
  const { ipcMain, BrowserWindow, manager } = options;

  const broadcast = (payload) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window || window.isDestroyed()) continue;
      window.webContents.send('claude-code:event', payload);
    }
  };
  manager.on('event', broadcast);

  ipcMain.handle('claude-code:status', async () => ({ ok: true, status: manager.status() }));
  ipcMain.handle('claude-code:restart', async () => ({ ok: true, status: manager.restart() }));
  ipcMain.handle('claude-code:graph-turn-start', async (_event, req) => {
    try {
      return { ok: true, result: await manager.startGraphTurn(req ?? {}) };
    } catch (error) {
      return errorResult(error, 'Failed to start the Claude Code turn.');
    }
  });
  ipcMain.handle('claude-code:turn-interrupt', async (_event, req) => {
    try {
      const operationId = String(req?.operationId ?? '').trim();
      if (!operationId) return { ok: false, error: 'Operation id is required.' };
      return manager.interrupt(operationId)
        ? { ok: true }
        : { ok: false, error: 'The Claude Code turn is no longer running.' };
    } catch (error) {
      return errorResult(error, 'Failed to interrupt the Claude Code turn.');
    }
  });

  return () => {
    manager.off('event', broadcast);
  };
}

module.exports = {
  registerClaudeCodeIpcHandlers,
};
