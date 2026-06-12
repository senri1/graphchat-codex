# GraphChat Codex: AI Project Context

Last updated: 2026-06-12

This README is primarily operational context for AI coding agents. Read it before
changing the repository. Verify details against the code when they affect data
integrity or Codex App Server protocol behavior.

## Objective

GraphChat Codex is a personal, graph-based desktop interface for the OpenAI Codex
App Server.

The intended product:

- Uses Codex/ChatGPT authentication, subscription limits, models, and tools.
- Shares native Codex thread history with official Codex clients.
- Displays linear Codex threads as branches inside a persistent visual graph.
- Allows a reply to an older completed turn to become a native Codex fork.
- Keeps portable visible user and assistant text in GraphChat storage.
- Supports editable Markdown notes and diary-like documents.
- Gives Codex filesystem access to every node in a chat, including nodes outside
  the active native thread ancestry.
- May eventually support the inherited API-provider backend through a clean
  backend abstraction, but Codex is the primary runtime.

This repository is separate from GraphChatV1. Do not modify a GraphChatV1
checkout or its storage unless the user explicitly requests it.

## Ownership Boundary

GraphChat owns:

- Graph topology, branches, node positions, and layout.
- Portable visible user and assistant text.
- Editable user documents.
- Chat metadata and GraphChat-only branches.
- Raw imported Codex payload copies.
- Export and sync data.

Codex owns:

- ChatGPT authentication and subscription limits.
- Models and reasoning effort.
- Native linear threads and turns.
- Reasoning state.
- Tool execution and approvals.
- Native thread history in the Codex data domain.

GraphChat launches its own local `codex app-server` process using the installed
Codex executable. It shares Codex authentication and thread storage with official
clients; it does not need to share the exact same running process.

## Implemented State

The application currently supports:

- Codex executable discovery and App Server startup over stdio.
- Versioned JSON-RPC initialization.
- ChatGPT device-code login and logout.
- Account, model, reasoning-effort, and rate-limit display.
- Streaming assistant text and reasoning summaries into graph nodes.
- Portable command, patch, plan, search, tool, agent, image, review, and
  compaction events with compact expandable rows.
- Chronological assistant-turn timelines that interleave reasoning, tool
  activity, commentary, and final answers in App Server item order.
- Turn cancellation and error handling.
- Command and file approval prompts.
- Native continuation and branching.
- Persistence and restart recovery.
- Per-chat working folders.
- Official Codex thread listing, searching, pagination, import, and refresh.
- Import matching by `turnId`, including shared turn IDs in forked threads.
- Preservation of GraphChat-only branches and layouts during refresh.
- Multi-thread linkage metadata for graphs containing native Codex forks.
- Legacy GraphChatV1 import and continuation.
- Filesystem-backed conversation context.
- Editable Markdown document nodes and immutable conversation nodes.

At the last verified milestone, `npm run typecheck`, the Codex tests, context
storage tests, and the production build passed. Existing Vite PDF/chunk-size
warnings are non-blocking.

## Native Thread Protocol

A completed assistant node can store:

```ts
{
  threadId,
  turnId,
  cwd,
  model?,
  effort?,
  forkedFromThreadId?,
  forkedFromTurnId?
}
```

Each chat also stores a rebuildable `codexThreads` index containing every native
Codex thread represented by the graph. Node checkpoints remain authoritative for
continuation; the chat-level index supports lookup, refresh, ancestry, and
lifecycle operations.

Turn behavior:

- New root conversation: `thread/start`, then `turn/start`.
- Reply to the newest native turn: `thread/resume`, then `turn/start`.
- Reply to an older native turn: `thread/fork`, `thread/rollback`, then
  `turn/start`.
- Reply to a legacy branch: `thread/start`, `thread/inject_items`, then
  `turn/start`.

For legacy history, GraphChat builds only the selected root-to-node path.
Non-text and empty nodes are skipped. Consecutive nodes with the same author are
grouped into one injected message. Provider payloads and old tool output are not
injected.

## Ordered Codex Turn Timeline

Each Codex-backed assistant node may store an ordered `codexTimeline` containing
three portable item types:

