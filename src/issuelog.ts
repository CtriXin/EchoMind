import { dataPaths } from "./paths.js";
import { readJson, writeJson } from "./store.js";
import type { IssueLogEntry } from "./types.js";

type IssueIndex = Record<string, IssueLogEntry>;

function key(repo: string, issue_id: string): string {
  return `${repo}#${issue_id}`;
}

export function upsertIssue(
  entry: Partial<IssueLogEntry> & { repo: string; issue_id: string },
): IssueLogEntry {
  const p = dataPaths();
  const idx = readJson<IssueIndex>(p.issuesIndex, {});
  const k = key(entry.repo, entry.issue_id);
  const merged = {
    ...(idx[k] ?? {}),
    ...entry,
    updated_at: new Date().toISOString(),
  } as IssueLogEntry;
  idx[k] = merged;
  writeJson(p.issuesIndex, idx);
  return merged;
}

export function getIssue(repo: string, issue_id: string): IssueLogEntry | undefined {
  const p = dataPaths();
  const idx = readJson<IssueIndex>(p.issuesIndex, {});
  return idx[key(repo, issue_id)];
}
