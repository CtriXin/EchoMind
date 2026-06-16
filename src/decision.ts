import path from "node:path";
import { dataPaths } from "./paths.js";
import { writeJson, listJson } from "./store.js";
import { newId } from "./ids.js";
import type { DecisionRecord } from "./types.js";

export interface DecisionInput {
  context: string;
  options?: string[];
  user_choice: string;
  reason: string;
  result?: string;
  lesson?: string;
  preference_signal?: string;
  evidence_refs?: string[];
  issue_id?: string;
  repo?: string;
}

export function addDecision(input: DecisionInput): { record: DecisionRecord; file: string } {
  if (!input.context?.trim() || !input.user_choice?.trim() || !input.reason?.trim()) {
    throw new Error(
      "decision requires context, user_choice (--choice), reason — reason is the training signal, not just the choice",
    );
  }
  const p = dataPaths();
  const record: DecisionRecord = {
    id: newId("dr"),
    created_at: new Date().toISOString(),
    issue_id: input.issue_id,
    repo: input.repo,
    context: input.context,
    options: input.options ?? [],
    user_choice: input.user_choice,
    reason: input.reason,
    result: input.result,
    lesson: input.lesson,
    preference_signal: input.preference_signal,
    evidence_refs: input.evidence_refs ?? [],
  };
  const file = path.join(p.decisions, `${record.id}.json`);
  writeJson(file, record);
  return { record, file };
}

export function loadDecisions(): DecisionRecord[] {
  const p = dataPaths();
  return listJson<DecisionRecord>(p.decisions)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}
