# Codex Event Model

Last checked against the installed Codex App Server schema on 2026-06-11.

GraphChat keeps assistant text and reasoning in their existing node fields.
Non-conversational `ThreadItem` records are normalized into portable
`CodexEvent` records stored on the assistant node. The same normalizer is used
for live App Server notifications and `thread/read` imports.

## Item Mapping

| App Server item | GraphChat representation | Compact row | Expanded content |
| --- | --- | --- | --- |
| `userMessage` | User graph node | Existing node UI | Existing node UI |
| `agentMessage` | Assistant graph node | Existing node UI | Existing node UI |
| `reasoning` | `thinkingSummary` | Thinking summary | Reasoning summary |
| `hookPrompt` | `hook_prompt` | Hook prompt | Prompt fragments |
| `plan` | `plan` | Updated plan | Plan text |
| `commandExecution` | `command` | Command and status | CWD, output, exit code |
| `fileChange` | `file_change` | Changed-file count | Paths and diffs |
| `mcpToolCall` | `mcp_tool` | Tool and server | Arguments and result/error |
| `dynamicToolCall` | `dynamic_tool` | Tool and namespace | Arguments and content |
| `collabAgentToolCall` | `collab_agent` | Agent action | Prompt and target summary |
| `webSearch` | `web_search` | Search query | Action summary |
| `imageView` | `image_view` | Viewed image | Local path |
| `imageGeneration` | `image_generation` | Generated image | Prompt and saved path |
| `enteredReviewMode` | `review_entered` | Entered review mode | Review text |
| `exitedReviewMode` | `review_exited` | Exited review mode | Review text |
| `contextCompaction` | `context_compaction` | Compacted context | None |

Unknown future item types remain available in raw imported payloads but are not
rendered until a normalizer is added. This prevents an App Server upgrade from
making existing chats unreadable.

## Lifecycle

- `item/started` creates an in-progress row.
- Item-specific delta notifications update command output, plans, patches, and
  MCP progress.
- `item/completed` replaces the in-progress fields with the authoritative final
  item while retaining its start timestamp.
- Imported turns are treated as completed snapshots.

Rows follow the official Codex information hierarchy: a compact status line by
default, with large output and diffs hidden behind expansion. GraphChat adapts
the presentation to graph nodes instead of depending on Codex desktop CSS or
private renderer code.

## Next Parity Work

- Preserve exact ordering between reasoning, messages, and tool items.
- Add a large side panel for long terminal output and diffs.
- Render image results and clickable file locations.
- Reconcile item updates made by another Codex client on the same computer.
