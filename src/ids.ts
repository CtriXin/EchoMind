/** Sortable, human-skimmable id: <prefix>-YYYYMMDDhhmmss-<rand>. */
export function newId(prefix: string): string {
  const ts = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

/** Compact timestamp stamp for filenames. */
export function stamp(iso: string): string {
  return iso.replace(/[-:.TZ]/g, "").slice(0, 8);
}
