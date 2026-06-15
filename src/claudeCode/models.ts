import type { ModelInfo } from '../llm/registry';

export const CLAUDE_CODE_MODELS: ModelInfo[] = [
  {
    id: 'claude-code:sonnet',
    provider: 'anthropic',
    runtime: 'claude-code',
    apiModel: 'sonnet',
    label: 'Claude Code - Sonnet',
    shortLabel: 'Claude Sonnet',
    supportsImageInput: false,
    parameters: { webSearch: false, streaming: true, background: false },
    defaults: { webSearch: false, streaming: true, background: false },
  },
  {
    id: 'claude-code:opus',
    provider: 'anthropic',
    runtime: 'claude-code',
    apiModel: 'opus',
    label: 'Claude Code - Opus',
    shortLabel: 'Claude Opus',
    supportsImageInput: false,
    parameters: { webSearch: false, streaming: true, background: false },
    defaults: { webSearch: false, streaming: true, background: false },
  },
  {
    id: 'claude-code:haiku',
    provider: 'anthropic',
    runtime: 'claude-code',
    apiModel: 'haiku',
    label: 'Claude Code - Haiku',
    shortLabel: 'Claude Haiku',
    supportsImageInput: false,
    parameters: { webSearch: false, streaming: true, background: false },
    defaults: { webSearch: false, streaming: true, background: false },
  },
];

export function isClaudeCodeModel(
  model: ModelInfo | null | undefined,
): model is ModelInfo & { runtime: 'claude-code' } {
  return model?.runtime === 'claude-code';
}