- `agent_message`: commentary or final-answer text.
- `reasoning`: one or more reasoning-summary parts.
- `event`: normalized command, patch, plan, search, tool, agent, image, review,
  or context-compaction activity.

The array order is authoritative for display. Live notifications append an item
at its first observed position and update it by stable `itemId`; completion must
not move it. Imported turns preserve the App Server `turn.items` order.

The plain node `content` remains a portable compatibility projection. It uses
`final_answer` messages when available, otherwise all agent messages.
`thinkingSummary` and the older `codexEvents` field remain compatibility
projections/fallbacks for saved chats created before the ordered timeline.

Do not reconstruct display order by grouping reasoning, events, and messages
into separate sections. See `docs/codex-event-model.md` and
`src/codex/timeline.ts`.

Important implementation:

- `electron/codex/process-manager.cjs`
- `electron/codex/ipc-handlers.cjs`
- `src/codex/legacyHistory.ts`
- `src/codex/timeline.ts`
- `src/codex/threadImport.ts`

## Node Semantics

Text nodes have explicit storage roles:

- A bottom-right new text node is an editable Markdown document.
- A header-reply user node is an editable draft while composing.
- The reply draft becomes immutable when sent.
- Sent user nodes and assistant nodes are immutable conversation records.
- All imported GraphChatV1 text nodes are immutable.

Use `documentNode`, `conversationDraft`, and `isEditNode`. Do not restore the old
node-ID-prefix heuristic for editability.

Replying from an editable document starts a fresh Codex branch. The document text
is used as the user prompt/history source as appropriate; it does not continue an
unrelated native thread.

Important implementation:

- `src/model/chat.ts`
- `src/codex/events.ts`
- `docs/codex-event-model.md`
- `src/engine/WorldEngine.ts`
- `src/App.tsx`

## Working Folders

Each GraphChat chat has one Codex working folder (`cwd`):

- A new chat inherits the configured default working folder.
- The folder may be changed while the graph has no nodes.
- It becomes fixed when the first node is created.
- An imported official Codex thread keeps and locks to its original `cwd`.
- An imported legacy chat receives an explicit `cwd`.

Avoid using this repository as the CWD for general personal chats. A visible
folder such as the following is preferable on Windows:

```text
%USERPROFILE%\Documents\GraphChatThreads
```

The older default `~/.graphchat-codex/threads` is valid but inconvenient to open
as a project because it is hidden on Unix-like systems.

## Conversation Context

GraphChat projects each chat into its CWD:

```text
<cwd>/conversation-context/
|-- AGENTS.md
|-- INDEX.md
`-- chats/
    `-- <encoded-chat-id>/
        |-- README.md
        |-- graph.json
        |-- conflicts/
        `-- nodes/
            |-- documents/
            `-- conversation/
```

Meaning:

- `nodes/documents/*.md`: editable user documents.
- `nodes/conversation/*.md`: immutable user and assistant messages.
- `graph.json`: topology, metadata, content paths/hashes, and Codex checkpoints.
  Full node text remains in the Markdown files.
- `README.md`: per-chat preview and statistics.
- `INDEX.md`: entry point for finding relevant chats in the same CWD.
- `AGENTS.md`: search and editing rules for Codex.

Each Codex turn receives developer instructions with the exact current chat path.
The instruction says:

- If required information is missing from the current native thread, search the
  current chat's node Markdown files.
- If it may be in another chat, consult `conversation-context/INDEX.md`.
- Consult `graph.json` when ancestry, branches, or checkpoints matter.

The Markdown files are not automatically inserted into every model request.
Codex reads and searches them with its normal filesystem tools when relevant.

External edits to document files are loaded back into GraphChat. If both the app
and disk changed a document, the disk version wins and GraphChat preserves its
version under `conflicts/`. Conversation files are regenerated from app state and
made read-only where the platform supports it.

`conversation-context/` is ignored in this repository so personal chats are not
accidentally committed when this repo is used as a chat CWD.

Important implementation:

- `electron/conversation-context-storage.cjs`
- `src/storage/persistence.ts`
- `src/App.tsx`
- `test/conversation-context-storage.test.cjs`

## Official Codex Thread Import

The thread browser uses App Server `thread/list` and `thread/read`.

