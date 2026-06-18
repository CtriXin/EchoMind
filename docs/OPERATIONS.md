# EchoMind Operations

Keep local operations conservative. EchoMind stores user decision data locally,
so validation and troubleshooting should avoid destructive changes.

## Data Directory

By default, EchoMind stores data under:

```bash
~/.echomind
```

Set `ECHOMIND_HOME` to use a different local data directory:

```bash
ECHOMIND_HOME=/path/to/echomind-data echomind ledger
```

## Local Validation

Run these commands before opening or merging changes:

```bash
npm install
npm run build
npm run smoke
```

## Safe Troubleshooting

1. Do not delete user data from `~/.echomind` or the directory selected by
   `ECHOMIND_HOME`.
2. Back up or copy evidence first, including command output, relevant files, and
   the data directory snapshot needed to reproduce the issue.
3. Do not write to MMS config while diagnosing EchoMind issues.
