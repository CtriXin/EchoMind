import { dataPaths } from "./paths.js";
import { readJson } from "./store.js";
import { loadDecisions } from "./decision.js";
import { getIssue } from "./issuelog.js";
import type { DecisionRecord, IssueLogEntry, PatternMemory } from "./types.js";

export interface AgentContext {
  contract: string;
  issue?: IssueLogEntry;
  related_decisions: DecisionRecord[];
  latest_pattern?: PatternMemory;
}

const CONTRACT_NOTE =
  "Agent read contract: an executing agent may read ONLY this object — current issue context, related decision records, and the latest pattern memory. It must NOT scan full decision history to infer user intent.";

/**
 * Assemble the bounded context an executing agent is allowed to read.
 * Related = decisions matching the issue id and/or repo, most recent first.
 */
export function buildContext(opts: { repo?: string; issue?: string; limit?: number }): AgentContext {
  const p = dataPaths();
  const limit = opts.limit ?? 10;
  const related = loadDecisions()
    .filter((d) => {
      if (opts.issue && d.issue_id === opts.issue) return true;
      if (opts.repo && d.repo === opts.repo) return true;
      return false;
    })
    .slice(-limit)
    .reverse();
  const latest = readJson<PatternMemory | undefined>(p.latestPattern, undefined);
  const issue = opts.repo && opts.issue ? getIssue(opts.repo, opts.issue) : undefined;
  return { contract: CONTRACT_NOTE, issue, related_decisions: related, latest_pattern: latest };
}
