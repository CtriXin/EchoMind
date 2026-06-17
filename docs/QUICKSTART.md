# EchoMind Quickstart

Use these commands to record a decision, index the issue, distill patterns, read bounded context, inspect the ledger, and promote distilled preferences.

```bash
# record a decision (reason + result are the signal, not just the choice)
echomind decision add \
  --repo multi-model-switch --issue 48 \
  --context "Looper vs build loop in Runtimia" \
  --option "use Looper" --option "build in Runtimia" \
  --choice "use Looper for non-sensitive repos" \
  --reason "Runtimia stays the company control plane; avoid a 2nd control plane" \
  --result "trial scoped to P2 issues on one testbed repo" \
  --signal "prefers: single source of truth for model/source policy" \
  --evidence "https://github.com/CtriXin/multi-model-switch/issues/48"

# minimal issue index
echomind issue log --repo multi-model-switch --id 48 --type feature --priority P2 --status open

# distill a draft pattern memory (every 10 records, or --force)
echomind distill --force

# the ONLY thing an executing agent should read
echomind context --repo multi-model-switch --issue 48

# human-readable ledger
echomind ledger

# distilled preferences -> xmem cards (dry-run lists candidates; --write emits jsonl)
echomind promote
echomind promote --write
```
