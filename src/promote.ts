import path from "node:path";
import { dataPaths } from "./paths.js";
import { readJson, writeText } from "./store.js";
import type { PatternMemory, PatternSignal } from "./types.js";

// An xmem adapter card. Shape per ~/.xmem/schemas/xmem-export.cards.example.jsonl.
export interface XmemCard {
  id: string;
  type: "rule";
  title: string;
  status: "verified" | "inferred";
  confidence: number;
  aliases: string[];
  summary: string;
  regression_guard: string;
  evidence: { kind: string; path: string }[];
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "signal"
  );
}

function toCard(sig: PatternSignal, kind: "prefers" | "dislikes"): XmemCard {
  const verb = kind === "prefers" ? "Prefer" : "Avoid";
  return {
    id: `preference.${slugify(sig.signal)}`,
    type: "rule",
    title: sig.signal,
    status: sig.confidence >= 0.5 ? "verified" : "inferred",
    confidence: sig.confidence,
    aliases: [sig.signal],
    summary: `EchoMind-distilled preference (${kind}): ${sig.signal} — from ${sig.count} decision(s).`,
    regression_guard: `${verb}: ${sig.signal}`,
    evidence: sig.evidence.map((id) => ({ kind: "decision-record", path: id })),
  };
}

export interface PromoteOpts {
  minConfidence?: number;
  minCount?: number;
  write?: boolean;
  out?: string;
}

export interface PromoteResult {
  cards: XmemCard[];
  written: boolean;
  out?: string;
  note: string;
}

/**
 * Build xmem adapter cards from the latest Pattern Memory and (optionally) write
 * them as `xmem-export.cards.jsonl`. EchoMind only PRODUCES the export file; it
 * never runs `xmem sync` or touches xmem internals — ingestion is an explicit,
 * human-auditable step. See docs/XMEM_ADAPTER.md.
 */
export function promote(opts: PromoteOpts = {}): PromoteResult {
  const minConf = opts.minConfidence ?? 0.2;
  const minCount = opts.minCount ?? 2;
  const p = dataPaths();
  const pattern = readJson<PatternMemory | null>(p.latestPattern, null);
  if (!pattern) {
    return { cards: [], written: false, note: "no pattern memory yet — run `echomind distill` first" };
  }
  const pick = (sigs: PatternSignal[], kind: "prefers" | "dislikes") =>
    sigs.filter((s) => s.confidence >= minConf && s.count >= minCount).map((s) => toCard(s, kind));
  const cards = [...pick(pattern.user_prefers, "prefers"), ...pick(pattern.user_dislikes, "dislikes")];

  if (!opts.write) {
    return {
      cards,
      written: false,
      note: `dry-run: ${cards.length} candidate card(s) (min-confidence=${minConf}, min-count=${minCount}); pass --write to emit jsonl`,
    };
  }
  const out = opts.out ?? path.join(p.home, "xmem-export.cards.jsonl");
  const body = cards.map((c) => JSON.stringify(c)).join("\n") + (cards.length ? "\n" : "");
  writeText(out, body);
  return {
    cards,
    written: true,
    out,
    note: `wrote ${cards.length} card(s) to ${out}; ingest explicitly via xmem (e.g. \`xmem import export ${out}\`) — EchoMind does not run xmem itself`,
  };
}
