#!/usr/bin/env node
import { parseArgs } from "node:util";
import { addDecision, loadDecisions } from "./decision.js";
import { upsertIssue } from "./issuelog.js";
import { distill } from "./distill.js";
import { buildContext } from "./readcontract.js";
import { promote } from "./promote.js";
import { echomindHome } from "./paths.js";
import type { DecisionType, Outcome, Priority } from "./types.js";

function out(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

function fail(msg: string): never {
  process.stderr.write(`echomind: ${msg}\n`);
  process.exit(1);
}

const HELP = `EchoMind v0 — decision ledger + pattern distiller (Learning Layer substrate)
data home: ${echomindHome()}  (override with ECHOMIND_HOME)

Usage:
  echomind decision add --context <s> --choice <s> --reason <s> [--option <s> ...]
                        [--result <s>] [--lesson <s>] [--signal <s>]
                        [--evidence <s> ...] [--issue <id>] [--repo <r>]
  echomind issue log --repo <r> --id <id> [--type feature|bug|refactor]
                     [--priority P0|P1|P2|P3] [--status <s>] [--pr <url>]
                     [--outcome merged|rejected|abandoned]
  echomind distill [--threshold <n>] [--force]
  echomind context --repo <r> [--issue <id>] [--limit <n>]   # agent read contract
  echomind ledger [--limit <n>]                              # human markdown view
  echomind promote [--min-confidence <n>] [--min-count <n>] [--write] [--out <p>]
                                                             # distilled prefs -> xmem cards (dry-run default)
  echomind help

preference_signal convention (drives distill bucketing):
  "prefers: <x>" / "+<x>"  -> user_prefers
  "dislikes: <y>" / "-<y>" -> user_dislikes
  anything else            -> neutral_signals

Boundaries: no auto-routing, no workflow mutation, no MMS config writes.`;

function cmdDecision(args: string[]): void {
  if (args[0] !== "add") fail(`unknown decision subcommand: ${args[0] ?? "(none)"} (expected: add)`);
  const { values } = parseArgs({
    args: args.slice(1),
    options: {
      context: { type: "string" },
      choice: { type: "string" },
      reason: { type: "string" },
      option: { type: "string", multiple: true },
      result: { type: "string" },
      lesson: { type: "string" },
      signal: { type: "string" },
      evidence: { type: "string", multiple: true },
      issue: { type: "string" },
      repo: { type: "string" },
    },
  });
  try {
    const { record, file } = addDecision({
      context: values.context ?? "",
      user_choice: values.choice ?? "",
      reason: values.reason ?? "",
      options: values.option,
      result: values.result,
      lesson: values.lesson,
      preference_signal: values.signal,
      evidence_refs: values.evidence,
      issue_id: values.issue,
      repo: values.repo,
    });
    out({ ok: true, id: record.id, file, record });
  } catch (e) {
    fail((e as Error).message);
  }
}

function cmdIssue(args: string[]): void {
  if (args[0] !== "log") fail(`unknown issue subcommand: ${args[0] ?? "(none)"} (expected: log)`);
  const { values } = parseArgs({
    args: args.slice(1),
    options: {
      repo: { type: "string" },
      id: { type: "string" },
      type: { type: "string" },
      priority: { type: "string" },
      status: { type: "string" },
      pr: { type: "string" },
      outcome: { type: "string" },
    },
  });
  if (!values.repo || !values.id) fail("issue log requires --repo and --id");
  const entry = upsertIssue({
    repo: values.repo,
    issue_id: values.id,
    type: values.type as DecisionType | undefined,
    priority: values.priority as Priority | undefined,
    status: values.status,
    final_pr: values.pr,
    outcome: values.outcome as Outcome | undefined,
  });
  out({ ok: true, entry });
}

function cmdDistill(args: string[]): void {
  const { values } = parseArgs({
    args,
    options: { threshold: { type: "string" }, force: { type: "boolean" } },
  });
  out(distill({
    threshold: values.threshold ? Number(values.threshold) : undefined,
    force: values.force,
  }));
}

function cmdContext(args: string[]): void {
  const { values } = parseArgs({
    args,
    options: { repo: { type: "string" }, issue: { type: "string" }, limit: { type: "string" } },
  });
  if (!values.repo && !values.issue) fail("context requires --repo and/or --issue");
  out(buildContext({
    repo: values.repo,
    issue: values.issue,
    limit: values.limit ? Number(values.limit) : undefined,
  }));
}

function cmdLedger(args: string[]): void {
  const { values } = parseArgs({ args, options: { limit: { type: "string" } } });
  const limit = values.limit ? Number(values.limit) : 20;
  const decisions = loadDecisions().slice(-limit).reverse();
  const lines: string[] = ["# EchoMind Ledger", ""];
  for (const d of decisions) {
    lines.push(`## ${d.id}  ·  ${d.created_at}`);
    if (d.repo || d.issue_id) lines.push(`- **issue**: ${d.repo ?? "?"}#${d.issue_id ?? "?"}`);
    lines.push(`- **context**: ${d.context}`);
    if (d.options.length) lines.push(`- **options**: ${d.options.join(" / ")}`);
    lines.push(`- **choice**: ${d.user_choice}`);
    lines.push(`- **reason**: ${d.reason}`);
    if (d.result) lines.push(`- **result**: ${d.result}`);
    if (d.lesson) lines.push(`- **lesson**: ${d.lesson}`);
    if (d.preference_signal) lines.push(`- **signal**: ${d.preference_signal}`);
    if (d.evidence_refs.length) lines.push(`- **evidence**: ${d.evidence_refs.join(", ")}`);
    lines.push("");
  }
  process.stdout.write(lines.join("\n") + "\n");
}

function cmdPromote(args: string[]): void {
  const { values } = parseArgs({
    args,
    options: {
      "min-confidence": { type: "string" },
      "min-count": { type: "string" },
      write: { type: "boolean" },
      out: { type: "string" },
    },
  });
  out(promote({
    minConfidence: values["min-confidence"] ? Number(values["min-confidence"]) : undefined,
    minCount: values["min-count"] ? Number(values["min-count"]) : undefined,
    write: values.write,
    out: values.out,
  }));
}

function main(): void {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "decision": return cmdDecision(rest);
    case "issue": return cmdIssue(rest);
    case "distill": return cmdDistill(rest);
    case "context": return cmdContext(rest);
    case "ledger": return cmdLedger(rest);
    case "promote": return cmdPromote(rest);
    case "help":
    case "--help":
    case "-h":
    case undefined:
      process.stdout.write(HELP + "\n");
      return;
    default:
      fail(`unknown command: ${cmd} (try: echomind help)`);
  }
}

main();
