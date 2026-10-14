/** Most recent recorded check among the actual visible entries.
 * Retains the existing checked-field semantics; it does NOT establish that a
 * check-only action counts as a material change for SEO dateModified purposes.
 */
export function latestFeedCheck(entries) {
  if (!Array.isArray(entries)) throw new TypeError('Expected an array.');
  let latest = null;
  for (const entry of entries) {
    const value = entry?.data?.checked;
    if (value == null || value === '') continue;
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.valueOf())) continue;
    if (latest === null || date.valueOf() > latest.valueOf()) latest = new Date(date.valueOf());
  }
  return latest;
}
