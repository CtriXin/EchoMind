# EchoMind v0 Schema

Faithful to [multi-model-switch#47](https://github.com/CtriXin/multi-model-switch/issues/47).

## Decision Record

The training signal is `reason` + `result`, **not** `user_choice`. A bare
"I chose X" is not preference data. `context`, `user_choice`, `reason` are
required at write time; `result` is often backfilled after the outcome is known.

| field | type | required | notes |
|---|---|---|---|
| `id` | string | auto | `dr-YYYYMMDDhhmmss-<rand>` |
| `created_at` | ISO string | auto | |
| `issue_id` | string | no | linkage |
| `repo` | string | no | linkage |
| `context` | string | yes | what was being decided |
| `options` | string[] | no | choices considered |
| `user_choice` | string | yes | what was chosen |
| `reason` | string | yes | **why** — the signal |
| `result` | string | no | what happened (backfill OK) |
| `lesson` | string | no | what to carry forward |
| `preference_signal` | string | no | see convention below |
| `evidence_refs` | string[] | no | PR urls, commit ids, paths, links |

### preference_signal convention

Drives how `distill` buckets the signal:

- `prefers: <x>` or `+<x>` → `user_prefers`
- `dislikes: <y>` or `-<y>` → `user_dislikes`
- anything else → `neutral_signals`

## Issue Log Entry

Minimal per-issue index. Not a full copy of the issue.

`issue_id` / `repo` / `type(feature|bug|refactor)` / `priority(P0..P3)` /
`status` / `final_pr` / `outcome(merged|rejected|abandoned)` / `updated_at`.

Keyed by `<repo>#<issue_id>`.

## Pattern Memory

Produced by `distill`. v0 is a **deterministic frequency aggregation** — no
model calls. `draft: true` always, until a human/LLM refines it.

```jsonc
{
  "generated_at": "...",
  "from_records": ["dr-..."],
  "user_prefers":   [{ "signal": "small PRs", "count": 3, "confidence": 0.3, "evidence": ["dr-..."] }],
  "user_dislikes":  [{ "signal": "broad refactor without proof", "count": 2, "confidence": 0.2, "evidence": ["dr-..."] }],
  "neutral_signals": [],
  "draft": true,
  "note": "..."
}
```

## Storage layout

Under `ECHOMIND_HOME` (default `~/.echomind`):

```
decisions/<id>.json      # one decision record per file (source of truth)
issues/index.json        # issue log index, keyed by <repo>#<id>
patterns/<stamp>.json    # each distilled pattern memory
patterns/latest.json     # pointer copy of the most recent
state.json               # { last_count, last_at } for distill threshold
```

The code repo stays code-only; runtime data lives in `ECHOMIND_HOME`.
