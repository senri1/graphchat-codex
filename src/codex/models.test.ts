import assert from 'node:assert/strict';
import test from 'node:test';
import type { ModelInfo } from '../llm/registry.ts';
import {
  buildCodexComposerModels,
  normalizeCodexReasoningEffort,
  resolveCodexComposerModelId,
} from './models.ts';

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

test('exposes the GPT-5.6 family with every effort advertised by Codex', () => {
  const commonEfforts = ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'].map((reasoningEffort) => ({
    reasoningEffort,
  }));
  const result = buildCodexComposerModels(
    [
      {
        id: 'gpt-5.6-sol',
        displayName: 'GPT-5.6-Sol',
        isDefault: true,
        defaultReasoningEffort: 'low',
        supportedReasoningEfforts: commonEfforts,
        inputModalities: ['text', 'image'],
      },
      {
        id: 'gpt-5.6-terra',
        displayName: 'GPT-5.6-Terra',
        defaultReasoningEffort: 'medium',
        supportedReasoningEfforts: commonEfforts,
        inputModalities: ['text', 'image'],
      },
      {
        id: 'gpt-5.6-luna',
        displayName: 'GPT-5.6-Luna',
        defaultReasoningEffort: 'medium',
        supportedReasoningEfforts: commonEfforts.slice(0, 5),
        inputModalities: ['text', 'image'],
      },
    ],
    registryModels,
  );

  assert.equal(result.defaultModelId, 'codex:gpt-5.6-sol:low');
  assert.deepEqual(
    result.models.filter((model) => model.apiModel === 'gpt-5.6-sol').map((model) => model.effort),
    ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'],
  );
  assert.deepEqual(
    result.models.filter((model) => model.apiModel === 'gpt-5.6-terra').map((model) => model.effort),
    ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'],
  );
  assert.deepEqual(
    result.models.filter((model) => model.apiModel === 'gpt-5.6-luna').map((model) => model.effort),
    ['low', 'medium', 'high', 'xhigh', 'max'],
  );
  assert.ok(result.models.every((model) => model.supportsImageInput));
});

test('preserves future server-advertised efforts and the legacy image fallback', () => {
  assert.equal(normalizeCodexReasoningEffort(' future-level '), 'future-level');
  assert.equal(normalizeCodexReasoningEffort('  '), undefined);

  const result = buildCodexComposerModels(
    [
      {
        id: 'future-codex-model',
        supportedReasoningEfforts: [{ reasoningEffort: 'future-level' }],
      },
    ],
    [],
  );

  assert.equal(result.models[0]?.effort, 'future-level');
  assert.equal(result.models[0]?.supportsImageInput, true);
});
