# Architecture Notes

## Decision Ledger

The decision ledger is EchoMind's write-side source of truth: `echomind decision add` records the decision context, options, choice, reason, result, preference signal, evidence, and optional repo/issue linkage as one Decision Record per file, while `echomind issue log` maintains a minimal issue index keyed by `<repo>#<issue_id>`. The ledger stores why a choice was made and how it turned out, but it is not itself the agent read surface.

## Distiller

The distiller turns accumulated Decision Records into draft Pattern Memory with `echomind distill`. In v0 it is deterministic frequency aggregation over `preference_signal`, bucketing signals into user-prefers, user-dislikes, and neutral groups with counts, confidence, and evidence record ids; it performs no model calls and marks the output as draft.

## Read Contract

The read contract is the bounded context exposed by `echomind context --repo <repo> [--issue <id>]`. It returns only the current issue entry when available, recent related decisions scoped by repo and/or issue, and the latest Pattern Memory; executing agents should read this object instead of scanning the full decision ledger or reconstructing intent from unrelated history.

## xmem Adapter

The xmem adapter is the promotion path from distilled Pattern Memory to xmem recall cards. `echomind promote` filters qualifying preferred and disliked signals, maps them into rule-shaped xmem cards, and either previews them or writes `xmem-export.cards.jsonl`; EchoMind only produces the export, while ingestion through `xmem import export <path>` remains an explicit human-audited step.
