import YAML from 'yaml';

// Sitemap generation and browser fixtures must interpret comments and quoted
// values the same way as the content collection, rather than treating them as
// part of a topic or silently missing an archived flag.
export function newsFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('News frontmatter is missing');
  const data = YAML.parse(match[1]);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid news frontmatter');
  return data;
}