- Importing an unlinked native thread creates a new GraphChat chat.
- Reopening an already-linked thread refreshes that linked GraphChat chat.
- A new import must not be merged into an arbitrary active GraphChat chat.
- Imported visible text remains usable if local native Codex history later
  becomes unavailable.
- Refresh must remain idempotent and preserve GraphChat-only branches, layout,
  model metadata, and checkpoints.

### Refreshing A Thread

Refresh is currently manual:

1. Open **Codex threads** from the right toolbar.
2. Use the circular-arrow button if the thread list itself may be stale.
3. Select the linked thread whose action says **Open / refresh**.

The circular-arrow button only reloads the list with `thread/list`. Selecting
**Open / refresh** performs `thread/read` and merges the latest thread into its
already-linked GraphChat chat. The merge matches turns by `turnId`, adds missing
turns, refreshes imported timeline snapshots, and preserves GraphChat-only
nodes, branch layout, and local expansion state.

There is no automatic cross-client watcher yet. If the official Codex app
changes a thread while GraphChat is open, repeat the steps above. A successful
merge reports the number of newly added turns or says that the thread was
refreshed.

## Legacy GraphChatV1 Migration

The one-chat importer is:

```text
scripts/import-graphchatv1-chat.cjs
```

Its default paths are macOS-specific. On Windows, always discover storage and
pass explicit paths:

```powershell
node scripts/import-graphchatv1-chat.cjs `
  --source-root="<GraphChatV1Data\v1>" `
  --destination-root="<GraphChatCodexData\v1>" `
  --chat-id="<source-chat-id>" `
  --cwd="<existing working folder>"
```

Optional recovery:

```text
--merge-state-chat-id=<orphan-source-chat-id>
```

Migration rules:

- Close GraphChatV1 and GraphChat Codex before writing storage.
- Never mutate the GraphChatV1 source.
- Back up the complete GraphChat Codex destination before import. The importer
  also creates a destination backup for each imported chat.
- Preserve graph topology, layout, and visible text.
- Drop old provider payloads, attachments, PDF nodes, and stale tool/runtime
  state.
- Copy the background if its blob is available.
- Mark imports with `meta.legacyImport.source = "graphchatv1"`.
- Detect duplicate imports through `legacyImport.sourceChatId`.
- Place imported chats under `Imported from GraphChatV1`.
- Do not commit migrated storage or generated context files.

Likely Windows paths, which must be verified rather than assumed:

```text
Source:
%APPDATA%\Electron\GraphChatV1Data\v1

Default destination:
%APPDATA%\GraphChat Codex\GraphChatCodexData\v1
```

If `%APPDATA%\GraphChat Codex\storage-location.json` defines
`storageBaseDir`, the destination is:

```text
<storageBaseDir>\GraphChatCodexData\v1
```

### Pending Windows Legacy Import

The Windows GraphChatV1 copy is expected to contain the same synchronized legacy
data as the original machine. Import these five meaningful chats:

| Source chat ID | Name |
| --- | --- |
| `chat_186774a9-e037-480d-a8a0-0f4e24b9f154` | Chat 1 |
| `chat_7e444bd0-5359-431d-be2a-454e5f3db408` | Polynomial functors |
| `chat_226330bb-6ce3-4741-990a-f92b01862208` | main |
| `chat_46c23cff-b590-499c-b3ca-dd51a12ef668` | experiment |
| `chat_c8251f40-34fc-454f-aab2-41ee6b03e3e1` | Prefix syntax and polynomial functors |

For `Prefix syntax and polynomial functors`, merge this orphan state:

```text
chat_9ca0e8f2-affd-4b80-82c9-ab6ed201a04e
```

Do not create a separate visible chat for that orphan.

These appear to be placeholders and should not be imported unless inspection
finds meaningful content absent from the five chats:

```text
chat_83221aa1-021b-4313-a77f-69e27774a058
chat_26683f6e-5daf-47a6-827d-a5288fdd4a3a
```

After migration, verify exactly one destination chat per source ID, valid JSON,
an existing `codexWorkingFolderPath`, expected node IDs after PDF removal, and
successful app startup.

## Desktop Storage

GraphChat Codex has a separate Electron identity and storage root from
GraphChatV1.

Default managed data root:

```text
<Electron userData>/GraphChatCodexData/v1
```

