export type CodexPermissionMode = 'read-only' | 'workspace-write' | 'full-access';

export const DEFAULT_CODEX_PERMISSION_MODE: CodexPermissionMode = 'full-access';

export const CODEX_PERMISSION_OPTIONS: Array<{
  id: CodexPermissionMode;
  label: string;
  description: string;
}> = [
  {
    id: 'full-access',
    label: 'Full access',
    description: 'No filesystem, network, or approval restrictions.',
  },
  {
    id: 'workspace-write',
    label: 'Workspace',
    description: 'Write inside the working folder and ask before crossing the sandbox.',
  },
  {
    id: 'read-only',
    label: 'Read only',
    description: 'Inspect files and ask before commands or changes.',
  },
];

export function normalizeCodexPermissionMode(value: unknown): CodexPermissionMode {
  return value === 'read-only' || value === 'workspace-write' || value === 'full-access'
    ? value
    : DEFAULT_CODEX_PERMISSION_MODE;
}
