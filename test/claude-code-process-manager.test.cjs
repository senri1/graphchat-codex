const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  buildClaudeCodeArgs,
  claudeCodeCandidates,
  claudeCodePermissionSettings,
  legacyHistoryContext,
  textDeltaFromStreamEvent,
  textFromContent,
  toolUsesFromAssistantMessage,
} = require('../electron/claude-code/process-manager.cjs');

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
    model: 'sonnet',
    permissionMode: 'full-access',
    appendSystemPrompt: 'Use the current project.',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
  });

  assert.deepEqual(args, [
    '--print',
    '--output-format',
    'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--model',
    'sonnet',
    '--permission-mode',
    'bypassPermissions',
    '--dangerously-skip-permissions',
    '--append-system-prompt',
    'Use the current project.',
    '--session-id',
    '550e8400-e29b-41d4-a716-446655440000',
    'Fix the test',
  ]);
});

test('child graph turns resume and fork the selected parent session', () => {
  const args = buildClaudeCodeArgs({
    prompt: 'Now add coverage',
    model: 'opus',
    permissionMode: 'workspace-write',
    sourceSessionId: 'parent-session',
  });
  assert.deepEqual(args.slice(-4), [
    '--resume',
    'parent-session',
    '--fork-session',
    'Now add coverage',
  ]);
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
});

test('legacy graph history is converted into prompt context', () => {
  const context = legacyHistoryContext([
    { role: 'user', content: [{ text: 'Question' }] },
    { role: 'assistant', content: [{ text: 'Answer' }] },
  ]);
  assert.match(context, /User:\nQuestion/);
  assert.match(context, /Assistant:\nAnswer/);
});
