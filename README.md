# GraphChat Codex

GraphChat Codex is an experimental Codex-App-Server-native fork of GraphChatV1. It keeps the visual branching UI while replacing the model runtime in stages.

This repository is deliberately isolated from GraphChatV1:

- Separate Git history
- Separate Electron application identity
- Separate desktop user-data and managed-storage roots
- Separate Google Drive sync folder name
- Separate browser IndexedDB and local-storage keys

## Current milestone

The first GraphChat conversation slice is working:

- Discovers and launches a local `codex app-server` over stdio
- Initializes the versioned JSON-RPC protocol
- Uses Codex/ChatGPT account authentication managed by Codex
- Reads available Codex models and rate-limit windows
- Sends normal GraphChat text turns through the Codex runtime
- Streams assistant text and reasoning summaries into graph nodes
- Continues a Codex thread from its current graph tip
- Forks and rolls back a Codex thread when replying from an older graph node
- Persists the Codex thread and turn checkpoint on each completed assistant node
- Resumes branches after restarting GraphChat
- Interrupts active turns and routes command/file approval requests through GraphChat
- Lists official Codex threads from the shared App Server history, grouped by working folder
- Imports official Codex turns as portable GraphChat nodes with their native thread checkpoints
- Refreshes imported threads without duplicating matching turns or removing GraphChat-only branches
- Continues and branches imported official threads through the same native Codex runtime

Open the terminal-shaped **Codex runtime** button in the right toolbar to inspect the connection, account, limits, models, reasoning effort, and streamed test output.

Open the list-shaped **Codex threads** button to browse the same thread history used by Codex clients. Importing a thread
creates a GraphChat chat locked to that thread's working folder. Opening it again refreshes official turns in place while
retaining portable node text, raw turn payloads, layout, and GraphChat-created branches.

New chats inherit the default Codex working folder from **Settings -> Codex**. GraphChat manages
`~/.graphchat-codex/threads` as the initial default, or you can choose another folder. Before sending the first message,
use the chat's three-dot sidebar menu to change its working folder. The folder is fixed after the first message so a
Codex thread never silently mixes working directories.

New root messages create Codex threads. Continuing from the latest assistant node reuses its thread; replying from an
older assistant node creates an independent native fork at that checkpoint.

This milestone is text-only. Ink and file attachments remain visible in stored chats, but cannot yet be sent to Codex.

## Run from source

Prerequisites:

- Node.js and `npm`
- A working Codex installation, or `GRAPHCHAT_CODEX_BINARY` pointing to a Codex executable that supports `app-server`

```bash
cd /Users/sen/Code/graphchat-codex
npm ci
npm run dev
```

In a second terminal:

```bash
cd /Users/sen/Code/graphchat-codex
npm run electron:dev
```

The renderer runs on `http://localhost:3001`. The browser build can render the UI, but Codex authentication and App Server execution require Electron.

## Quickest way to start using it (pre-release)

1. Go to **Releases** on the right side of the repo page.
2. Download the installer for your OS:
   - Windows: `.exe`
   - macOS: `.dmg`
3. Install and open GraphChatV1.

Note: pre-release installers are currently unsigned, so your OS may show a security prompt.

## Running in browser (useful for phone/tablet testing)

### Prerequisite software

- A modern browser (Chrome, Edge, Safari)
- `npm` (only if you want to run the browser build locally from source)
- Provider API key(s) for AI features (BYO keys)

### Start in browser (local dev)

```bash
cd graphchatv1
npm install
npm run dev
```

Then open the local URL shown in the terminal (typically `http://localhost:5173`).

### Browser mode notes

- GraphChat calls provider APIs from the browser (BYO API key).
- Anthropic browser requests require `anthropic-dangerous-direct-browser-access: true` (GraphChat sets this automatically).
- Optional proxy for local dev: Vite can proxy `/api/openai/v1/*` and `/api/anthropic/v1/*` in `npm run dev` / `npm run preview`.
  - Set `VITE_OPENAI_API_BASE_URL=/api/openai/v1` and/or `VITE_ANTHROPIC_API_BASE_URL=/api/anthropic/v1` in `.env.local`.
- Local LaTeX compile with `latexmk` is a desktop feature.

## Running in desktop / standalone mode

### Prerequisite software

- For installer use (`.dmg` / `.exe`): no `npm` required.
- For desktop run from source: Node.js + `npm`.
- For local LaTeX compile in LaTeX nodes: TeX toolchain with both `latexmk` and `synctex` available on `PATH`.
  - macOS: MacTeX
  - Windows: MiKTeX or TeX Live

At startup in desktop mode, GraphChat checks for `latexmk` and `synctex` and shows guidance if missing.

### Start in desktop mode (from installer)

1. Download `.dmg` (macOS) or `.exe` (Windows) from **Releases**.
2. Install and launch GraphChatV1.

### Start in desktop mode (from source)

```bash
cd graphchatv1
npm install
npm run dev
# in a second terminal:
npm run electron:dev
```

In desktop mode, LaTeX nodes use local compilation via Electron IPC + `latexmk` and render PDF in the node editor.

## First things to try

- Drag to pan
- Pinch (touch) to zoom
- Trackpad pinch (Chrome/Edge): `ctrl` + wheel
- Tool: `Select` / `Draw` (pen always draws)
- Move node: drag a node
- Resize node: drag a corner handle
- Edit node: double-click / `Enter` (commit with click-outside / Done, cancel with `Esc`)
- Import PDF: click `Import PDF` (creates a new PDF node)
- New LaTeX node: click `+LaTeX`, write `.tex` on the left, click `Compile`, and preview PDF on the right
- Ink: draw on the canvas (world ink) or inside an ink node; `New Ink Node` creates another; `Clear Ink` clears world ink

### Verify Markdown/LaTeX in a text node

- Double-click a text node (or press `Enter`) to edit.
- Type Markdown plus math delimiters:
  - Inline: `\(e^{i\pi}+1=0\)`
  - Display: `\[\int_0^1 x^2 dx = \frac{1}{3}\]`

## API keys

For local dev, create `graphchatv1/.env.local`:

```bash
OPENAI_API_KEY=...
GEMINI_API_KEY=...
XAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

In desktop mode you can also set provider keys in-app:

- `Settings -> Models -> API keys`
- Keys saved there override `.env.local` values

## Desktop data location

In desktop mode, open `Settings -> Data -> Storage location` to:

- Choose a custom location for GraphChat-managed data (workspace/chats/attachments/payloads)
- Optionally move existing data when switching location
- Reset back to the default location

## Build installers

```bash
cd graphchatv1
npm install
npm run dist:mac   # builds .dmg on macOS
npm run dist:win   # builds NSIS .exe installer
# optional: remove old artifacts first
npm run dist:mac:fresh
npm run dist:win:fresh
# verify packaged artifacts before sharing
npm run release:verify
# copy only publishable installers to release/public
npm run release:collect
```

Artifacts are written to `release/`.

Notes:

- These builds are unsigned by default (good for local testing, not public distribution)
- Packaging requires network access on first run so `electron-builder` can fetch Electron binaries
- `release:verify` scans `dist/` + `release/` for secret-like tokens and local absolute paths
- `release:collect` stages only `.dmg` / `.exe` installers into `release/public`
