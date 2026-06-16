import path from "node:path";
import { dataPaths } from "./paths.js";
import { readJson, writeJson } from "./store.js";
import { loadDecisions } from "./decision.js";
import { stamp } from "./ids.js";
import type { DecisionRecord, PatternMemory, PatternSignal } from "./types.js";

interface DistillState {
  last_count: number;
  last_at?: string;
}

type Bucket = "prefers" | "dislikes" | "neutral";

function bucketOf(signal: string): Bucket {
  const s = signal.trim().toLowerCase();
  if (s.startsWith("prefers:") || s.startsWith("prefer:") || s.startsWith("+")) return "prefers";
  if (s.startsWith("dislikes:") || s.startsWith("dislike:") || s.startsWith("-")) return "dislikes";
  return "neutral";
}

function stripPrefix(signal: string): string {
  return signal
    .replace(/^\s*(prefers?|dislikes?)\s*:\s*/i, "")
    .replace(/^\s*[+-]\s*/, "")
    .trim();
}

function aggregate(records: DecisionRecord[], want: Bucket): PatternSignal[] {
  const map = new Map<string, string[]>();
  for (const r of records) {
    const sig = r.preference_signal?.trim();
    if (!sig || bucketOf(sig) !== want) continue;
    const text = stripPrefix(sig);
    if (!text) continue;
    const ids = map.get(text) ?? [];
    ids.push(r.id);
    map.set(text, ids);
  }
  const total = records.length || 1;
  return [...map.entries()]
    .map(([signal, evidence]) => ({
      signal,
      count: evidence.length,
      confidence: Math.round((evidence.length / total) * 100) / 100,
      evidence,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * v0 distill: deterministic frequency aggregation over `preference_signal`.
 * Produces a draft PatternMemory. No model calls — refine via human/LLM later.
 */
export function distill(
  opts: { threshold?: number; force?: boolean } = {},
): { skipped: boolean; reason?: string; pattern?: PatternMemory } {
  const threshold = opts.threshold ?? 10;
  const p = dataPaths();
  const decisions = loadDecisions();
  const state = readJson<DistillState>(p.state, { last_count: 0 });
  const since = decisions.length - state.last_count;

  if (!opts.force && since < threshold) {
    return {
      skipped: true,
      reason: `only ${since} new record(s) since last distill (threshold ${threshold}); use --force to override`,
    };
  }

  const pattern: PatternMemory = {
    generated_at: new Date().toISOString(),
    from_records: decisions.map((d) => d.id),
    user_prefers: aggregate(decisions, "prefers"),
    user_dislikes: aggregate(decisions, "dislikes"),
    neutral_signals: aggregate(decisions, "neutral"),
    draft: true,
    note: "v0 deterministic frequency aggregation over preference_signal. confidence = count/total. Refine via human/LLM before treating as a settled preference.",
  };

  writeJson(path.join(p.patternsDir, `${stamp(pattern.generated_at)}.json`), pattern);
  writeJson(p.latestPattern, pattern);
  writeJson(p.state, { last_count: decisions.length, last_at: pattern.generated_at });
  return { skipped: false, pattern };
}
