#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
default_out="${ECHOMIND_HOME:-$HOME/.echomind}/xmem-export.cards.jsonl"
out_path="$default_out"
yes=0
promote_extra=()

usage() {
  cat <<'EOF'
Usage: scripts/promote-and-sync.sh [--yes] [--out <path>] [--min-confidence <n>] [--min-count <n>]

Default mode is audit-only: it runs `echomind promote` as a dry-run and prints
the exact write/import commands. Pass --yes to write the export and ingest it via:

  xmem import export <path>

Environment:
  ECHOMIND_BIN  Optional command used instead of local dist CLI.
  XMEM_BIN      Optional xmem command path. Defaults to `xmem`.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      yes=1
      shift
      ;;
    --out)
      [[ $# -ge 2 ]] || { echo "missing value for --out" >&2; exit 2; }
      out_path="$2"
      shift 2
      ;;
    --min-confidence|--min-count)
      [[ $# -ge 2 ]] || { echo "missing value for $1" >&2; exit 2; }
      promote_extra+=("$1" "$2")
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -n "${ECHOMIND_BIN:-}" ]]; then
  # Intentional shell parsing lets callers pass wrappers such as: ECHOMIND_BIN="node dist/cli.js".
  read -r -a echomind_cmd <<<"$ECHOMIND_BIN"
elif [[ -f "$repo_root/dist/cli.js" ]]; then
  echomind_cmd=(node "$repo_root/dist/cli.js")
else
  echo "dist/cli.js not found; run \`npm run build\` first or set ECHOMIND_BIN." >&2
  exit 1
fi

if [[ -n "${XMEM_BIN:-}" ]]; then
  read -r -a xmem_cmd <<<"$XMEM_BIN"
else
  xmem_cmd=(xmem)
fi

dry_run_cmd=("${echomind_cmd[@]}" promote)
write_cmd=("${echomind_cmd[@]}" promote)
if [[ ${#promote_extra[@]} -gt 0 ]]; then
  dry_run_cmd+=("${promote_extra[@]}")
  write_cmd+=("${promote_extra[@]}")
fi
dry_run_cmd+=(--out "$out_path")
write_cmd+=(--write --out "$out_path")
import_cmd=("${xmem_cmd[@]}" import export "$out_path")

print_cmd() {
  printf '  '
  printf '%q ' "$@"
  printf '\n'
}

echo "Audit plan:"
echo "- EchoMind export: $out_path"
echo "- xmem ingest uses the existing export adapter; no xmem engine files are modified."
echo "- Commands:"
print_cmd "${dry_run_cmd[@]}"
print_cmd "${write_cmd[@]}"
print_cmd "${import_cmd[@]}"

echo
echo "EchoMind dry-run:"
"${dry_run_cmd[@]}"

if [[ "$yes" -ne 1 ]]; then
  echo
  echo "Dry-run only. Re-run with --yes to write and ingest."
  exit 0
fi

echo
echo "Writing export:"
"${write_cmd[@]}"

if [[ ! -s "$out_path" ]]; then
  echo "export file is missing or empty: $out_path" >&2
  exit 1
fi

echo
echo "Ingesting into xmem:"
"${import_cmd[@]}"
