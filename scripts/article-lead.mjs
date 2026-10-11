import { parse } from 'yaml';

// Use the same YAML value that the page renders, including folded/multiline leads.
export function readArticleLead(frontmatter) {
  const value = parse(frontmatter)?.lead;
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new TypeError('Article lead must be a YAML string');
  return value;
}
