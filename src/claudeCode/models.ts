import type { ModelInfo } from '../llm/registry';

export type ClaudeCodeEffort = NonNullable<ModelInfo['claudeCodeEffort']>;

type ClaudeCodeModelDefinition = {
  id: string;
  name: string;
  efforts: ClaudeCodeEffort[];
};

const MODEL_DEFINITIONS: ClaudeCodeModelDefinition[] = [
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
  },
  {
    id: 'claude-opus-4-8',
    name: 'Claude Opus 4.8',
    efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    efforts: ['low', 'medium', 'high', 'max'],
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    efforts: [],
  },
];

function effortLabel(effort: ClaudeCodeEffort): string {
  return effort === 'xhigh' ? 'xHigh' : effort.charAt(0).toUpperCase() + effort.slice(1);
}

function buildModel(
  definition: ClaudeCodeModelDefinition,
  effort?: ClaudeCodeEffort,
): ModelInfo {
  const suffix = effort ? ` (${effortLabel(effort)})` : '';
  return {
    id: `claude-code:${definition.id}${effort ? `:${effort}` : ''}`,
    provider: 'anthropic',
    runtime: 'claude-code',
    apiModel: definition.id,
    label: `Claude Code - ${definition.name}${suffix} [${definition.id}]`,
    shortLabel: `${definition.name}${suffix}`,
    supportsImageInput: false,
    parameters: { webSearch: false, streaming: true, background: false },
    defaults: { webSearch: false, streaming: true, background: false },
    ...(effort ? { claudeCodeEffort: effort } : {}),
  };
}

export const CLAUDE_CODE_MODELS: ModelInfo[] = MODEL_DEFINITIONS.flatMap((definition) =>
  definition.efforts.length
    ? definition.efforts.map((effort) => buildModel(definition, effort))
    : [buildModel(definition)],
);

const LEGACY_MODEL_SELECTIONS: Record<string, string> = {
  'claude-code:opus': 'claude-code:claude-opus-5:high',
  'claude-code:sonnet': 'claude-code:claude-sonnet-4-6:high',
  'claude-code:haiku': 'claude-code:claude-haiku-4-5-20251001',
};

export function migrateClaudeCodeModelId(value: unknown): string {
  const modelId = typeof value === 'string' ? value.trim() : '';
  return LEGACY_MODEL_SELECTIONS[modelId] ?? modelId;
}

export function isClaudeCodeModel(
  model: ModelInfo | null | undefined,
): model is ModelInfo & { runtime: 'claude-code' } {
  return model?.runtime === 'claude-code';
}
