import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLAUDE_CODE_MODELS,
  migrateClaudeCodeModelId,
} from './models.ts';
import { mergeClaudeCodeResultText } from './streamText.ts';

function effortsFor(apiModel: string): Array<string | undefined> {
  return CLAUDE_CODE_MODELS
    .filter((model) => model.apiModel === apiModel)
    .map((model) => model.claudeCodeEffort);
}

test('exposes versioned Claude Code models with model-specific effort levels', () => {
  assert.deepEqual(effortsFor('claude-fable-5'), ['low', 'medium', 'high', 'xhigh', 'max']);
  assert.deepEqual(effortsFor('claude-opus-4-8'), ['low', 'medium', 'high', 'xhigh', 'max']);
  assert.deepEqual(effortsFor('claude-opus-5'), ['low', 'medium', 'high', 'xhigh', 'max']);
  assert.deepEqual(effortsFor('claude-sonnet-4-6'), ['low', 'medium', 'high', 'max']);
  assert.deepEqual(effortsFor('claude-haiku-4-5-20251001'), [undefined]);
  assert.equal(CLAUDE_CODE_MODELS.length, 20);
});

test('model labels include exact versions and full CLI model ids', () => {
  for (const model of CLAUDE_CODE_MODELS) {
    assert.match(model.shortLabel ?? '', /^Claude (Fable 5|Opus (4\.8|5)|Sonnet 4\.6|Haiku 4\.5)/);
    assert.match(model.label, new RegExp(`\\[${model.apiModel}\\]$`));
  }
});

test('migrates the original moving aliases to versioned defaults', () => {
  assert.equal(
    migrateClaudeCodeModelId('claude-code:opus'),
    'claude-code:claude-opus-5:high',
  );
  assert.equal(
    migrateClaudeCodeModelId('claude-code:sonnet'),
    'claude-code:claude-sonnet-4-6:high',
  );
  assert.equal(
    migrateClaudeCodeModelId('claude-code:haiku'),
    'claude-code:claude-haiku-4-5-20251001',
  );
});

test('preserves streamed Claude text when the final result is shorter', () => {
  assert.equal(
    mergeClaudeCodeResultText('A long streamed answer with details.', 'answer'),
    'A long streamed answer with details.',
  );
});

test('merges Claude final result without dropping visible text', () => {
  assert.equal(mergeClaudeCodeResultText('', 'Final answer'), 'Final answer');
  assert.equal(
    mergeClaudeCodeResultText('Working note', 'Final answer'),
    'Working note\n\nFinal answer',
  );
  assert.equal(
    mergeClaudeCodeResultText('Final', 'Final answer'),
    'Final answer',
  );
});
