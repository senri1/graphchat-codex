# Codex Event Model

Last checked against the installed Codex App Server schema on 2026-06-11.

GraphChat stores each assistant turn as an ordered `codexTimeline` on the
assistant node. The timeline contains agent messages, reasoning summaries, and
portable `CodexEvent` records. Its array order is the display order.

The same normalizer is used for live App Server notifications and
`thread/read` imports. Existing `content`, `thinkingSummary`, and `codexEvents`
fields remain compatibility projections so older saved chats stay readable.

## Item Mapping

| App Server item | GraphChat representation | Compact row | Expanded content |
| --- | --- | --- | --- |
| `userMessage` | User graph node | Existing node UI | Existing node UI |
| `agentMessage` | `agent_message` timeline item | Message text | Existing markdown UI |
| `reasoning` | `reasoning` timeline item | Reasoning row | Reasoning summary |
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

- `item/started` appends an in-progress item at its first observed position.
- Item-specific delta notifications update command output, plans, patches, and
  MCP progress without moving that item.
- Agent message and reasoning deltas update their item by `itemId`.
- `item/completed` replaces the in-progress fields with the authoritative final
  item while retaining its position and start timestamp.
- Imported turns preserve the App Server `turn.items` array order and are
  treated as completed snapshots.

Rows follow the official Codex information hierarchy: a compact status line by
default, with large output and diffs hidden behind expansion. GraphChat adapts
the presentation to graph nodes instead of depending on Codex desktop CSS or
private renderer code.

Portable assistant text is derived from `final_answer` messages when they are
present, otherwise from all agent messages. This lets GraphChat keep useful
plain text while still rendering commentary and tool activity in chronological
order.

## Next Parity Work

- Add a large side panel for long terminal output and diffs.
- Render image results and clickable file locations.
- Reconcile item updates made by another Codex client on the same computer.
