# EchoMind

> Learning Layer substrate for the AI Operating System
> ([multi-model-switch#46](https://github.com/CtriXin/multi-model-switch/issues/46) /
> [#47](https://github.com/CtriXin/multi-model-switch/issues/47)).

EchoMind is a **thin recorder**: a decision ledger + pattern distiller. It stores
*why you chose, why you rejected, and how it turned out*, then exposes a bounded
context so an executing agent reads your distilled preferences before acting.

It is **not** a trained model and **not** a controller:

- no auto-routing
- no workflow mutation
- no MMS config writes

It only reads your records (and, later, issue-tracking / GitHub / Runtimia
issues) and writes its own ledger.

## Why TS but no TS at runtime

Authored in TypeScript, shipped as compiled JS. `npx` runs `dist/cli.js` — users
need **no** TypeScript installed.

```
src/*.ts  --tsc-->  dist/*.js  -->  npx @ctrixin/echomind
```

Local dev runs straight from TS via Node's type stripping (Node ≥ 22.6, no deps):

```bash
node --experimental-strip-types src/cli.ts help   # or: npm run dev -- help
```

Build for publish:

```bash
npm install   # dev deps: typescript, @types/node
npm run build # tsc -> dist/
```

## Quickstart

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

## Data home

Records live under `ECHOMIND_HOME` (default `~/.echomind`), not in this repo.
See [docs/SCHEMA.md](docs/SCHEMA.md) for layout and
[docs/AGENT_READ_CONTRACT.md](docs/AGENT_READ_CONTRACT.md) for the read boundary.

## Seam with automation

[multi-model-switch#48](https://github.com/CtriXin/multi-model-switch/issues/48)
(Looper × MMS trial) emits one Decision Record per human-merge decision. That is
EchoMind's primary input — running the two together is what makes the ledger
worth distilling.

## Seam with xmem (recall)

EchoMind does not build its own session injection. It acts as an **xmem adapter**:
`echomind promote` turns distilled preferences into `xmem-export.cards.jsonl`,
which xmem ingests and recalls into every session via its gateway hook. EchoMind
only produces the export file; ingestion (`xmem import` / `xmem sync`) is an
explicit, human-audited step. See [docs/XMEM_ADAPTER.md](docs/XMEM_ADAPTER.md).
