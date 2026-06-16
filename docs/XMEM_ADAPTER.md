# EchoMind → xmem (Learning Layer recall seam)

## Why

EchoMind captures decisions and distills preferences, but the surface that
actually reaches an agent's context each session is **xmem** — its gateway recall
hook reads xmem *cards*. So EchoMind does not build its own injection. It acts as
an **xmem adapter**: it emits cards xmem already knows how to ingest and recall.

(Note: the recall surface is xmem cards, **not** Claude-native
`~/.claude/.../memory/MEMORY.md`.)

## Division of labor

- **issue-record** = evidence
- **xmem** = universal recall surface (gateway hook → cards)
- **EchoMind** = decision capture + distill engine, *and* an xmem data source

## The seam

```
echomind distill  →  Pattern Memory  →  echomind promote  →  xmem-export.cards.jsonl
                                                                     │
                                                  (human, explicit)  ▼
                                                xmem import / xmem sync  →  gateway recall
```

EchoMind only **produces** the export file. It never runs xmem, never touches
xmem internals, never writes `~/.claude`. Ingestion is an explicit,
human-auditable step.

## Card mapping

Each qualifying distilled signal becomes one card (shape per
`~/.xmem/schemas/xmem-export.cards.example.jsonl`):

| field | from |
|---|---|
| `id` | `preference.<slug(signal)>` |
| `type` | `rule` (behavioral preference) |
| `title` | the signal |
| `status` | `verified` if confidence ≥ 0.5 else `inferred` |
| `confidence` | distilled count / total |
| `aliases` | `[signal]` |
| `summary` | `EchoMind-distilled preference (prefers\|dislikes): …` |
| `regression_guard` | `Prefer: <signal>` / `Avoid: <signal>` |
| `evidence` | the Decision Record ids the signal came from |

## Filters / safety

- only `confidence ≥ --min-confidence` (default `0.2`) and `count ≥ --min-count` (default `2`)
- `--dry-run` (default) lists candidates; `--write` emits the jsonl
- evidence points back to Decision Records → traceable, removable
- ingest is a separate explicit step — never automatic

## Tiers (where preferences land)

- **global** = `~/.xmem` (`project_id: xin`, root `/Users/xin`) — cross-project preferences
- **per-repo** = `<repo>/.xmem`, pushed up via `xmem index` — repo-specific

Cross-project taste → global.

## Usage

```bash
echomind distill --force
echomind promote                 # dry-run: list candidate cards
echomind promote --write         # emit $ECHOMIND_HOME/xmem-export.cards.jsonl
# then, explicitly (human-audited):
xmem import ~/.echomind/xmem-export.cards.jsonl   # verify exact ingest flag
xmem sync
```

## Open items (verify before relying on auto-recall)

1. Exact xmem ingest command for an export jsonl (`xmem import <file>` vs
   registering the path as a source consumed by `xmem sync`) — confirm against
   `xmem --help` / `xmem doctor`.
2. Optionally register EchoMind's export path as a standing xmem source so
   `xmem sync` picks it up without a manual import.
3. End-to-end check: after ingest, a fresh session's xmem recall surfaces the
   promoted preference.
