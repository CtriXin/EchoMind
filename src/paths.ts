import os from "node:os";
import path from "node:path";
import fs from "node:fs";

/** Runtime data home. Code repo stays code-only; records live here. */
export function echomindHome(): string {
  const override = process.env.ECHOMIND_HOME?.trim();
  const base = override && override.length > 0
    ? override
    : path.join(os.homedir(), ".echomind");
  return path.resolve(base);
}

export function dataPaths() {
  const home = echomindHome();
  return {
    home,
    decisions: path.join(home, "decisions"),
    issuesIndex: path.join(home, "issues", "index.json"),
    patternsDir: path.join(home, "patterns"),
    latestPattern: path.join(home, "patterns", "latest.json"),
    state: path.join(home, "state.json"),
  };
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
