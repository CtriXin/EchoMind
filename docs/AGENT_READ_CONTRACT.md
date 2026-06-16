# Agent Read Contract

An executing agent may read **only** the bounded context EchoMind assembles —
not the full decision history. This keeps the agent from "脑补" (hallucinating)
user intent out of unrelated history.

## The only allowed read

```bash
echomind context --repo <repo> [--issue <id>] [--limit <n>]
```

Returns exactly:

```jsonc
{
  "contract": "Agent read contract: ...",
  "issue": { /* the IssueLogEntry, if any */ },
  "related_decisions": [ /* recent decisions matching issue/repo */ ],
  "latest_pattern": { /* the most recent PatternMemory, if any */ }
}
```

## Rules

1. The agent reads the output of `echomind context` and nothing else from EchoMind.
2. It must **not** open `decisions/*.json` directly, walk the whole ledger, or
   read old patterns to reconstruct preferences.
3. `related_decisions` is scoped by issue id and/or repo, capped by `--limit`
   (default 10), most recent first.
4. `latest_pattern` is a **draft** in v0. Treat it as a hint, not a rule.

## Why bounded

The value of EchoMind is "the agent reads your distilled preferences before
acting" — a retrieval substrate, not a trained model. Unbounded history reads
re-introduce exactly the noise the substrate exists to filter.

## Write side (not part of the read contract)

Recording is a separate concern. The automation loop
([multi-model-switch#48](https://github.com/CtriXin/multi-model-switch/issues/48))
writes one Decision Record per human-merge decision:

```bash
echomind decision add \
  --repo <repo> --issue <id> \
  --context "..." --choice "merge" --reason "..." \
  --result "merged" --signal "prefers: small verified PRs" \
  --evidence "<pr-url>"
```
