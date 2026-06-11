const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  codexCandidates,
  windowsCodexCandidates,
} = require('../electron/codex/process-manager.cjs');

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
