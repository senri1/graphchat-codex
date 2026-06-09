import React from 'react';
import ConfirmDialog from './ConfirmDialog';

export type CodexApprovalRequest = {
  id: string | number;
  method: string;
  params: Record<string, any>;
};

type Props = {
  request: CodexApprovalRequest | null;
  onDecision: (decision: 'accept' | 'decline') => void;
};

function approvalCopy(request: CodexApprovalRequest): { title: string; message: string } {
  const params = request.params ?? {};
  if (request.method === 'item/commandExecution/requestApproval') {
    const command = typeof params.command === 'string' ? params.command.trim() : '';
    const cwd = typeof params.cwd === 'string' ? params.cwd.trim() : '';
    const reason = typeof params.reason === 'string' ? params.reason.trim() : '';
    return {
      title: 'Allow Codex command?',
      message: [command || 'Codex requested permission to run a command.', cwd ? `Folder: ${cwd}` : '', reason]
        .filter(Boolean)
        .join('\n\n'),
    };
  }
  if (request.method === 'item/fileChange/requestApproval') {
    const reason = typeof params.reason === 'string' ? params.reason.trim() : '';
    return {
      title: 'Allow Codex file changes?',
      message: reason || 'Codex requested permission to modify files in the selected workspace.',
    };
  }
  return {
    title: 'Allow Codex operation?',
    message: typeof params.reason === 'string' && params.reason.trim() ? params.reason.trim() : request.method,
  };
}

export default function CodexApprovalDialog({ request, onDecision }: Props) {
  if (!request) return null;
  const copy = approvalCopy(request);
  return (
    <ConfirmDialog
      open
      title={copy.title}
      message={copy.message}
      confirmLabel="Allow"
      cancelLabel="Decline"
      onConfirm={() => onDecision('accept')}
      onCancel={() => onDecision('decline')}
    />
  );
}
