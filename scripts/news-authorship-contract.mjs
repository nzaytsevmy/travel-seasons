// Check the material's author, not the global founder/Person graph node.
export function newsAuthorshipProblems(html) {
  const problems = [];
  const nodes = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap(match => {
      const data = JSON.parse(match[1]);
      return data['@graph'] ?? [data];
    });
  const materials = nodes.filter(node => ['NewsArticle', 'CollectionPage'].includes(node['@type']));
  if (materials.length !== 1) problems.push('Expected exactly one news material schema');
  for (const material of materials) {
    if (material.author?.['@id'] !== 'https://traveltribe.ru/#org') problems.push('News material author must be editorial organization');
  }
  const bylines = [...html.matchAll(/<p\b[^>]*class=["'][^"']*\b(?:nvp|nv|nvt)-byline\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi)];
  if (bylines.length !== 1) problems.push('Expected exactly one visible editorial byline');
  for (const [, byline] of bylines) {
    const text = byline.replace(/<[^>]+>/g, '').replace(/\s|&nbsp;|&#160;/g, ' ');
    if (!text.includes('Редакция TravelTribe')) problems.push('Editorial byline missing');
    if (byline.includes('/about/') || text.includes('Никита Зайцев')) problems.push('Personal attribution in editorial byline');
    if (!/href=["']\/["']/.test(byline)) problems.push('Editorial byline must link to site');
    if (!/href=["']https:\/\/t\.me\/traveltriberu["']/.test(byline) || !text.includes('@traveltriberu')) problems.push('Editorial byline must include the channel link');
  }
  return problems;
}
