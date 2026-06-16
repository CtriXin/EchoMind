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
                                                xmem import export <path>  →  gateway recall
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
xmem import export ~/.echomind/xmem-export.cards.jsonl
xmem context "EchoMind xmem adapter JSONL import export preference"
```

Optional repo helper:

```bash
scripts/promote-and-sync.sh       # audit-only: prints commands, runs promote dry-run
scripts/promote-and-sync.sh --yes # writes export, then runs xmem import export <path>
```

The helper intentionally stays outside TypeScript: EchoMind remains a producer,
and xmem ingestion remains an explicit CLI step.

## Verified ingest contract (2026-06-16)

Executed on this machine with `/Users/xin/.local/bin/xmem`.

`xmem --help` lists `import` and `sync`, and `xmem doctor` confirms the global
registry at `~/.xmem/registry.sqlite`:

```text
xmem_doctor: warn
components:
- registry: ok ok (cards=2902 projects=1469)
- current_repo: warn unregistered (/Users/xin/auto-skills/CtriXin-repo/EchoMind)
```

The export JSONL is not ingested with `xmem import <file>`:

```text
$ xmem import /Users/xin/.echomind/xmem-export.cards.jsonl
xmem import: error: argument <source>: invalid choice: '/Users/xin/.echomind/xmem-export.cards.jsonl'
```

`xmem sync` also does not accept a file path:

```text
$ xmem sync /Users/xin/.echomind/xmem-export.cards.jsonl
xmem: error: unrecognized arguments: /Users/xin/.echomind/xmem-export.cards.jsonl
```

The exact adapter command is:

```text
$ xmem import export --help
用法: 用法: xmem import export [-h] [path]

参数:
  path
```

End-to-end run:

```text
$ node dist/cli.js distill --force
"skipped": false
"signal": "EchoMind xmem adapter JSONL is ingested with xmem import export after audit"

$ node dist/cli.js promote
"written": false
"note": "dry-run: 1 candidate card(s) (min-confidence=0.2, min-count=2); pass --write to emit jsonl"

$ scripts/promote-and-sync.sh
Audit plan:
- EchoMind export: /Users/xin/.echomind/xmem-export.cards.jsonl
- xmem ingest uses the existing export adapter; no xmem engine files are modified.
- Commands:
  node dist/cli.js promote --out /Users/xin/.echomind/xmem-export.cards.jsonl
  node dist/cli.js promote --write --out /Users/xin/.echomind/xmem-export.cards.jsonl
  /Users/xin/.local/bin/xmem import export /Users/xin/.echomind/xmem-export.cards.jsonl
Dry-run only. Re-run with --yes to write and ingest.

$ scripts/promote-and-sync.sh --yes
Writing export:
"written": true
"out": "/Users/xin/.echomind/xmem-export.cards.jsonl"
Ingesting into xmem:
{
  "cards": 1,
  "evidence": 2,
  "skipped_bug_patterns": 0
}
```

Recall verification:

```text
$ xmem context "EchoMind xmem adapter JSONL import export preference"
rules[5]:
  - id: preference.echomind-xmem-adapter-jsonl-is-ingested-with-xmem-import-exp
    rank: 1
    type: rule
    truth: verified
    confidence: 1.0
    source: xmem-export
    title: EchoMind xmem adapter JSONL is ingested with xmem import export after audit
    source_path: /Users/xin/.echomind/xmem-export.cards.jsonl

$ xmem recall "EchoMind xmem adapter JSONL import export preference"
memories:
- id: preference.echomind-xmem-adapter-jsonl-is-ingested-with-xmem-import-exp score=26.5 truth=verified confidence=1.0 title=EchoMind xmem adapter JSONL is ingested with xmem import export after audit
  path: /Users/xin/.echomind/xmem-export.cards.jsonl
```

## Closed items

1. Exact command verified: `xmem import export <path>`.
2. No source-registration path was exposed by `xmem --help`, `xmem sync --help`,
   or `xmem doctor`; use the existing `import export` adapter instead.
3. End-to-end recall verified through `xmem context` and `xmem recall`.
