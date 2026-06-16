// EchoMind v0 schemas. Faithful to multi-model-switch#47.

export type DecisionType = "feature" | "bug" | "refactor";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type Outcome = "merged" | "rejected" | "abandoned";

/**
 * A single decision in the ledger.
 *
 * The training signal lives in `reason` + `result`, not in `user_choice`.
 * "I chose X" alone is not preference data; "I chose X because Y, outcome Z,
 * lesson L" is. `context`, `user_choice`, `reason` are required at write time.
 */
export interface DecisionRecord {
  id: string;
  created_at: string; // ISO 8601
  // linkage (optional)
  issue_id?: string;
  repo?: string;
  // core schema (#47)
  context: string;
  options: string[];
  user_choice: string;
  reason: string;
  result?: string; // may be backfilled after the outcome is known (e.g. post-merge)
  lesson?: string;
  /**
   * Free text, but the distiller honours a light convention:
   *   "prefers: <x>" / "+<x>"   -> user_prefers bucket
   *   "dislikes: <y>" / "-<y>"  -> user_dislikes bucket
   *   anything else             -> neutral_signals bucket
   */
  preference_signal?: string;
  evidence_refs: string[];
}

/** Minimal per-issue index entry. Not a full copy of the issue. */
export interface IssueLogEntry {
  issue_id: string;
  repo: string;
  type?: DecisionType;
  priority?: Priority;
  status?: string;
  final_pr?: string;
  outcome?: Outcome;
  updated_at: string;
}

export interface PatternSignal {
  signal: string;
  count: number;
  confidence: number; // count / total records considered
  evidence: string[]; // decision record ids
}

export interface PatternMemory {
  generated_at: string;
  from_records: string[];
  user_prefers: PatternSignal[];
  user_dislikes: PatternSignal[];
  neutral_signals: PatternSignal[];
  draft: boolean;
  note: string;
}
