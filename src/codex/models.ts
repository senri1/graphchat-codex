import type { ModelInfo } from '../llm/registry';

export type CodexRuntimeModel = {
  id?: string;
  model?: string;
  displayName?: string;
  description?: string;
  isDefault?: boolean;
  defaultReasoningEffort?: string;
  supportedReasoningEfforts?: Array<{
    reasoningEffort?: string;
    description?: string;
  }>;
  inputModalities?: string[];
};

const SUPPORTED_EFFORTS = new Set<ModelInfo['effort']>([
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
]);

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEffort(value: unknown): ModelInfo['effort'] | undefined {
  const effort = cleanString(value) as ModelInfo['effort'];
  return SUPPORTED_EFFORTS.has(effort) ? effort : undefined;
}

function effortLabel(effort: ModelInfo['effort'] | undefined): string {
  if (!effort) return '';
  return effort === 'xhigh' ? 'xHigh' : effort.charAt(0).toUpperCase() + effort.slice(1);
}

function generatedModelId(apiModel: string, effort: ModelInfo['effort'] | undefined): string {
  return `codex:${apiModel}${effort ? `:${effort}` : ''}`;
}

export function buildCodexComposerModels(
  runtimeModels: CodexRuntimeModel[],
  registryModels: ModelInfo[],
): { models: ModelInfo[]; defaultModelId: string | null } {
  const models: ModelInfo[] = [];
  let defaultModelId: string | null = null;

  for (const runtimeModel of Array.isArray(runtimeModels) ? runtimeModels : []) {
    const apiModel = cleanString(runtimeModel.model) || cleanString(runtimeModel.id);
    if (!apiModel) continue;
    const displayName = cleanString(runtimeModel.displayName) || apiModel;
    const efforts = Array.isArray(runtimeModel.supportedReasoningEfforts)
      ? runtimeModel.supportedReasoningEfforts
          .map((item) => normalizeEffort(item?.reasoningEffort))
          .filter((effort): effort is NonNullable<ModelInfo['effort']> => Boolean(effort))
      : [];
    const normalizedEfforts: Array<ModelInfo['effort'] | undefined> = efforts.length ? efforts : [undefined];
    const defaultEffort = normalizeEffort(runtimeModel.defaultReasoningEffort) ?? normalizedEfforts[0];

    for (const effort of normalizedEfforts) {
      const existing = registryModels.find(
        (model) => model.provider === 'openai' && model.apiModel === apiModel && model.effort === effort,
      );
      const suffix = effortLabel(effort);
      const model: ModelInfo = existing
        ? { ...existing, runtime: 'codex' }
        : {
          id: generatedModelId(apiModel, effort),
          provider: 'openai',
          runtime: 'codex',
          apiModel,
          label: `Codex - ${displayName}${suffix ? ` (${suffix})` : ''}`,
          shortLabel: `${displayName}${suffix ? ` ${suffix}` : ''}`,
          supportsImageInput: Array.isArray(runtimeModel.inputModalities)
            ? runtimeModel.inputModalities.includes('image')
            : false,
          parameters: { webSearch: false, streaming: true, background: false },
          defaults: { webSearch: false, streaming: true, background: false },
          ...(effort ? { effort } : {}),
          reasoningSummary: true,
        };
      if (models.some((candidate) => candidate.id === model.id)) continue;
      models.push(model);
      if (runtimeModel.isDefault && effort === defaultEffort) defaultModelId = model.id;
    }
  }

  return { models, defaultModelId: defaultModelId ?? models[0]?.id ?? null };
}

export function resolveCodexComposerModelId(
  requestedModelId: unknown,
  models: ModelInfo[],
  defaultModelId: string | null,
): string | null {
  const requested = cleanString(requestedModelId);
  if (requested && models.some((model) => model.id === requested)) return requested;
  if (defaultModelId && models.some((model) => model.id === defaultModelId)) return defaultModelId;
  return models[0]?.id ?? null;
}
