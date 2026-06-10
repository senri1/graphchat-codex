import assert from 'node:assert/strict';
import test from 'node:test';
import type { ModelInfo } from '../llm/registry.ts';
import { buildCodexComposerModels, resolveCodexComposerModelId } from './models.ts';

const registryModels: ModelInfo[] = [
  {
    id: 'gpt-5.4-high',
    provider: 'openai',
    apiModel: 'gpt-5.4',
    label: 'GPT-5.4 High',
    supportsImageInput: true,
    parameters: { webSearch: true, streaming: true, background: false },
    effort: 'high',
  },
];

test('uses existing registry models and creates options for new Codex models', () => {
  const result = buildCodexComposerModels(
    [
      {
        id: 'gpt-5.5',
        displayName: 'GPT-5.5',
        isDefault: true,
        defaultReasoningEffort: 'medium',
        supportedReasoningEfforts: [{ reasoningEffort: 'medium' }],
      },
      {
        id: 'gpt-5.4',
        displayName: 'GPT-5.4',
        supportedReasoningEfforts: [{ reasoningEffort: 'high' }],
      },
    ],
    registryModels,
  );

  assert.equal(result.defaultModelId, 'codex:gpt-5.5:medium');
  assert.deepEqual(
    result.models.map((model) => [model.id, model.apiModel, model.effort]),
    [
      ['codex:gpt-5.5:medium', 'gpt-5.5', 'medium'],
      ['gpt-5.4-high', 'gpt-5.4', 'high'],
    ],
  );
});

test('replaces a stale legacy selection with the Codex default', () => {
  const result = buildCodexComposerModels(
    [
      {
        id: 'gpt-5.5',
        isDefault: true,
        defaultReasoningEffort: 'high',
        supportedReasoningEfforts: [{ reasoningEffort: 'high' }],
      },
    ],
    registryModels,
  );

  assert.equal(
    resolveCodexComposerModelId('gpt-5.2-xhigh', result.models, result.defaultModelId),
    'codex:gpt-5.5:high',
  );
});

test('keeps a supported per-chat selection', () => {
  const models = registryModels.slice();
  assert.equal(resolveCodexComposerModelId('gpt-5.4-high', models, 'gpt-5.4-high'), 'gpt-5.4-high');
});