On Windows, Electron `userData` is normally:

```text
%APPDATA%\GraphChat Codex
```

The user can select a different storage base directory in Settings. Respect
`storage-location.json` before reading or writing managed storage.

Codex native threads are not stored in GraphChat managed storage. They remain in
the Codex data domain.

GraphChat Codex is intentionally local-only. Cloud-folder and direct Google
Drive sync controls are not exposed because working folders and native Codex
thread state are machine-specific. Use local exports and backups for recovery.

## Running From Source

Prerequisites:

- Node.js and npm.
- A working Codex installation, or `GRAPHCHAT_CODEX_BINARY` pointing to a Codex
  executable that supports `app-server`.

Install:

```powershell
npm install
```

Start Vite in one terminal:

```powershell
npm run dev -- --host 127.0.0.1
```

Start Electron in another terminal:

```powershell
npm run electron:dev
```

Vite is configured for port `3001`. Browser-only rendering is useful for UI
inspection, but Codex authentication, filesystem access, App Server execution,
and desktop persistence require Electron.

## Validation

Run the smallest relevant checks while developing, then broaden for shared or
user-facing behavior:

```powershell
npm run typecheck
npm run test:codex
npm run test:legacy-history
npm run test:context
npm run build
```

Build installers:

```powershell
npm run dist:win
```

macOS:

```bash
npm run dist:mac
```

Installers are currently unsigned.

## Data and Git Safety

- Personal chats live in GraphChat storage and `conversation-context`, not Git.
- Do not stage generated `conversation-context` files.
- Do not overwrite or reset a dirty worktree.
- Do not rewrite GraphChatV1 source storage.
- Before storage migrations, close both applications and create a recoverable
  backup.
- Imported thread refreshes and migrations should be idempotent.
- Preserve unrelated user changes.

## Known Limitations and Next Work

These are useful future priorities, not claims of implemented behavior:

1. Add official-client reconciliation. Detect externally added turns, forks,
   renames, archives, rollbacks, and changed item snapshots; merge them without
   duplicating nodes or silently overwriting GraphChat-owned state.
2. Add automatic or user-configurable refresh while a linked chat is open, with
   a visible external-update indicator and clear handling for an active local
   generation.
3. Add a large-detail panel for long command output, diffs, tool arguments, and
   results while retaining compact chronological rows in the graph node.
4. Send supported files, images, and PDFs to Codex, and render image results and
   clickable file locations. Current generation is primarily text-only.
5. Add native thread rename and archive actions, then define how those lifecycle
   changes map onto GraphChat chat names and visibility.
6. Expand reconciliation tests for external forks, partial/in-progress turns,
   failed turns, rollback, duplicate refresh, and unavailable native history.
7. Continue Windows testing for authentication, binary discovery, storage paths,
   migration, and packaging.
8. Replace remaining inherited API-provider assumptions as Codex becomes the
   complete primary backend.

## Orientation Map

- `electron/main.cjs`: Electron identity, windows, desktop services.
- `electron/codex/process-manager.cjs`: App Server lifecycle and turn protocol.
- `electron/codex/ipc-handlers.cjs`: Codex IPC surface.
- `electron/codex/json-rpc-client.cjs`: JSON-RPC transport.
- `electron/storage.cjs`: managed storage and sync.
- `electron/conversation-context-storage.cjs`: Markdown/context projection.
- `electron/preload.cjs`: renderer bridge.
- `scripts/import-graphchatv1-chat.cjs`: direct legacy storage migration.
- `src/App.tsx`: application orchestration and persistence.
- `src/engine/WorldEngine.ts`: graph/node interaction model.
- `src/model/chat.ts`: persisted graph node types.
- `src/codex/timeline.ts`: ordered live/imported Codex item normalization.
- `src/codex/threadImport.ts`: official Codex thread import/refresh.
- `src/codex/legacyHistory.ts`: legacy root-to-node history construction.
- `src/components/CodexThreadBrowserModal.tsx`: native thread browser.
- `src/storage/persistence.ts`: renderer persistence API.

When fixing a bug, inspect the existing implementation, make the change, and
verify it. Do not stop at a proposal when the repository and local environment
contain enough information to act safely.
