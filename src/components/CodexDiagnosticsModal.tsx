import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type CodexStatus = {
  state: string;
  ready: boolean;
  binaryPath?: string | null;
  version?: string | null;
  error?: string | null;
  stderr?: string | null;
};

type CodexModel = {
  id: string;
  displayName?: string;
  description?: string;
  isDefault?: boolean;
  defaultReasoningEffort?: string;
  supportedReasoningEfforts?: Array<{ reasoningEffort: string; description?: string }>;
};

type PendingServerRequest = {
  id: string | number;
  method: string;
  params: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function errorText(value: unknown, fallback: string): string {
  if (value && typeof value === 'object' && typeof (value as any).error === 'string') {
    const message = String((value as any).error).trim();
    if (message) return message;
  }
  if (value instanceof Error && value.message.trim()) return value.message.trim();
  return fallback;
}

function percentLabel(window: any): string {
  const used = Number(window?.usedPercent);
  if (!Number.isFinite(used)) return 'Unavailable';
  const remaining = Math.max(0, 100 - used);
  const reset = Number(window?.resetsAt);
  const suffix = Number.isFinite(reset) && reset > 0 ? `, resets ${new Date(reset * 1000).toLocaleString()}` : '';
  return `${remaining}% remaining${suffix}`;
}

export default function CodexDiagnosticsModal({ open, onClose }: Props) {
  const api = window.gcElectron;
  const [status, setStatus] = useState<CodexStatus | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [rateLimits, setRateLimits] = useState<any>(null);
  const [models, setModels] = useState<CodexModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedEffort, setSelectedEffort] = useState('');
  const [login, setLogin] = useState<any>(null);
  const [prompt, setPrompt] = useState('Reply with exactly: GraphChat Codex is connected.');
  const [output, setOutput] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [runtimeLog, setRuntimeLog] = useState('');
  const [pendingRequest, setPendingRequest] = useState<PendingServerRequest | null>(null);
  const [activeTurn, setActiveTurn] = useState<{ threadId: string; turnId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTurnRef = useRef(activeTurn);

  useEffect(() => {
    activeTurnRef.current = activeTurn;
  }, [activeTurn]);

  const efforts = useMemo(() => {
    const model = models.find((item) => item.id === selectedModel);
    return Array.isArray(model?.supportedReasoningEfforts) ? model.supportedReasoningEfforts : [];
  }, [models, selectedModel]);

  const refreshAccount = useCallback(async () => {
    if (!api?.codexAccountRead) return;
    const response = await api.codexAccountRead();
    if (!response?.ok) throw new Error(errorText(response, 'Failed to read account.'));
    setAccount(response.result ?? null);
  }, [api]);

  const refreshLimits = useCallback(async () => {
    if (!api?.codexRateLimitsRead) return;
    const response = await api.codexRateLimitsRead();
    if (!response?.ok) throw new Error(errorText(response, 'Failed to read rate limits.'));
    setRateLimits(response.result ?? null);
  }, [api]);

  const refreshModels = useCallback(async () => {
    if (!api?.codexModelList) return;
    const response = await api.codexModelList();
    if (!response?.ok) throw new Error(errorText(response, 'Failed to list models.'));
    const nextModels = Array.isArray(response.result?.data) ? response.result.data : [];
    setModels(nextModels);
    setSelectedModel((current) => current || nextModels.find((item: CodexModel) => item.isDefault)?.id || nextModels[0]?.id || '');
  }, [api]);

  const connectAndRefresh = useCallback(async () => {
    if (!api?.codexStart) {
      setError('Codex diagnostics require the Electron desktop app.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const started = await api.codexStart();
      if (!started?.ok) throw new Error(errorText(started, 'Failed to start Codex.'));
      setStatus(started.status ?? null);
      await Promise.all([refreshAccount(), refreshLimits(), refreshModels()]);
    } catch (err) {
      setError(errorText(err, 'Failed to connect to Codex.'));
    } finally {
      setBusy(false);
    }
  }, [api, refreshAccount, refreshLimits, refreshModels]);

  useEffect(() => {
    if (!open) return;
    void connectAndRefresh();
  }, [open, connectAndRefresh]);

  useEffect(() => {
    if (!open || !api?.codexOnEvent) return;
    return api.codexOnEvent((event: any) => {
      if (!event || typeof event !== 'object') return;
      if (event.kind === 'status') {
        setStatus(event.status ?? null);
        return;
      }
      if (event.kind === 'stderr') {
        setRuntimeLog((current) => `${current}${String(event.text ?? '')}`.slice(-12_000));
        return;
      }
      if (event.kind === 'server-request') {
        setPendingRequest({
          id: event.id,
          method: String(event.method ?? ''),
          params: event.params ?? {},
        });
        return;
      }
      if (event.kind !== 'notification') return;

      const method = String(event.method ?? '');
      const params = event.params ?? {};
      if (method === 'account/updated') {
        void Promise.all([refreshAccount(), refreshLimits(), refreshModels()]).catch(() => {});
        return;
      }

      const active = activeTurnRef.current;
      if (!active) return;
      if (method === 'turn/completed') {
        if (params.turn?.id !== active.turnId) return;
        setRunning(false);
        setActiveTurn(null);
        activeTurnRef.current = null;
        void refreshLimits().catch(() => {});
        if (params.turn?.error) setError(errorText(params.turn.error, 'Codex turn failed.'));
        return;
      }
      if (method === 'error') {
        setError(errorText(params, 'Codex reported an error.'));
        return;
      }
      if (params.turnId !== active.turnId) return;
      if (method === 'item/agentMessage/delta') {
        setOutput((current) => current + String(params.delta ?? ''));
      } else if (method === 'item/reasoning/summaryTextDelta') {
        setReasoning((current) => current + String(params.delta ?? ''));
      }
    });
  }, [api, open, refreshAccount, refreshLimits, refreshModels]);

  useEffect(() => {
    const model = models.find((item) => item.id === selectedModel);
    const supported = Array.isArray(model?.supportedReasoningEfforts) ? model.supportedReasoningEfforts : [];
    if (supported.some((item) => item.reasoningEffort === selectedEffort)) return;
    setSelectedEffort(model?.defaultReasoningEffort || supported[0]?.reasoningEffort || '');
  }, [models, selectedEffort, selectedModel]);

  if (!open) return null;

  const accountValue = account?.account ?? null;
  const primaryLimits = rateLimits?.rateLimits ?? null;

  const startLogin = async () => {
    if (!api?.codexLoginStart) return;
    setBusy(true);
    setError(null);
    try {
      const response = await api.codexLoginStart();
      if (!response?.ok) throw new Error(errorText(response, 'Failed to start login.'));
      setLogin(response.result ?? null);
    } catch (err) {
      setError(errorText(err, 'Failed to start login.'));
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    if (!api?.codexLogout) return;
    setBusy(true);
    setError(null);
    try {
      const response = await api.codexLogout();
      if (!response?.ok) throw new Error(errorText(response, 'Failed to sign out.'));
      setLogin(null);
      await Promise.all([refreshAccount(), refreshLimits()]);
    } catch (err) {
      setError(errorText(err, 'Failed to sign out.'));
    } finally {
      setBusy(false);
    }
  };

  const startTest = async () => {
    if (!api?.codexTestTurnStart || !selectedModel || !prompt.trim()) return;
    setOutput('');
    setReasoning('');
    setError(null);
    setPendingRequest(null);
    setActiveTurn(null);
    setRunning(true);
    try {
      const response = await api.codexTestTurnStart({
        model: selectedModel,
        effort: selectedEffort || undefined,
        prompt: prompt.trim(),
      });
      if (!response?.ok) throw new Error(errorText(response, 'Failed to start test turn.'));
      const threadId = String(response.result?.threadId ?? '');
      const turnId = String(response.result?.turnId ?? '');
      if (!threadId || !turnId) throw new Error('Codex returned incomplete turn identifiers.');
      const next = { threadId, turnId };
      activeTurnRef.current = next;
      setActiveTurn(next);
    } catch (err) {
      setRunning(false);
      setError(errorText(err, 'Failed to start test turn.'));
    }
  };

  const interrupt = async () => {
    const turn = activeTurnRef.current;
    if (!turn || !api?.codexTurnInterrupt) return;
    const response = await api.codexTurnInterrupt(turn);
    if (!response?.ok) setError(errorText(response, 'Failed to interrupt turn.'));
  };

  const answerApproval = async (decision: 'accept' | 'decline' | 'cancel') => {
    if (!pendingRequest || !api?.codexRespondToServerRequest) return;
    const response = await api.codexRespondToServerRequest({
      id: pendingRequest.id,
      result: { decision },
    });
    if (!response?.ok) {
      setError(errorText(response, 'Failed to answer approval request.'));
      return;
    }
    setPendingRequest(null);
  };

  return (
    <div className="codexDiag" role="dialog" aria-modal="true" aria-label="Codex diagnostics">
      <div className="codexDiag__backdrop" onMouseDown={onClose} />
      <div className="codexDiag__surface" onMouseDown={(event) => event.stopPropagation()}>
        <header className="codexDiag__header">
          <div>
            <h2>Codex Runtime</h2>
            <div className="codexDiag__subtitle">App Server connection diagnostics</div>
          </div>
          <button className="codexDiag__iconBtn" type="button" title="Close" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </header>

        {error ? <div className="codexDiag__error">{error}</div> : null}

        <section className="codexDiag__section">
          <div className="codexDiag__sectionHeader">
            <h3>Runtime</h3>
            <div className={`codexDiag__status codexDiag__status--${status?.ready ? 'ready' : 'idle'}`}>
              {status?.state ?? 'unknown'}
            </div>
          </div>
          <dl className="codexDiag__facts">
            <div><dt>Version</dt><dd>{status?.version || 'Unavailable'}</dd></div>
            <div><dt>Executable</dt><dd>{status?.binaryPath || 'Not found'}</dd></div>
          </dl>
          <div className="codexDiag__actions">
            <button className="settingsBtn" type="button" disabled={busy} onClick={() => void connectAndRefresh()}>
              Refresh
            </button>
            <button
              className="settingsBtn"
              type="button"
              disabled={busy}
              onClick={() => {
                void api?.codexRestart?.().then((response) => {
                  if (response?.ok) {
                    setStatus(response.status ?? null);
                    void connectAndRefresh();
                  } else {
                    setError(errorText(response, 'Failed to restart Codex.'));
                  }
                });
              }}
            >
              Restart
            </button>
          </div>
        </section>

        <section className="codexDiag__section">
          <div className="codexDiag__sectionHeader">
            <h3>ChatGPT Account</h3>
            <div className="codexDiag__muted">{accountValue?.planType || 'Not signed in'}</div>
          </div>
          <div className="codexDiag__account">{accountValue?.email || 'No ChatGPT account is active.'}</div>
          {login?.userCode ? (
            <div className="codexDiag__loginCode">
              <span>Device code</span>
              <strong>{login.userCode}</strong>
              <small>The verification page was opened in your browser.</small>
            </div>
          ) : null}
          <div className="codexDiag__actions">
            <button className="settingsBtn settingsBtn--primary" type="button" disabled={busy} onClick={() => void startLogin()}>
              Sign in with ChatGPT
            </button>
            <button className="settingsBtn" type="button" disabled={busy || !accountValue} onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        </section>

        <section className="codexDiag__section">
          <div className="codexDiag__sectionHeader">
            <h3>Codex Limits</h3>
            <div className="codexDiag__muted">{primaryLimits?.planType || accountValue?.planType || 'Unknown plan'}</div>
          </div>
          <dl className="codexDiag__facts codexDiag__facts--limits">
            <div><dt>Primary window</dt><dd>{percentLabel(primaryLimits?.primary)}</dd></div>
            <div><dt>Secondary window</dt><dd>{percentLabel(primaryLimits?.secondary)}</dd></div>
          </dl>
        </section>

        <section className="codexDiag__section">
          <div className="codexDiag__sectionHeader">
            <h3>Test Turn</h3>
            <div className="codexDiag__muted">{models.length} models</div>
          </div>
          <div className="codexDiag__fields">
            <label>
              <span>Model</span>
              <select value={selectedModel} onChange={(event) => setSelectedModel(event.currentTarget.value)}>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>{model.displayName || model.id}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Reasoning effort</span>
              <select value={selectedEffort} onChange={(event) => setSelectedEffort(event.currentTarget.value)}>
                {efforts.map((effort) => (
                  <option key={effort.reasoningEffort} value={effort.reasoningEffort}>{effort.reasoningEffort}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="codexDiag__prompt">
            <span>Prompt</span>
            <textarea value={prompt} onChange={(event) => setPrompt(event.currentTarget.value)} />
          </label>
          <div className="codexDiag__actions">
            <button className="settingsBtn settingsBtn--primary" type="button" disabled={running || !selectedModel} onClick={() => void startTest()}>
              Run test
            </button>
            <button className="settingsBtn" type="button" disabled={!running || !activeTurn} onClick={() => void interrupt()}>
              Stop
            </button>
          </div>
          {activeTurn ? (
            <div className="codexDiag__ids">
              <span>Thread {activeTurn.threadId}</span>
              <span>Turn {activeTurn.turnId}</span>
            </div>
          ) : null}
          {reasoning ? <pre className="codexDiag__reasoning">{reasoning}</pre> : null}
          <pre className="codexDiag__output">{output || (running ? 'Waiting for Codex...' : 'No test output yet.')}</pre>
        </section>

        {pendingRequest ? (
          <section className="codexDiag__section codexDiag__approval">
            <div className="codexDiag__sectionHeader">
              <h3>Approval Required</h3>
              <div className="codexDiag__muted">{pendingRequest.method}</div>
            </div>
            <pre>{JSON.stringify(pendingRequest.params, null, 2)}</pre>
            <div className="codexDiag__actions">
              <button className="settingsBtn settingsBtn--primary" type="button" onClick={() => void answerApproval('accept')}>Approve</button>
              <button className="settingsBtn" type="button" onClick={() => void answerApproval('decline')}>Decline</button>
              <button className="settingsBtn settingsBtn--danger" type="button" onClick={() => void answerApproval('cancel')}>Cancel turn</button>
            </div>
          </section>
        ) : null}

        {runtimeLog ? (
          <details className="codexDiag__log">
            <summary>Runtime log</summary>
            <pre>{runtimeLog}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
